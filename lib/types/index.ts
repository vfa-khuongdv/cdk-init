/**
 * types/index.ts
 * Shared TypeScript interfaces and types
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * Application environment configuration
 */
export interface IEnvironmentConfig {
  stage: string;
  project: string;
  region: string;
  account: string;
  prefix: string;
}

/**
 * VPC configuration options
 */
export interface IVpcConfig {
  cidrBlock: string;
  maxAzs?: number;
  natGateways?: number;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  createInternetGateway?: boolean;
  publicSubnetConfig?: ISubnetConfig;
  privateSubnetConfig?: ISubnetConfig;
}

/**
 * Subnet configuration
 */
export interface ISubnetConfig {
  cidrMask: number;
  name?: string;
}

/**
 * Resource tagging options
 */
export interface ITagConfig {
  key: string;
  value: string;
  resourceTypes?: string[];
  priority?: number;
}

/**
 * Common construct properties
 */
export interface IBaseConstructProps {
  env: IEnvironmentConfig;
  tags?: ITagConfig[];
}
