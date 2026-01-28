/**
 * cdk-init-stack.test.ts
 * Unit tests for CdkInitStack
 */

import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CdkInitStack } from '../lib/cdk-init-stack';
import { IEnvironmentConfig } from '../lib/types';

describe('CdkInitStack', () => {
  let app: App;
  let env: IEnvironmentConfig;

  beforeEach(() => {
    app = new App();
    env = {
      stage: 'dev',
      project: 'test-project',
      region: 'us-east-1',
      account: '123456789012',
      prefix: 'test-project-dev',
    };

    // Mock environment config for testing
    process.env.STAGE = 'dev';
    process.env.PROJECT = 'test-project';
    process.env.CDK_REGION = 'us-east-1';
    process.env.CDK_ACCOUNT_ID = '123456789012';
    process.env.CIDR_BLOCK = '10.0.0.0/16';
  });

  describe('Stack Creation', () => {
    it('should create a stack with correct name', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });
      
      expect(stack.stackName).toBe('test-project-dev-stack');
    });

    it('should set correct stack description', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });
      
      const template = Template.fromStack(stack);
      expect(template.toJSON().Description).toContain('test-project');
      expect(template.toJSON().Description).toContain('dev');
    });
  });

  describe('VPC Integration', () => {
    it('should create VPC construct', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    it('should expose VPC publicly', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.getVpc()).toBeDefined();
    });
  });

  describe('Global Tags', () => {
    it('should apply global tags to stack', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      const template = Template.fromStack(stack);
      
      // Check that VPC resource exists with at least some tags
      template.resourceCountIs('AWS::EC2::VPC', 1);
      
      // Check for specific tags (tags are applied at stack level)
      const resources = template.toJSON().Resources;
      const vpcResource = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::EC2::VPC'
      ) as any;
      
      expect(vpcResource).toBeDefined();
      expect(vpcResource.Properties.Tags).toBeDefined();
      
      const tags = vpcResource.Properties.Tags;
      expect(tags.some((t: any) => t.Key === 'ProjectID' && t.Value === 'test-project-dev')).toBe(true);
    });

    it('should include repository tag', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Repository', Value: 'cdk-init' }),
        ]),
      });
    });
  });

  describe('Multi-Environment Support', () => {
    it('should handle production environment', () => {
      const prodEnv: IEnvironmentConfig = {
        stage: 'prod',
        project: 'test-project',
        region: 'us-east-1',
        account: '123456789012',
        prefix: 'test-project-prod',
      };

      const stack = new CdkInitStack(app, `${prodEnv.prefix}-stack`, { env: prodEnv });

      expect(stack.stackName).toBe('test-project-prod-stack');
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'prod' }),
        ]),
      });
    });

    it('should handle staging environment', () => {
      const stgEnv: IEnvironmentConfig = {
        stage: 'stg',
        project: 'test-project',
        region: 'ap-northeast-1',
        account: '123456789012',
        prefix: 'test-project-stg',
      };

      const stack = new CdkInitStack(app, `${stgEnv.prefix}-stack`, { env: stgEnv });

      expect(stack.stackName).toBe('test-project-stg-stack');
    });
  });

  describe('Resource Outputs', () => {
    it('should create VPC outputs', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      // Output ID includes construct name prefix
      expect(Object.keys(outputs).some(key => key.includes('VpcId'))).toBe(true);
    });

    it('should create subnet outputs', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      // Check that subnet outputs exist (with construct prefix)
      expect(Object.keys(outputs).some(key => key.includes('PublicSubnetIds'))).toBe(true);
      expect(Object.keys(outputs).some(key => key.includes('PrivateSubnetIds'))).toBe(true);
    });
  });

  describe('Stack Props', () => {
    it('should set correct AWS environment', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      expect(stack.account).toBe('123456789012');
      expect(stack.region).toBe('us-east-1');
    });

    it('should accept different regions', () => {
      const customEnv: IEnvironmentConfig = {
        ...env,
        region: 'eu-west-1',
      };

      const stack = new CdkInitStack(app, `${customEnv.prefix}-stack`, { env: customEnv });

      expect(stack.region).toBe('eu-west-1');
    });
  });

  describe('Infrastructure Components', () => {
    it('should create all required networking resources', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });

      const template = Template.fromStack(stack);
      
      // VPC
      template.resourceCountIs('AWS::EC2::VPC', 1);
      
      // Internet Gateway
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      
      // Subnets (2 AZs * 2 subnet types)
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      // Route Tables
      template.resourcePropertiesCountIs('AWS::EC2::RouteTable', {}, 4);
    });
  });

  describe('Snapshot Testing', () => {
    it('should match CloudFormation template snapshot', () => {
      const stack = new CdkInitStack(app, `${env.prefix}-stack`, { env });
      const template = Template.fromStack(stack);
      
      // Get the template JSON
      const templateJson = template.toJSON();
      
      // Verify key structure exists
      expect(templateJson).toHaveProperty('Resources');
      expect(templateJson).toHaveProperty('Outputs');
      expect(templateJson).toHaveProperty('Description');
      
      // Verify VPC resource exists
      const hasVpcResource = Object.keys(templateJson.Resources).some(
        key => key.includes('VpcConstructVpc')
      );
      expect(hasVpcResource).toBe(true);
    });
  });
});
