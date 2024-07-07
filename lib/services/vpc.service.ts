/**
 * vpc.service.ts
 * cdk-init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-06-19
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Tags, CfnOutput, Tag, Aspects } from 'aws-cdk-lib';
import { ENV } from '../../config/environment';

export class VpcService {
  private readonly scope: Construct;
  public vpc: ec2.Vpc;

  constructor(scope: Construct) {
    this.scope = scope;
    this.init();
  }

  /**
   * init new VPC
   */
  private init() {
    // Create new VPC
    this.vpc = new ec2.Vpc(this.scope, 'Vpc', {
      vpcName: `${ENV.prefix}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr(ENV.cidrBlock),
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Update the Name tag for public subnets
    this.addTagForSubnet(this.vpc.publicSubnets);
    // Update the Name tag for private subnets
    this.addTagForSubnet(this.vpc.privateSubnets);
    // Update the Name tag for other resources
    this.addTagForResourceAutoTagsInVPC();

    // Output resource
    new CfnOutput(this.scope, 'VpcID', {
      value: this.vpc.vpcId,
      description: 'The ID of the VPC',
    });
  }

  /**
   * Add tag for a subnet
   *
   * @param subnets
   * @private
   */
  private addTagForSubnet(subnets: ec2.ISubnet[]) {
    subnets.forEach((subnet) => {
      const subnetValue = `${subnet.node.id.replace(/Subnet[0-9]$/, '')}-${subnet.availabilityZone
        }`;
      const routeValue = `RT-${subnetValue}`;
      Aspects.of(subnet).add(
        this.addTagByResourceType('Name', subnetValue, ['AWS::EC2::Subnet']),
      );
      Aspects.of(subnet).add(
        this.addTagByResourceType('Name', routeValue, ['AWS::EC2::RouteTable']),
      );
    });
  }

  /**
   * Override tags for resource was auto generated tags
   * - InternetGateway
   * - NatGateway
   * - EIP
   * @private
   */
  private addTagForResourceAutoTagsInVPC() {
    Tags.of(this.scope).add('Name', `${ENV.prefix}-IG`, {
      includeResourceTypes: ['AWS::EC2::InternetGateway'],
      priority: 200,
    });
    Tags.of(this.scope).add('Name', `${ENV.prefix}-NAT`, {
      includeResourceTypes: ['AWS::EC2::NatGateway'],
      priority: 200,
    });
    Tags.of(this.scope).add('Name', `${ENV.prefix}-EIP`, {
      includeResourceTypes: ['AWS::EC2::EIP'],
      priority: 200,
    });
  }

  /**
   * Write exactly tag for a given resource
   * @param key
   * @param value
   * @param types
   * @private
   */
  private addTagByResourceType(key: string, value: string, types: string[]) {
    return new Tag(key, value, {
      includeResourceTypes: types,
      priority: 200,
    });
  }
}
