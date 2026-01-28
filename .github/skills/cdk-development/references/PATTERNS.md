# CDK Advanced Patterns

This document provides advanced patterns and best practices for AWS CDK development.

## Multi-Stack Patterns

### Cross-Stack References

When resources need to be shared between stacks, use cross-stack references:

```typescript
// Network stack
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
    });
  }
}

// Application stack
export interface AppStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);
    
    // Use VPC from network stack
    const lambda = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      vpc: props.vpc,
    });
  }
}

// In app
const networkStack = new NetworkStack(app, 'Network');
const appStack = new AppStack(app, 'App', {
  vpc: networkStack.vpc,
});
```

### Pipeline Stack Pattern

Use separate stacks for CI/CD pipelines:

```typescript
export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.gitHub('owner/repo', 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });
    
    // Add stages
    pipeline.addStage(new AppStage(this, 'Dev'));
    pipeline.addStage(new AppStage(this, 'Prod'));
  }
}
```

## Construct Composition Patterns

### Encapsulation Pattern

Encapsulate complex resource configurations:

```typescript
export interface WebServerProps {
  vpc: ec2.IVpc;
  instanceType?: ec2.InstanceType;
  keyName?: string;
}

export class WebServer extends Construct {
  public readonly instance: ec2.Instance;
  public readonly securityGroup: ec2.SecurityGroup;
  
  constructor(scope: Construct, id: string, props: WebServerProps) {
    super(scope, id);
    
    // Create security group
    this.securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web server',
      allowAllOutbound: true,
    });
    
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP'
    );
    
    // Create instance
    this.instance = new ec2.Instance(this, 'Instance', {
      vpc: props.vpc,
      instanceType: props.instanceType || ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: this.securityGroup,
      keyName: props.keyName,
    });
  }
}
```

### Builder Pattern

Create fluent APIs for construct configuration:

```typescript
export class DatabaseBuilder {
  private props: Partial<DatabaseProps> = {};
  
  withVpc(vpc: ec2.IVpc): this {
    this.props.vpc = vpc;
    return this;
  }
  
  withInstanceType(type: ec2.InstanceType): this {
    this.props.instanceType = type;
    return this;
  }
  
  withMultiAz(enabled: boolean): this {
    this.props.multiAz = enabled;
    return this;
  }
  
  withBackup(retention: cdk.Duration): this {
    this.props.backupRetention = retention;
    return this;
  }
  
  build(scope: Construct, id: string): Database {
    if (!this.props.vpc) {
      throw new Error('VPC is required');
    }
    return new Database(scope, id, this.props as DatabaseProps);
  }
}

// Usage
const db = new DatabaseBuilder()
  .withVpc(vpc)
  .withInstanceType(ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.SMALL
  ))
  .withMultiAz(true)
  .withBackup(cdk.Duration.days(7))
  .build(this, 'Database');
```

## Aspect Pattern

Use Aspects to apply modifications across multiple constructs:

```typescript
import { IAspect, IConstruct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class BucketEncryptionAspect implements IAspect {
  visit(node: IConstruct): void {
    if (node instanceof s3.CfnBucket) {
      // Ensure all buckets have encryption
      if (!node.bucketEncryption) {
        node.bucketEncryption = {
          serverSideEncryptionConfiguration: [{
            serverSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          }],
        };
      }
    }
  }
}

// Apply to stack
cdk.Aspects.of(stack).add(new BucketEncryptionAspect());
```

## Custom Resource Pattern

Create custom resources for operations not natively supported:

```typescript
import * as cr from 'aws-cdk-lib/custom-resources';

export class CustomDatabaseInitializer extends Construct {
  constructor(scope: Construct, id: string, props: {
    database: rds.DatabaseInstance;
    schema: string;
  }) {
    super(scope, id);
    
    const onEvent = new lambda.Function(this, 'OnEvent', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.on_event',
      code: lambda.Code.fromAsset('lambda/db-initializer'),
      vpc: props.database.vpc,
    });
    
    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler: onEvent,
    });
    
    new cdk.CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      properties: {
        DatabaseEndpoint: props.database.dbInstanceEndpointAddress,
        Schema: props.schema,
      },
    });
  }
}
```

## Feature Flags

Use context and feature flags for progressive rollout:

```typescript
export class FeatureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const enableNewFeature = this.node.tryGetContext('enableNewFeature') === 'true';
    
    if (enableNewFeature) {
      // Deploy new feature
      new MyNewFeature(this, 'NewFeature');
    } else {
      // Deploy old implementation
      new MyOldFeature(this, 'OldFeature');
    }
  }
}
```

## Resource Import Pattern

Import existing AWS resources:

```typescript
// Import existing VPC
const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
  vpcId: 'vpc-1234567890',
});

// Import existing bucket
const bucket = s3.Bucket.fromBucketName(this, 'Bucket', 'my-existing-bucket');

// Import existing security group
const sg = ec2.SecurityGroup.fromSecurityGroupId(
  this,
  'SecurityGroup',
  'sg-1234567890'
);
```

## Environment-Agnostic Code

Write code that works across accounts and regions:

```typescript
export class EnvironmentAgnosticStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Use environment variables
    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;
    
    // Use Fn.ref for dynamic references
    const param = new ssm.StringParameter(this, 'Param', {
      parameterName: '/config/value',
      stringValue: 'value',
    });
    
    // Reference in same stack
    const value = param.stringValue;
  }
}
```

## Singleton Pattern

Ensure only one instance of a resource exists:

```typescript
export class SingletonBucket extends Construct {
  private static instance: s3.Bucket;
  
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    if (!SingletonBucket.instance) {
      SingletonBucket.instance = new s3.Bucket(this, 'Bucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
      });
    }
  }
  
  public getBucket(): s3.Bucket {
    return SingletonBucket.instance;
  }
}
```

## Removal Policies

Handle resource deletion properly:

```typescript
// Retain data on stack deletion
const dataBucket = new s3.Bucket(this, 'DataBucket', {
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// Destroy non-production data
const tempBucket = new s3.Bucket(this, 'TempBucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true, // Required for DESTROY
});

// Snapshot database before deletion
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_14,
  }),
  vpc,
  removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
});
```

## Dependencies

Explicit dependency management:

```typescript
const bucket = new s3.Bucket(this, 'Bucket');
const lambda = new lambda.Function(this, 'Function', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  environment: {
    BUCKET_NAME: bucket.bucketName,
  },
});

// Explicit dependency
lambda.node.addDependency(bucket);

// Or use grantXxx methods which add dependencies automatically
bucket.grantReadWrite(lambda);
```

## Testing Patterns

### Snapshot Testing
```typescript
test('Stack matches snapshot', () => {
  const app = new App();
  const stack = new MyStack(app, 'Test');
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
```

### Fine-grained Assertions
```typescript
test('S3 bucket has encryption', () => {
  const app = new App();
  const stack = new MyStack(app, 'Test');
  const template = Template.fromStack(stack);
  
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [{
        ServerSideEncryptionByDefault: {
          SSEAlgorithm: 'AES256',
        },
      }],
    },
  });
});
```
