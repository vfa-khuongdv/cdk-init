/**
 * constructs/ec2.construct.ts
 * EC2 Construct
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BaseConstruct } from '../shared/base.construct';
import { IEnvironmentConfig, IEc2Config } from '../types';

/**
 * EC2 Construct
 */
export class Ec2Construct extends BaseConstruct {
  public readonly instance: ec2.Instance;
  public readonly securityGroup: ec2.SecurityGroup;
  private readonly vpc: ec2.IVpc;
  private readonly config: IEc2Config;

  constructor(scope: Construct, id: string, env: IEnvironmentConfig, vpc: ec2.IVpc, config: IEc2Config) {
    super(scope, id, env);
    this.vpc = vpc;
    this.config = config;

    this.securityGroup = this.createSecurityGroup();
    this.instance = this.createInstance();
    
    // Apply common tags
    this.applyTags(this.getCommonTags());
    this.createOutputs();
  }

  private createSecurityGroup(): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      description: `Security group for ${this.getResourceName('ec2')}`,
      allowAllOutbound: true,
      securityGroupName: this.getResourceName('ec2-sg'),
    });

    // Allow SSH
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');
    
    return sg;
  }

  private createInstance(): ec2.Instance {
    // Role for SSM access
    const role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    return new ec2.Instance(this, 'Ec2Instance', {
      vpc: this.vpc,
      instanceType: new ec2.InstanceType(this.config.instanceType),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.securityGroup,
      role: role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Put in public subnet for access demo, usually private
      },
      instanceName: this.getResourceName('ec2'),
      keyName: this.config.keyName, // Optional
    });
  }

  private createOutputs(): void {
    this.createOutput('Ec2PrivateIp', this.instance.instancePrivateIp, 'EC2 Private IP');
    this.createOutput('Ec2PublicIp', this.instance.instancePublicIp, 'EC2 Public IP');
  }
}
