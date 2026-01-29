/**
 * cdk-init-stack.ts
 * Main CDK stack for infrastructure deployment
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './constructs/vpc.construct';
import { RdsConstruct } from './constructs/rds.construct';
import { Ec2Construct } from './constructs/ec2.construct';
import { envConfig } from '../config/environment.config';
import { IEnvironmentConfig } from './types';

/**
 * Props for CdkInitStack
 */
export interface CdkInitStackProps extends cdk.StackProps {
  env: IEnvironmentConfig;
}

/**
 * Main infrastructure stack
 */
export class CdkInitStack extends cdk.Stack {
  public readonly vpc: VpcConstruct;
  public readonly rds: RdsConstruct;
  public readonly ec2: Ec2Construct;

  constructor(scope: Construct, id: string, props: CdkInitStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: props.env.account,
        region: props.env.region,
      },
      stackName: `${props.env.prefix}-stack`,
      description: `Infrastructure stack for ${props.env.project} (${props.env.stage})`,
      tags: {
        Environment: props.env.stage,
        Project: props.env.project,
        ManagedBy: 'CDK',
      },
    });

    // Create VPC
    this.vpc = new VpcConstruct(
      this,
      'VpcConstruct',
      props.env,
      envConfig.getVpcConfig()
    );

    // Create RDS PostgreSQL
    this.rds = new RdsConstruct(
      this,
      'RdsConstruct',
      props.env,
      this.vpc.vpc,
      envConfig.getRdsConfig()
    );

    // Create EC2 Instance
    this.ec2 = new Ec2Construct(
      this,
      'Ec2Construct',
      props.env,
      this.vpc.vpc,
      envConfig.getEc2Config()
    );

    // Apply global tags
    this.applyGlobalTags(props.env);
  }

  /**
   * Apply tags to all resources in the stack
   */
  private applyGlobalTags(env: IEnvironmentConfig): void {
    cdk.Tags.of(this).add('ProjectID', env.prefix);
    cdk.Tags.of(this).add('Environment', env.stage);
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
    cdk.Tags.of(this).add('Repository', 'cdk-init');
  }
}