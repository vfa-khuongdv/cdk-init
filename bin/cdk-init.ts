#!/usr/bin/env node
/**
 * CDK Application Entry Point
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkInitStack } from '../lib/cdk-init-stack';
import { envConfig } from '../config/environment.config';

// Initialize CDK app
const app = new cdk.App();

// Get environment configuration
const env = envConfig.getEnvironment();

// Create main stack
new CdkInitStack(app, `${env.prefix}-stack`, {
  env: env,
});

// Synthesize the app
app.synth();