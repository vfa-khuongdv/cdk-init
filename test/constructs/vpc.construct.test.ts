/**
 * vpc.construct.test.ts
 * Unit tests for VpcConstruct
 */

import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../../lib/constructs/vpc.construct';
import { IEnvironmentConfig, IVpcConfig } from '../../lib/types';

describe('VpcConstruct', () => {
  let app: App;
  let stack: Stack;
  let env: IEnvironmentConfig;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    env = {
      stage: 'dev',
      project: 'test-project',
      region: 'us-east-1',
      account: '123456789012',
      prefix: 'test-project-dev',
    };
  });

  describe('VPC Creation', () => {
    it('should create a VPC with correct configuration', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    it('should create VPC with custom name', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'test-project-dev-vpc',
          }),
        ]),
      });
    });

    it('should apply common tags to VPC', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      const resources = template.toJSON().Resources;
      const vpcResource = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::EC2::VPC'
      ) as any;
      
      expect(vpcResource).toBeDefined();
      const tags = vpcResource.Properties.Tags;
      
      // Check for required tags
      expect(tags.some((t: any) => t.Key === 'Environment' && t.Value === 'dev')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Project' && t.Value === 'test-project')).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    it('should create public and private subnets', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    it('should create NAT gateways when specified', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 2,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });

    it('should not create NAT gateways when set to 0', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
      template.resourceCountIs('AWS::EC2::EIP', 0);
    });

    it('should create correct number of availability zones', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 3,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private
    });
  });

  describe('Internet Gateway', () => {
    it('should create an internet gateway', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    it('should tag internet gateway correctly', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'test-project-dev-igw',
          }),
        ]),
      });
    });
  });

  describe('Route Tables', () => {
    it('should create route tables for subnets', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      // Should have route tables for public and private subnets
      template.resourcePropertiesCountIs('AWS::EC2::RouteTable', {}, 4);
    });
  });

  describe('CloudFormation Outputs', () => {
    it('should create VPC ID output', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      // Output includes construct name prefix
      expect(Object.keys(outputs).some(key => key.includes('VpcId'))).toBe(true);
    });

    it('should create VPC CIDR output', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      expect(Object.keys(outputs).some(key => key.includes('VpcCidr'))).toBe(true);
    });

    it('should create subnet outputs', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      expect(Object.keys(outputs).some(key => key.includes('PublicSubnetIds'))).toBe(true);
      expect(Object.keys(outputs).some(key => key.includes('PrivateSubnetIds'))).toBe(true);
    });

    it('should create availability zones output', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;
      
      expect(Object.keys(outputs).some(key => key.includes('AvailabilityZones'))).toBe(true);
    });
  });

  describe('Custom Configuration', () => {
    it('should respect custom CIDR blocks', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '192.168.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '192.168.0.0/16',
      });
    });

    it('should support custom subnet configuration', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
        publicSubnetConfig: {
          cidrMask: 20,
          name: 'custom-public',
        },
        privateSubnetConfig: {
          cidrMask: 20,
          name: 'custom-private',
        },
      };

      new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);

      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });
  });

  describe('VPC Accessor', () => {
    it('should provide VPC accessor method', () => {
      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 2,
        natGateways: 0,
      };

      const vpcConstruct = new VpcConstruct(stack, 'VpcConstruct', env, vpcConfig);
      const vpc = vpcConstruct.getVpc();

      expect(vpc).toBeDefined();
      expect(vpc.vpcId).toBeDefined();
    });
  });

  describe('Production vs Development', () => {
    it('should handle production environment correctly', () => {
      const prodEnv: IEnvironmentConfig = {
        stage: 'prod',
        project: 'test-project',
        region: 'us-east-1',
        account: '123456789012',
        prefix: 'test-project-prod',
      };

      const vpcConfig: IVpcConfig = {
        cidrBlock: '10.0.0.0/16',
        maxAzs: 3,
        natGateways: 3,
      };

      new VpcConstruct(stack, 'VpcConstruct', prodEnv, vpcConfig);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'prod' }),
          Match.objectLike({ Key: 'Name', Value: 'test-project-prod-vpc' }),
        ]),
      });
    });
  });
});
