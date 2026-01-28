/**
 * services/vpc.construct.ts
 * VPC construct with builder pattern for flexible configuration
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Aspects, Tag } from 'aws-cdk-lib';
import { BaseConstruct } from '../shared/base.construct';
import { IEnvironmentConfig, IVpcConfig } from '../types';

/**
 * VPC Construct with flexible configuration
 */
export class VpcConstruct extends BaseConstruct {
  public readonly vpc: ec2.Vpc;
  private readonly vpcConfig: IVpcConfig;

  constructor(scope: Construct, id: string, env: IEnvironmentConfig, vpcConfig: IVpcConfig) {
    super(scope, id, env);
    this.vpcConfig = vpcConfig;
    this.vpc = this.createVpc();
    this.setupNetworking();
    this.applyResourceTags();
    this.createOutputs();
  }

  /**
   * Create VPC with configured settings
   */
  private createVpc(): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: this.getResourceName('vpc'),
      ipAddresses: ec2.IpAddresses.cidr(this.vpcConfig.cidrBlock),
      natGateways: this.vpcConfig.natGateways || 0,
      maxAzs: this.vpcConfig.maxAzs || 2,
      enableDnsHostnames: this.vpcConfig.enableDnsHostnames !== false,
      enableDnsSupport: this.vpcConfig.enableDnsSupport !== false,
      createInternetGateway: this.vpcConfig.createInternetGateway !== false,
      subnetConfiguration: this.getSubnetConfiguration(),
    });

    // Apply common tags
    this.applyTags(this.getCommonTags());

    return vpc;
  }

  /**
   * Get subnet configuration
   */
  private getSubnetConfiguration(): ec2.SubnetConfiguration[] {
    const config: ec2.SubnetConfiguration[] = [
      {
        name: this.vpcConfig.publicSubnetConfig?.name || 'public-subnet',
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: this.vpcConfig.publicSubnetConfig?.cidrMask || 24,
      },
    ];

    // Add private subnet if NAT gateways are configured
    if (this.vpcConfig.natGateways && this.vpcConfig.natGateways > 0) {
      config.push({
        name: this.vpcConfig.privateSubnetConfig?.name || 'private-subnet',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: this.vpcConfig.privateSubnetConfig?.cidrMask || 24,
      });
    } else {
      config.push({
        name: this.vpcConfig.privateSubnetConfig?.name || 'private-subnet',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: this.vpcConfig.privateSubnetConfig?.cidrMask || 24,
      });
    }

    return config;
  }

  /**
   * Setup networking components
   */
  private setupNetworking(): void {
    this.tagSubnets(this.vpc.publicSubnets, 'public');
    this.tagSubnets(this.vpc.privateSubnets, 'private');
  }

  /**
   * Apply tags to subnets and associated resources
   */
  private tagSubnets(subnets: ec2.ISubnet[], subnetType: string): void {
    subnets.forEach((subnet, index) => {
      const az = subnet.availabilityZone;
      const subnetName = this.getResourceName(`${subnetType}-subnet-${az}`);
      const routeTableName = this.getResourceName(`${subnetType}-rt-${az}`);

      // Tag subnet
      Aspects.of(subnet).add(
        new Tag('Name', subnetName, {
          includeResourceTypes: ['AWS::EC2::Subnet'],
          priority: 300,
        })
      );

      // Tag route table
      Aspects.of(subnet).add(
        new Tag('Name', routeTableName, {
          includeResourceTypes: ['AWS::EC2::RouteTable'],
          priority: 300,
        })
      );
    });
  }

  /**
   * Apply tags to VPC-related resources
   */
  private applyResourceTags(): void {
    // Internet Gateway
    this.applyTagsToResourceTypes({
      key: 'Name',
      value: this.getResourceName('igw'),
      resourceTypes: ['AWS::EC2::InternetGateway'],
      priority: 300,
    });

    // NAT Gateway (if exists)
    if (this.vpcConfig.natGateways && this.vpcConfig.natGateways > 0) {
      this.applyTagsToResourceTypes({
        key: 'Name',
        value: this.getResourceName('nat'),
        resourceTypes: ['AWS::EC2::NatGateway'],
        priority: 300,
      });

      // Elastic IP for NAT
      this.applyTagsToResourceTypes({
        key: 'Name',
        value: this.getResourceName('eip-nat'),
        resourceTypes: ['AWS::EC2::EIP'],
        priority: 300,
      });
    }
  }

  /**
   * Create CloudFormation outputs
   */
  private createOutputs(): void {
    this.createOutput('VpcId', this.vpc.vpcId, 'The ID of the VPC');
    this.createOutput('VpcCidr', this.vpc.vpcCidrBlock, 'The CIDR block of the VPC');

    // Public subnet IDs
    const publicSubnetIds = this.vpc.publicSubnets.map((subnet) => subnet.subnetId).join(',');
    this.createOutput('PublicSubnetIds', publicSubnetIds, 'Comma-separated list of public subnet IDs');

    // Private subnet IDs
    const privateSubnetIds = this.vpc.privateSubnets.map((subnet) => subnet.subnetId).join(',');
    this.createOutput('PrivateSubnetIds', privateSubnetIds, 'Comma-separated list of private subnet IDs');

    // Availability Zones
    const azs = this.vpc.availabilityZones.join(',');
    this.createOutput('AvailabilityZones', azs, 'Comma-separated list of availability zones');
  }

  /**
   * Get VPC for use in other constructs
   */
  public getVpc(): ec2.IVpc {
    return this.vpc;
  }
}
