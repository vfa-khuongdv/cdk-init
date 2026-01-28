/**
 * Example usage file demonstrating how to use this template
 * This file is for reference only and should not be committed
 */

// Example 1: Adding a new S3 bucket construct
// ------------------------------------------
// 1. Create file: lib/constructs/s3.construct.ts

import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BaseConstruct } from '../shared/base.construct';
import { IEnvironmentConfig } from '../types';
import { RemovalPolicy } from 'aws-cdk-lib';

export class S3Construct extends BaseConstruct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, env: IEnvironmentConfig) {
    super(scope, id, env);
    
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: this.getResourceName('data-bucket'),
      versioned: env.stage === 'prod',
      removalPolicy: env.stage === 'prod' 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY,
      autoDeleteObjects: env.stage !== 'prod',
    });

    this.applyTags(this.getCommonTags());
    this.createOutput('BucketName', this.bucket.bucketName);
  }
}

// 2. Use in stack: lib/cdk-init-stack.ts
// import { S3Construct } from './constructs/s3.construct';
// const s3 = new S3Construct(this, 'S3', props.env);


// Example 2: Adding custom configuration
// --------------------------------------
// 1. Add to lib/types/index.ts

export interface IS3Config {
  versioned: boolean;
  lifecycleRules?: {
    transitionToIA: number;
    transitionToGlacier: number;
    expiration: number;
  };
}

// 2. Add validation in config/environment.config.ts

import { z } from 'zod';

const s3ConfigSchema = z.object({
  versioned: z.boolean().default(true),
  lifecycleRules: z.object({
    transitionToIA: z.number().default(30),
    transitionToGlacier: z.number().default(90),
    expiration: z.number().default(365),
  }).optional(),
});

// Add to EnvironmentConfig class:
public getS3Config() {
  return s3ConfigSchema.parse({
    versioned: process.env.S3_VERSIONED === 'true',
    lifecycleRules: process.env.S3_LIFECYCLE === 'true' ? {
      transitionToIA: parseInt(process.env.S3_TRANSITION_IA || '30'),
      transitionToGlacier: parseInt(process.env.S3_TRANSITION_GLACIER || '90'),
      expiration: parseInt(process.env.S3_EXPIRATION || '365'),
    } : undefined,
  });
}

// 3. Add to .env
// S3_VERSIONED=true
// S3_LIFECYCLE=true
// S3_TRANSITION_IA=30
// S3_TRANSITION_GLACIER=90
// S3_EXPIRATION=365


// Example 3: Multi-stack deployment
// ---------------------------------
// bin/cdk-init.ts

import { VpcStack } from '../lib/stacks/vpc.stack';
import { DatabaseStack } from '../lib/stacks/database.stack';
import { ApplicationStack } from '../lib/stacks/application.stack';

const app = new cdk.App();
const env = envConfig.getEnvironment();

// Create VPC stack
const vpcStack = new VpcStack(app, `${env.prefix}-vpc-stack`, { env });

// Create Database stack (depends on VPC)
const dbStack = new DatabaseStack(app, `${env.prefix}-db-stack`, {
  env,
  vpc: vpcStack.vpc,
});

// Create Application stack (depends on VPC and DB)
const appStack = new ApplicationStack(app, `${env.prefix}-app-stack`, {
  env,
  vpc: vpcStack.vpc,
  database: dbStack.database,
});

app.synth();
