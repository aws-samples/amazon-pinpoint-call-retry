const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log("Lambda triggered with event: " + JSON.stringify(event));
  //Source of this lambda function is the SQS engine.
  if(!event.Records) return "ERROR: Unexpected payload.";
  for (const item of event.Records) {
       let body=JSON.parse(item.body);
       let messageId=body.MessageId;
       try{
         //use messageid to correlate to the content in the DynamoDB table.
         let result=await getDynamoItem (messageId);
         if(!result.Item) {
            throw new Error("Cannot find messageId:" + messageId + " in DynamoDB!");
          }
         let retryCount=result.Item.RetryCount;
         if(!retryCount) retryCount=0;
         retryCount++;
         if(retryCount<process.env.MAX_TRY){
            //invoke call generator lambda.
            let invocationEvent={
                Message: result.Item.Event.Message,
                PhoneNumber: result.Item.Event.PhoneNumber,
                RetryCount: retryCount
            };
            let invocationParams = {
                FunctionName: process.env.CALL_GENERATOR_LAMBDA_ARN,
                InvocationType: 'RequestResponse',
                LogType: 'Tail',
                Payload: Buffer.from(JSON.stringify(invocationEvent))
            };
            const lambda = new AWS.Lambda();
            const lambdaInvokeResp = await lambda.invoke(invocationParams).promise();
            if(lambdaInvokeResp.Payload){
              console.log("Invoked call generator lambda. Result: " + lambdaInvokeResp.Payload);
            }
         }
         else
             console.log("Maximum tries achieved. Ending the retry loop.");
       }
       catch(err){
         console.error(err.name, err.message);
       }
  }//for
  return "OK";
};
async function getDynamoItem (messageId){
  let params = {
      TableName: 'call_attempts',
      Key:{
          "MessageId": messageId
      }
  };
  return new Promise((res,rej)=>{
      docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            rej("Unable to read item. Error JSON:" + JSON.stringify(err));
        } else {
            res(data);
        }
   });
  });
}
