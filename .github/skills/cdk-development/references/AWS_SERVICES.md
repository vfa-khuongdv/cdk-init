# AWS Services CDK Reference

This document provides CDK code examples for common AWS services.

## Compute

### Lambda Functions

#### Basic Lambda
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';

const fn = new lambda.Function(this, 'Function', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  timeout: cdk.Duration.seconds(30),
  memorySize: 256,
  environment: {
    TABLE_NAME: table.tableName,
  },
});
```

#### Lambda with Layers
```typescript
const layer = new lambda.LayerVersion(this, 'Layer', {
  code: lambda.Code.fromAsset('lambda-layers'),
  compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
  description: 'Common dependencies',
});

const fn = new lambda.Function(this, 'Function', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  layers: [layer],
});
```

#### Lambda with Docker
```typescript
const fn = new lambda.DockerImageFunction(this, 'Function', {
  code: lambda.DockerImageCode.fromImageAsset('lambda-docker'),
  timeout: cdk.Duration.minutes(5),
  memorySize: 1024,
});
```

### ECS

#### Fargate Service
```typescript
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

const cluster = new ecs.Cluster(this, 'Cluster', {
  vpc,
});

const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
  cluster,
  taskImageOptions: {
    image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
    containerPort: 80,
  },
  desiredCount: 2,
  cpu: 256,
  memoryLimitMiB: 512,
});
```

## Storage

### S3

#### Static Website
```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
  websiteIndexDocument: 'index.html',
  websiteErrorDocument: 'error.html',
  publicReadAccess: true,
  blockPublicAccess: new s3.BlockPublicAccess({
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }),
});
```

#### S3 with Lifecycle Rules
```typescript
const bucket = new s3.Bucket(this, 'Bucket', {
  lifecycleRules: [
    {
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        },
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
      expiration: cdk.Duration.days(365),
    },
  ],
});
```

### DynamoDB

#### Basic Table
```typescript
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const table = new dynamodb.Table(this, 'Table', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
```

#### Table with GSI
```typescript
const table = new dynamodb.Table(this, 'Table', {
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
});

table.addGlobalSecondaryIndex({
  indexName: 'EmailIndex',
  partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});
```

### EFS

```typescript
import * as efs from 'aws-cdk-lib/aws-efs';

const fileSystem = new efs.FileSystem(this, 'FileSystem', {
  vpc,
  encrypted: true,
  lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
  performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
  throughputMode: efs.ThroughputMode.BURSTING,
});
```

## Database

### RDS

#### PostgreSQL
```typescript
import * as rds from 'aws-cdk-lib/aws-rds';

const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_14,
  }),
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.MICRO
  ),
  multiAz: true,
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  storageEncrypted: true,
  backupRetention: cdk.Duration.days(7),
  deletionProtection: true,
  removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
});
```

#### Aurora Serverless
```typescript
const cluster = new rds.ServerlessCluster(this, 'AuroraCluster', {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_13_7,
  }),
  vpc,
  scaling: {
    autoPause: cdk.Duration.minutes(10),
    minCapacity: rds.AuroraCapacityUnit.ACU_2,
    maxCapacity: rds.AuroraCapacityUnit.ACU_16,
  },
  enableDataApi: true,
  backupRetention: cdk.Duration.days(7),
});
```

### ElastiCache

```typescript
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

const subnetGroup = new elasticache.CfnSubnetGroup(this, 'SubnetGroup', {
  description: 'Redis subnet group',
  subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
});

const securityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
  vpc,
  description: 'Redis security group',
});

const redis = new elasticache.CfnCacheCluster(this, 'Redis', {
  cacheNodeType: 'cache.t3.micro',
  engine: 'redis',
  numCacheNodes: 1,
  vpcSecurityGroupIds: [securityGroup.securityGroupId],
  cacheSubnetGroupName: subnetGroup.ref,
});
```

## Networking

### VPC with NAT Gateway
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const vpc = new ec2.Vpc(this, 'VPC', {
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
  maxAzs: 2,
  natGateways: 1,
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
    {
      name: 'Isolated',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      cidrMask: 24,
    },
  ],
});
```

### Application Load Balancer
```typescript
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
  vpc,
  internetFacing: true,
});

const listener = alb.addListener('Listener', {
  port: 443,
  certificates: [certificate],
});

listener.addTargets('Targets', {
  port: 80,
  targets: [autoScalingGroup],
  healthCheck: {
    path: '/health',
    interval: cdk.Duration.seconds(30),
  },
});
```

### CloudFront Distribution
```typescript
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(bucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  defaultRootObject: 'index.html',
  certificate,
  domainNames: ['example.com'],
});
```

## Security

### Secrets Manager
```typescript
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const secret = new secretsmanager.Secret(this, 'Secret', {
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'admin' }),
    generateStringKey: 'password',
    excludePunctuation: true,
    passwordLength: 16,
  },
});

// Use in RDS
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_14,
  }),
  vpc,
  credentials: rds.Credentials.fromSecret(secret),
});
```

### IAM Role
```typescript
import * as iam from 'aws-cdk-lib/aws-iam';

const role = new iam.Role(this, 'Role', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
});

role.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:GetObject'],
  resources: [bucket.arnForObjects('*')],
}));
```

### WAF
```typescript
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  rules: [
    {
      name: 'RateLimitRule',
      priority: 1,
      statement: {
        rateBasedStatement: {
          limit: 2000,
          aggregateKeyType: 'IP',
        },
      },
      action: { block: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'RateLimitRule',
      },
    },
  ],
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'WebACL',
  },
});
```

## Messaging

### SNS Topic
```typescript
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

const topic = new sns.Topic(this, 'Topic', {
  displayName: 'My Topic',
});

topic.addSubscription(new subscriptions.EmailSubscription('admin@example.com'));
topic.addSubscription(new subscriptions.LambdaSubscription(fn));
```

### SQS Queue
```typescript
import * as sqs from 'aws-cdk-lib/aws-sqs';

const queue = new sqs.Queue(this, 'Queue', {
  visibilityTimeout: cdk.Duration.seconds(300),
  retentionPeriod: cdk.Duration.days(14),
  encryption: sqs.QueueEncryption.KMS_MANAGED,
});

const deadLetterQueue = new sqs.Queue(this, 'DLQ', {
  retentionPeriod: cdk.Duration.days(14),
});

const mainQueue = new sqs.Queue(this, 'MainQueue', {
  deadLetterQueue: {
    queue: deadLetterQueue,
    maxReceiveCount: 3,
  },
});
```

### EventBridge
```typescript
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

const rule = new events.Rule(this, 'Rule', {
  schedule: events.Schedule.cron({ minute: '0', hour: '12' }),
});

rule.addTarget(new targets.LambdaFunction(fn));

// Custom event pattern
const customRule = new events.Rule(this, 'CustomRule', {
  eventPattern: {
    source: ['myapp'],
    detailType: ['user-signup'],
  },
});
```

## Monitoring

### CloudWatch Alarms
```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';

const alarm = new cloudwatch.Alarm(this, 'Alarm', {
  metric: fn.metricErrors(),
  threshold: 10,
  evaluationPeriods: 2,
  datapointsToAlarm: 2,
});

alarm.addAlarmAction(new actions.SnsAction(topic));
```

### CloudWatch Dashboard
```typescript
const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
  dashboardName: 'ApplicationDashboard',
});

dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Lambda Invocations',
    left: [fn.metricInvocations()],
  }),
  new cloudwatch.GraphWidget({
    title: 'Lambda Errors',
    left: [fn.metricErrors()],
  })
);
```
