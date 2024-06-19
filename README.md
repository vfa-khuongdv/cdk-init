# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.


## 1. Copy file environment
`
cp .env.dev .env
`
## 2. Change the environment to matching with your AWS deployment

```
STAGE=dev
PROJECT=cdk-init
CDK_REGION=ap-northeast-1
CDK_ACCOUNT_ID=123456789
CIDR_BLOCK=10.128.0.0/16
```

## 3. Bootstrap your AWS account
`
yarn cdk bootstrap
`
## 4. Deploy to AWS
`
yarn cdk deploy
`


## Useful commands

* `yarn build`   compile typescript to js
* `yarn watch`   watch for changes and compile
* `yarn test`    perform the jest unit tests
* `yarn cdk deploy`  deploy this stack to your default AWS account/region
* `yarn cdk diff`    compare deployed stack with current state
* `yarn cdk synth`   emits the synthesized CloudFormation template
