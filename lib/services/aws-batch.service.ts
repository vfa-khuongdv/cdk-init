/**
 * aws-batch-service.ts
 * cdk-infra
 * Created by khuongdv <khuongdv@vitalify.asia> on 5/1/23
 * Copyright (c) 2023 VFA Asia Co.,Ltd. All rights reserved.
 */
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { ENV, PREFIX } from '../../config/environment';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class AwsBatchService {
  private readonly scope: Construct;
  private readonly vpc: ec2.Vpc;
  private readonly batchRepo: ecr.Repository;

  constructor(scope: Construct, vpc: ec2.Vpc, batchRepo: ecr.Repository) {
    this.scope = scope;
    this.vpc = vpc;
    this.batchRepo = batchRepo;
    this.init();
  }

  private init() {
    // Create an IAM role for the instances
    const instanceRole = new Role(this.scope, 'BatchInstanceRole', {
      roleName: `${PREFIX}-aws-batch-role`,
      assumedBy: new ServicePrincipal('batch.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSBatchServiceRole',
        ),
      ],
    });
    // Security group for the compute instance
    const batchJobSecurityGroup = new ec2.SecurityGroup(
      this.scope,
      'SecurityGroup',
      {
        vpc: this.vpc,
        description: 'SG for the batch job',
        allowAllOutbound: true,
      },
    );

    // Create computeEnvironment
    const computeEnvironment = new batch.CfnComputeEnvironment(
      this.scope,
      `ComputeEnvironment`,
      {
        computeEnvironmentName: `${PREFIX}-batch-compute`,
        type: 'MANAGED',
        state: 'ENABLED',
        serviceRole: instanceRole.roleArn,
        computeResources: {
          type: 'FARGATE',
          maxvCpus: 5,
          subnets: this.vpc.privateSubnets.map((s) => s.subnetId),
          securityGroupIds: [batchJobSecurityGroup.securityGroupId],
        },
      },
    );

    // Create ecs fargate role
    const ecsRole = new Role(this.scope, 'BatchEcsRole', {
      roleName: `${PREFIX}-ecs-batch-role`,
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });

    // Batch001
    this.createBatches({
      ecsRole: ecsRole,
      computeEnvironment: computeEnvironment,
      batchId: '001',
      command: ['node', 'batch001.js'],
      expressions: [
        'cron(0/5 * * * ? *)', // Every 5 minutes
      ],
    });

    // Batch002
    this.createBatches({
      ecsRole: ecsRole,
      computeEnvironment: computeEnvironment,
      batchId: '002',
      command: ['node', 'batch002.js'],
      expressions: [
        'cron(0/10 * * * ? *)', // Every 10 minutes
      ],
    });
  }

  /**
   * Create Job Queue
   *
   * @param jobQueueName
   * @param computeEnvironment
   */
  createJobQueue(
    jobQueueName: string,
    computeEnvironment: batch.CfnComputeEnvironment,
  ) {
    return new batch.CfnJobQueue(this.scope, jobQueueName, {
      jobQueueName: jobQueueName,
      computeEnvironmentOrder: [
        {
          computeEnvironment: computeEnvironment.attrComputeEnvironmentArn,
          order: 1,
        },
      ],
      priority: 100,
    });
  }

  /**
   * Create Job definition
   *
   * @param jobDefinitionName
   * @param command
   * @param ecsRole
   */
  createJobDefinition(
    jobDefinitionName: string,
    command: string[],
    ecsRole: Role,
  ) {
    return new batch.CfnJobDefinition(this.scope, jobDefinitionName, {
      jobDefinitionName: jobDefinitionName,
      type: 'container',
      platformCapabilities: ['FARGATE'],
      containerProperties: {
        image: 'vfakhuongdv/batch-example',
        jobRoleArn: ecsRole.roleArn,
        executionRoleArn: ecsRole.roleArn,
        command: command,
        environment: [],
        resourceRequirements: [
          {
            value: '2',
            type: 'VCPU',
          },
          {
            value: '4096',
            type: 'MEMORY',
          },
        ],
        secrets: [],
        fargatePlatformConfiguration: {
          platformVersion: 'LATEST',
        }
      },
    });
  }

  /**
   * Define rule for run batch001
   *
   * @private
   * @param props
   */
  private createBatches(props: {
    ecsRole: Role;
    computeEnvironment: batch.CfnComputeEnvironment;
    batchId: string;
    command: string[];
    expressions: string[];
  }) {
    const { ecsRole, computeEnvironment, batchId, command, expressions } =
      props;
    const jobQueueName = `${PREFIX}-queue-batch-${batchId}`;
    const jobDefinitionName = `${PREFIX}-definition-batch-${batchId}`;
    const batchName = `${PREFIX}-batches-${batchId}`;
    const jobQueue = this.createJobQueue(jobQueueName, computeEnvironment);
    const jobDefinition = this.createJobDefinition(
      jobDefinitionName,
      command,
      ecsRole,
    );

    expressions.forEach((expression, index) => {
      const name = `${batchName}-${index + 1}`;
      const batches = new events.Rule(this.scope, name, {
        ruleName: name,
        description: `Rule Schedules for ${batchName}`,
        schedule: events.Schedule.expression(expression),
      });
      batches.addTarget(
        new targets.BatchJob(
          jobQueue.attrJobQueueArn,
          jobQueue,
          jobDefinition.ref,
          jobDefinition,
          {
            jobName: batchName,
          },
        ),
      );
    });
  }
}
