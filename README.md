# Dyondo AWS Infrastructure with CDK

This CDK project contains for Dyondo infrastructure, for both the frontend and the API.

The API will be hosted as a Fargate service.

The Frontend will be hosted in ???

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   installs node_modules, and compile typescript to js
 * `npm run clean`   removes all build outputs, and node_modules
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
