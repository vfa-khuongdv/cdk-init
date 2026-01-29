/**
 * constructs/rds.construct.ts
 * RDS PostgreSQL construct
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseConstruct } from '../shared/base.construct';
import { IEnvironmentConfig, IRdsConfig } from '../types';

/**
 * RDS Construct
 */
export class RdsConstruct extends BaseConstruct {
  public readonly instance: rds.DatabaseInstance;
  public readonly securityGroup: ec2.SecurityGroup;
  private readonly vpc: ec2.IVpc;
  private readonly config: IRdsConfig;

  constructor(scope: Construct, id: string, env: IEnvironmentConfig, vpc: ec2.IVpc, config: IRdsConfig) {
    super(scope, id, env);
    this.vpc = vpc;
    this.config = config;

    this.securityGroup = this.createSecurityGroup();
    this.instance = this.createDatabase();
    
    // Apply common tags
    this.applyTags(this.getCommonTags());
    this.createOutputs();
  }

  private createSecurityGroup(): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      description: `Security group for ${this.getResourceName('rds')}`,
      allowAllOutbound: true,
      securityGroupName: this.getResourceName('rds-sg'),
    });

    // In a real scenario, restrict this. For now, allow internal VPC traffic or specific access.
    // We'll leave it open for later configuration or add a rule if needed.
    // sg.addIngressRule(ec2.Peer.ipv4(this.vpc.vpcCidrBlock), ec2.Port.tcp(5432), 'Allow VPC access');
    
    return sg;
  }

  private createDatabase(): rds.DatabaseInstance {
    const credentials = rds.Credentials.fromGeneratedSecret(this.config.username || 'postgres');
    
    // Prefer private subnets with egress (NAT), fall back to isolated subnets
    const subnetType = this.vpc.privateSubnets.length > 0 
      ? ec2.SubnetType.PRIVATE_WITH_EGRESS 
      : ec2.SubnetType.PRIVATE_ISOLATED;

    return new rds.DatabaseInstance(this, 'RdsInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: new ec2.InstanceType(this.config.instanceType),
      vpc: this.vpc,
      vpcSubnets: { subnetType },
      instanceIdentifier: this.getResourceName('rds-instance'),
      databaseName: this.config.dbName || 'appdb',
      credentials,
      multiAz: this.config.multiAz,
      allocatedStorage: this.config.allocatedStorage,
      storageType: rds.StorageType.GP3,
      securityGroups: [this.securityGroup],
      deleteAutomatedBackups: false,
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // Use SNAPSHOT or RETAIN for prod
    });
  }

  private createOutputs(): void {
    this.createOutput('RdsEndpoint', this.instance.dbInstanceEndpointAddress, 'RDS Endpoint Address');
    this.createOutput('RdsPort', this.instance.dbInstanceEndpointPort, 'RDS Port');
    this.createOutput('RdsSecretName', this.instance.secret?.secretName || '', 'RDS Secret Name');
  }
}
