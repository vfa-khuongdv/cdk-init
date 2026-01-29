/**
 * rds.construct.test.ts
 * Unit tests for RdsConstruct
 */

import { App, Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { RdsConstruct } from '../../lib/constructs/rds.construct';
import { IEnvironmentConfig, IRdsConfig } from '../../lib/types';

describe('RdsConstruct', () => {
  let app: App;
  let stack: Stack;
  let vpc: ec2.Vpc;
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
    vpc = new ec2.Vpc(stack, 'TestVpc');
  });

  describe('RDS Creation', () => {
    it('should create an RDS instance with correct configuration', () => {
      const rdsConfig: IRdsConfig = {
        instanceType: 't3.micro',
        multiAz: false,
        allocatedStorage: 20,
        dbName: 'testdb',
        username: 'testuser',
      };

      new RdsConstruct(stack, 'RdsConstruct', env, vpc, rdsConfig);

      const template = Template.fromStack(stack);
      
      // Check RDS Instance
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
        DBName: 'testdb',
        AllocatedStorage: '20',
        MultiAZ: false,
        Engine: 'postgres',
        EngineVersion: '16.3',
        PubliclyAccessible: false,
      });
    });

    it('should create security group', () => {
      const rdsConfig: IRdsConfig = {
        instanceType: 't3.micro',
        multiAz: false,
        allocatedStorage: 20,
      };

      new RdsConstruct(stack, 'RdsConstruct', env, vpc, rdsConfig);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for.*rds'),
        VpcId: { Ref: Match.stringLikeRegexp('TestVpc') },
      });
    });

    it('should create secret for credentials', () => {
        const rdsConfig: IRdsConfig = {
          instanceType: 't3.micro',
          multiAz: false,
          allocatedStorage: 20,
          username: 'customuser'
        };
  
        new RdsConstruct(stack, 'RdsConstruct', env, vpc, rdsConfig);
  
        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          GenerateSecretString: {
            GenerateStringKey: 'password',
            SecretStringTemplate: '{"username":"customuser"}',
          },
        });
      });
  });

  describe('Output Creation', () => {
    it('should create CfnOutputs', () => {
        const rdsConfig: IRdsConfig = {
            instanceType: 't3.micro',
            multiAz: false,
            allocatedStorage: 20,
          };
    
          new RdsConstruct(stack, 'RdsConstruct', env, vpc, rdsConfig);
    
          const template = Template.fromStack(stack);
          
          // Check for Export names
          const outputs = template.toJSON().Outputs;
          const outputKeys = Object.keys(outputs);
          
          const hasEndpoint = outputKeys.some(key => 
            outputs[key].Export && outputs[key].Export.Name === 'test-project-dev-RdsEndpoint'
          );
          expect(hasEndpoint).toBe(true);

          const hasPort = outputKeys.some(key => 
            outputs[key].Export && outputs[key].Export.Name === 'test-project-dev-RdsPort'
          );
          expect(hasPort).toBe(true);
    });
  });
});
