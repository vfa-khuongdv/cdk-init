/**
 * ecs.service.ts
 * cdk-init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-06-26
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PREFIX } from '../../config/environment';
import { isProd, isStg } from '../shared/helper';


export class ECSService {
  private readonly scope: Construct;
  private readonly vpc: ec2.Vpc;
  public cluster: ecs.Cluster;
  public loadbalancer: ApplicationLoadBalancer;
  public fargateService: ecs_patterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, vpc: ec2.Vpc) {
    this.scope = scope;
    this.vpc = vpc;
    this.init();
  }

  /**
   * init new ECS cluster with fargate service
   */
  init() {
    // Create cluster
    this.cluster = new ecs.Cluster(this.scope, 'EcsCluster', {
      vpc: this.vpc,
      clusterName: `${PREFIX}-cluster`,
    });
    // Create execution role
    const executionRole = new Role(this.scope, 'ExecutionRoleFargate', {
      roleName: `${PREFIX}-ecs-role`,
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });
    // Create Security Group
    const fargateSecurityGroup = new ec2.SecurityGroup(
      this.scope,
      'FargateSecurityGroup',
      {
        vpc: this.vpc,
        allowAllOutbound: true,
      },
    );

    // Create Application Loadbalancer Service
    this.fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this.scope,
      'ApplicationLoadbalancer',

      {
        cluster: this.cluster,
        taskImageOptions: {
          environment: {},
          image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
          containerName: `${PREFIX}-container`,
          family: `${PREFIX}-task-definition`,
          containerPort: 80,
          logDriver: ecs.LogDrivers.awsLogs({
            logGroup: new logs.LogGroup(this.scope, 'LogGroup', {
              logGroupName: `${PREFIX}-ecs`,
              retention: RetentionDays.ONE_MONTH,
              removalPolicy: RemovalPolicy.DESTROY,
            }),
            streamPrefix: `${PREFIX}-stream`,
          }),
          executionRole,
        },
        ...this.getECSConfiguration,// Get CPU, memoryLimitMiB, desiredCount
        serviceName: `${PREFIX}-service`,
        taskSubnets: this.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
          onePerAz: true,
        }),
        assignPublicIp: true,
        securityGroups: [fargateSecurityGroup],
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
      },
    );

    // Health check
    this.fargateService.targetGroup.configureHealthCheck({
      path: '/',
    });

    // Create AutoScale target
    const scaleTarget = this.fargateService.service.autoScaleTaskCount({
      minCapacity: this.getECSConfiguration.desiredCount,
      maxCapacity: 60,
    });
    // Auto Scale by CPU percent
    scaleTarget.scaleOnCpuUtilization('MyCpuScaling', {
      targetUtilizationPercent: 70,
    });
  }

  /**
   * Info ECS Server by environment
   */
  get getECSConfiguration() {
    const config = {
      cpu: 256, // 0.25 vCPU
      memoryLimitMiB: 512, // 0.5GB RAM
      desiredCount: 1, // 1 task
    };
    if (isStg) {
      config.cpu = 2048; // 2vCPU
      config.memoryLimitMiB = 4096; // 4GB RAM
      config.desiredCount = 1; // 1 task
    }
    if (isProd) {
      config.cpu = 2048; // 2vCPU
      config.memoryLimitMiB = 4096; // 8GB RAM
      config.desiredCount = 10; // 10 task
    }
    return config;
  }
}
