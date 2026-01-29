/**
 * config/environment.config.ts
 * Robust environment configuration with validation
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import { z } from 'zod';
import 'dotenv/config';
import { IEnvironmentConfig } from '../lib/types';

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  STAGE: z.enum(['dev', 'stg', 'prod']),
  PROJECT: z.string().min(1, 'PROJECT is required'),
  CDK_REGION: z.string().min(1, 'CDK_REGION is required'),
  CDK_ACCOUNT_ID: z.string().regex(/^\d{12}$/, 'CDK_ACCOUNT_ID must be a 12-digit AWS account ID'),
  CIDR_BLOCK: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, 'CIDR_BLOCK must be valid CIDR notation'),
});

/**
 * VPC configuration schema
 */
const vpcConfigSchema = z.object({
  cidrBlock: z.string(),
  maxAzs: z.number().min(1).max(3).default(2),
  natGateways: z.number().min(0).default(0),
});

/**
 * Configuration class for managing environment variables
 */
export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: z.infer<typeof envSchema>;

  private constructor() {
    try {
      this.config = envSchema.parse({
        STAGE: process.env.STAGE,
        PROJECT: process.env.PROJECT,
        CDK_REGION: process.env.CDK_REGION,
        CDK_ACCOUNT_ID: process.env.CDK_ACCOUNT_ID,
        CIDR_BLOCK: process.env.CIDR_BLOCK,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Environment configuration validation failed:');
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        throw new Error('Invalid environment configuration. Please check your .env file.');
      }
      throw error;
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  /**
   * Get environment configuration
   */
  public getEnvironment(): IEnvironmentConfig {
    return {
      stage: this.config.STAGE,
      project: this.config.PROJECT,
      region: this.config.CDK_REGION,
      account: this.config.CDK_ACCOUNT_ID,
      prefix: `${this.config.PROJECT}-${this.config.STAGE}`,
    };
  }

  /**
   * Get VPC configuration
   */
  public getVpcConfig() {
    return vpcConfigSchema.parse({
      cidrBlock: this.config.CIDR_BLOCK,
      maxAzs: parseInt(process.env.VPC_MAX_AZS || '2'),
      natGateways: parseInt(process.env.VPC_NAT_GATEWAYS || '0'),
    });
  }

  /**
   * Get RDS configuration
   */
  public getRdsConfig() {
    return {
      instanceType: process.env.RDS_INSTANCE_TYPE || 't3.micro',
      multiAz: process.env.RDS_MULTI_AZ === 'true',
      allocatedStorage: parseInt(process.env.RDS_STORAGE || '20'),
      dbName: process.env.RDS_DB_NAME || 'cdkapp',
      username: process.env.RDS_USERNAME || 'postgres',
    };
  }

  /**
   * Get EC2 configuration
   */
  public getEc2Config() {
    return {
      instanceType: process.env.EC2_INSTANCE_TYPE || 't3.micro',
      keyName: process.env.EC2_KEY_NAME,
    };
  }

  /**
   * Get raw configuration value
   */
  public get<K extends keyof z.infer<typeof envSchema>>(key: K): z.infer<typeof envSchema>[K] {
    return this.config[key];
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.config.STAGE === 'prod';
  }

  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.config.STAGE === 'dev';
  }

  /**
   * Get resource prefix
   */
  public getPrefix(): string {
    return `${this.config.PROJECT}-${this.config.STAGE}`;
  }
}

// Export singleton instance
export const envConfig = EnvironmentConfig.getInstance();
