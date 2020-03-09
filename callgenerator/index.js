const AWS = require('aws-sdk');
const pinpointsmsvoice = new AWS.PinpointSMSVoice({apiVersion: '2018-09-05'});
const ddbdc = new AWS.DynamoDB.DocumentClient();

function triggerCall (eventData) {
    return new Promise ((resolve,reject) => {
        var call_parameters = {
            Content: {
                SSMLMessage: {
                    LanguageCode : process.env.LANGUAGE,
                    Text : eventData.Message,
                    VoiceId: process.env.VOICE
                }
            },
            ConfigurationSetName: process.env.CONFIG_SET_NAME,
            OriginationPhoneNumber: process.env.LONG_CODE,
            DestinationPhoneNumber: eventData.PhoneNumber
        };
        pinpointsmsvoice.sendVoiceMessage (call_parameters, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

function writeToDynamoDB(event, messageId){
    return new Promise((resolve,reject)=>{
        const now = new Date();
        const timestamp = Math.round(now.getTime() / 1000);
        let rc=0;
        if(event.RetryCount) {
          rc = event.RetryCount;
        }
        var params = {
            TableName: "call_attempts",
            Item: {
                "MessageId": messageId,
                "RetryCount": rc,
                "Timestamp": timestamp,
                "Event": event
            }
        };
        console.log ("Writing to DynamoDB " + JSON.stringify(params));
        ddbdc.put(params, function (err) {
         if (err) {
             reject(err);
         }
         resolve("OK");
        });
    });
}

exports.handler = async (event, context) => {
    let messageId;
    let result;
    console.log("Lambda triggered with event: " + JSON.stringify(event));
    try {
      result = await triggerCall (event);
    }
    catch (err) {
        console.error("Error while calling Pinpoint: " + err.message);
        return err.message;
    }
    if(result.MessageId){
        console.log("Pinpoint call initiated. Message id is " + result.MessageId);
        //write the call information to dynamodb
        try {
            result = await writeToDynamoDB (event, result.MessageId);
            return result;
        }
        catch (err) {
            console.error("Error while writing to DynamoDB: " + err.message);
            return err.message;
        }
    }
    else
    {
      //pinpoint returned a functional error.
      console.error("Cannot initiate the call. Message from Pinpoint API: " + JSON.stringify(result));
    }
};
