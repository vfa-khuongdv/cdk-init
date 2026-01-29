/**
 * ec2.construct.test.ts
 * Unit tests for Ec2Construct
 */

import { App, Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Ec2Construct } from '../../lib/constructs/ec2.construct';
import { IEnvironmentConfig, IEc2Config } from '../../lib/types';

describe('Ec2Construct', () => {
  let app: App;
  let stack: Stack;
  let vpc: ec2.Vpc;
  let env: IEnvironmentConfig;
  let consoleErrorSpy: jest.SpyInstance;

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
    vpc = new ec2.Vpc(stack, 'TestVpc');

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('EC2 Creation', () => {
    it('should create an EC2 instance with correct configuration', () => {
      const ec2Config: IEc2Config = {
        instanceType: 't3.micro',
        keyName: 'test-key',
      };

      new Ec2Construct(stack, 'Ec2Construct', env, vpc, ec2Config);

      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        KeyName: 'test-key',
        Tags: Match.arrayWith([
          { Key: 'Name', Value: 'test-project-dev-ec2' },
        ]),
      });
    });

    it('should create security group allowing SSH', () => {
        const ec2Config: IEc2Config = {
          instanceType: 't3.micro',
        };
  
        new Ec2Construct(stack, 'Ec2Construct', env, vpc, ec2Config);
  
        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: Match.stringLikeRegexp('Security group for.*ec2'),
          SecurityGroupIngress: Match.arrayWith([
            {
               CidrIp: "0.0.0.0/0",
               FromPort: 22,
               IpProtocol: "tcp",
               ToPort: 22,
               Description: "Allow SSH access"
            }
          ])
        });
      });

      it('should attach SSM role', () => {
        const ec2Config: IEc2Config = {
          instanceType: 't3.micro',
        };
  
        new Ec2Construct(stack, 'Ec2Construct', env, vpc, ec2Config);
  
        const template = Template.fromStack(stack);
        
        template.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                  Service: "ec2.amazonaws.com"
                }
              }
            ]
          },
          ManagedPolicyArns: [
            {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    {
                      "Ref": "AWS::Partition"
                    },
                    ":iam::aws:policy/AmazonSSMManagedInstanceCore"
                  ]
                ]
              }
          ]
        });
      });
  });
});
