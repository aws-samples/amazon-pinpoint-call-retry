## Amazon Pinpoint Call Retry

Retrying Undelivered Voice Messages with Amazon Pinpoint


## License Summary
This sample code is made available under a modified MIT-0 license. See the LICENSE file.

## Setup process
This package requires AWS Serverless Application Model (AWS SAM) Command Line Interface (CLI) to deploy to your account. Instructions for installing and setting up SAM CLI can be found here: https://aws.amazon.com/serverless/sam/

## Prerequisites
This serverless application requires that you have an AWS Pinpoint project set up, and configured with voice support and a long code. You will need to specify the long code in the template.yaml file before deploing this package. The Long code must be owned by the same account as Pinpoint and your SAM package are deployed in.

Optionally update the language code, and the voice to be used to generate the speach via AWS Polly. The list of Polly voices can be found here: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html

## Installing dependencies
Use npm install in the callgenerator and retrycallgenerator directories to install any required packages prior to packaging and deploying this SAM application.

## Packaging and deployment
Firstly, we need a S3 bucket where we can upload our Lambda functions packaged as ZIP before we deploy anything - If you don't have a S3 bucket to store code artifacts then this is a good time to create one:
~~~
aws s3 mb s3://BUCKET_NAME
~~~
Next, run the following command to package our Lambda function to S3:
~~~
sam package \
    --template-file template.yaml \
    --output-template-file output_template.yaml \
    --s3-bucket REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME
~~~
Next, the following command will create a Cloudformation Stack and deploy your SAM resources.
~~~
sam deploy \
    --template-file output_template.yaml \
    --stack-name blogstack \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides maxRetry=2 longCode=REPLACE_THIS_WITH_YOUR_LONG_CODE retryDelaySeconds=60
~~~    
See Serverless Application Model (SAM) HOWTO Guide for more details in how to get started.
