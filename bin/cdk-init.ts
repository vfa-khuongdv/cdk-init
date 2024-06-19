#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkInitStack } from '../lib/cdk-init-stack';
import { getEnv } from '../lib/shared/helper';

const app = new cdk.App();
new CdkInitStack(app, 'CdkInitStack', {
  env: {
    account: getEnv('CDK_ACCOUNT_ID'),
    region: getEnv('CDK_REGION')
  },
});