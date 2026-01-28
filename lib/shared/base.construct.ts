/**
 * shared/base.construct.ts
 * Base construct class for all infrastructure components
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import { Construct } from 'constructs';
import { Tags, CfnOutput } from 'aws-cdk-lib';
import { IEnvironmentConfig, ITagConfig } from '../types';

/**
 * Base construct providing common functionality for all infrastructure components
 */
export abstract class BaseConstruct extends Construct {
  protected readonly env: IEnvironmentConfig;

  constructor(scope: Construct, id: string, env: IEnvironmentConfig) {
    super(scope, id);
    this.env = env;
  }

  /**
   * Apply standard tags to resources
   */
  protected applyTags(tags: Record<string, string>): void {
    Object.entries(tags).forEach(([key, value]) => {
      Tags.of(this).add(key, value);
    });
  }

  /**
   * Apply tags to specific resource types
   */
  protected applyTagsToResourceTypes(config: ITagConfig): void {
    Tags.of(this).add(config.key, config.value, {
      includeResourceTypes: config.resourceTypes,
      priority: config.priority || 200,
    });
  }

  /**
   * Create CloudFormation output
   */
  protected createOutput(id: string, value: string, description?: string, exportName?: string): void {
    new CfnOutput(this, id, {
      value,
      description,
      exportName: exportName || `${this.env.prefix}-${id}`,
    });
  }

  /**
   * Generate resource name with environment prefix
   */
  protected getResourceName(name: string): string {
    return `${this.env.prefix}-${name}`;
  }

  /**
   * Get common tags for all resources
   */
  protected getCommonTags(): Record<string, string> {
    return {
      Environment: this.env.stage,
      Project: this.env.project,
      ManagedBy: 'CDK',
      Prefix: this.env.prefix,
    };
  }
}
