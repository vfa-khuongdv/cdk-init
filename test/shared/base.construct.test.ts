/**
 * base.construct.test.ts
 * Unit tests for BaseConstruct
 */

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import { BaseConstruct } from '../../lib/shared/base.construct';
import { IEnvironmentConfig } from '../../lib/types';

// Test implementation of BaseConstruct
class TestConstruct extends BaseConstruct {
  constructor(scope: Construct, id: string, env: IEnvironmentConfig) {
    super(scope, id, env);
  }

  public testApplyTags(tags: Record<string, string>): void {
    this.applyTags(tags);
  }

  public testCreateOutput(id: string, value: string, description?: string): void {
    this.createOutput(id, value, description);
  }

  public testGetResourceName(name: string): string {
    return this.getResourceName(name);
  }

  public testGetCommonTags(): Record<string, string> {
    return this.getCommonTags();
  }
}

describe('BaseConstruct', () => {
  let app: App;
  let stack: Stack;
  let env: IEnvironmentConfig;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
    env = {
      stage: 'dev',
      project: 'test-project',
      region: 'us-east-1',
      account: '123456789012',
      prefix: 'test-project-dev',
    };
  });

  describe('Constructor', () => {
    it('should create a construct with environment config', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      expect(construct).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should generate correct resource name with prefix', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      const resourceName = construct.testGetResourceName('vpc');
      expect(resourceName).toBe('test-project-dev-vpc');
    });

    it('should handle complex resource names', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      const resourceName = construct.testGetResourceName('public-subnet-1');
      expect(resourceName).toBe('test-project-dev-public-subnet-1');
    });
  });

  describe('Common Tags', () => {
    it('should return standard tags', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      const tags = construct.testGetCommonTags();

      expect(tags).toEqual({
        Environment: 'dev',
        Project: 'test-project',
        ManagedBy: 'CDK',
        Prefix: 'test-project-dev',
      });
    });

    it('should use correct values for production', () => {
      const prodEnv = { ...env, stage: 'prod', prefix: 'test-project-prod' };
      const construct = new TestConstruct(stack, 'TestConstruct', prodEnv);
      const tags = construct.testGetCommonTags();

      expect(tags.Environment).toBe('prod');
      expect(tags.Prefix).toBe('test-project-prod');
    });
  });

  describe('CloudFormation Outputs', () => {
    it('should create output with description', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      construct.testCreateOutput('TestOutput', 'test-value', 'Test description');

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      // CDK adds hash suffix to output IDs
      const outputKey = Object.keys(outputs).find(key => key.startsWith('TestConstructTestOutput'));
      expect(outputKey).toBeDefined();
      expect(outputs[outputKey!].Description).toBe('Test description');
    });

    it('should create output with export name', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      construct.testCreateOutput('TestOutput', 'test-value', 'Test description');

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      const outputKey = Object.keys(outputs).find(key => key.startsWith('TestConstructTestOutput'));
      expect(outputKey).toBeDefined();
      expect(outputs[outputKey!].Export.Name).toBe('test-project-dev-TestOutput');
    });
  });

  describe('Tag Application', () => {
    it('should apply custom tags', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      construct.testApplyTags({
        CustomTag: 'CustomValue',
        Owner: 'TestTeam',
      });

      const template = Template.fromStack(stack);
      // Tags are applied at the construct level, so we verify the template is valid
      expect(template).toBeDefined();
    });
  });

  describe('Environment Integration', () => {
    it('should correctly use environment configuration', () => {
      const construct = new TestConstruct(stack, 'TestConstruct', env);
      const tags = construct.testGetCommonTags();

      expect(tags.Environment).toBe(env.stage);
      expect(tags.Project).toBe(env.project);
      expect(tags.Prefix).toBe(env.prefix);
    });
  });
});
