# CDK Development Workflows

Comprehensive step-by-step workflows for AWS CDK development.

## Workflow 1: Creating a New Feature (Stack + Construct + Tests)

Complete workflow for implementing a new infrastructure feature.

### Step 1: Analyze Requirements
- Identify AWS services needed
- Determine resource dependencies
- Consider security requirements
- Plan for testability

### Step 2: Create the Construct

**File: `lib/constructs/my-feature.construct.ts`**
```typescript
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface MyFeatureConstructProps {
  readonly vpc: ec2.IVpc;
  readonly bucketName?: string;
  readonly enableEncryption?: boolean;
  readonly environment: string;
}

export class MyFeatureConstruct extends Construct {
  public readonly bucket: s3.IBucket;
  
  constructor(scope: Construct, id: string, props: MyFeatureConstructProps) {
    super(scope, id);
    
    // Validate props
    if (!props.vpc) {
      throw new Error('VPC is required for MyFeatureConstruct');
    }
    
    // Create resources
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      encryption: props.enableEncryption !== false 
        ? s3.BucketEncryption.S3_MANAGED 
        : s3.BucketEncryption.UNENCRYPTED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'prod',
    });
    
    // Add tags
    cdk.Tags.of(this.bucket).add('Environment', props.environment);
    cdk.Tags.of(this.bucket).add('ManagedBy', 'CDK');
  }
}
```

### Step 3: Create the Stack

**File: `lib/stacks/my-feature-stack.ts`**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { MyFeatureConstruct } from '../constructs/my-feature.construct';

export interface MyFeatureStackProps extends cdk.StackProps {
  readonly vpcId?: string;
  readonly environment: string;
}

export class MyFeatureStack extends cdk.Stack {
  public readonly feature: MyFeatureConstruct;
  
  constructor(scope: Construct, id: string, props: MyFeatureStackProps) {
    super(scope, id, props);
    
    // Import or create VPC
    const vpc = props.vpcId
      ? ec2.Vpc.fromLookup(this, 'VPC', { vpcId: props.vpcId })
      : new ec2.Vpc(this, 'VPC', {
          ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
          maxAzs: 2,
        });
    
    // Create feature
    this.feature = new MyFeatureConstruct(this, 'MyFeature', {
      vpc,
      environment: props.environment,
      enableEncryption: true,
    });
    
    // Stack outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.feature.bucket.bucketName,
      description: 'The name of the S3 bucket',
      exportName: `${id}-BucketName`,
    });
  }
}
```

### Step 4: Write Unit Tests

**File: `test/constructs/my-feature.construct.test.ts`**
```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { MyFeatureConstruct } from '../../lib/constructs/my-feature.construct';

describe('MyFeatureConstruct', () => {
  let app: App;
  let stack: Stack;
  let vpc: ec2.Vpc;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
    vpc = new ec2.Vpc(stack, 'VPC');
  });

  test('creates S3 bucket with encryption', () => {
    new MyFeatureConstruct(stack, 'MyFeature', {
      vpc,
      environment: 'test',
      enableEncryption: true,
    });

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

  test('blocks public access to bucket', () => {
    new MyFeatureConstruct(stack, 'MyFeature', {
      vpc,
      environment: 'test',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('throws error when VPC is missing', () => {
    expect(() => {
      new MyFeatureConstruct(stack, 'MyFeature', {
        vpc: undefined as any,
        environment: 'test',
      });
    }).toThrow('VPC is required');
  });
});
```

### Steps 5-8: Build, Test, and Deploy

```bash
# Step 5: Run tests
npm test

# Step 6: Register in bin/cdk-init.ts
# Add: new MyFeatureStack(app, 'MyFeature-dev', { environment: 'dev' });

# Step 7: Synthesize and validate
npm run build && cdk synth

# Step 8: Deploy
cdk diff
cdk deploy
```

## Workflow 2: Adding Resources to Existing Stack

### Quick Process
1. Read existing stack file
2. Add new resource with proper imports
3. Grant permissions using `grantXxx` methods
4. Write tests for new resource
5. Run: `npm run build && npm test && cdk diff && cdk deploy`

### Example: Adding Lambda to Existing Stack
```typescript
// In lib/stacks/my-feature-stack.ts
import * as lambda from 'aws-cdk-lib/aws-lambda';

// Inside constructor:
const fn = new lambda.Function(this, 'ProcessorFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  environment: {
    BUCKET_NAME: this.feature.bucket.bucketName,
  },
});

this.feature.bucket.grantReadWrite(fn);
```

## Workflow 3: Test-Driven Development (TDD)

### RED → GREEN → REFACTOR Cycle

**1. Write test first (RED)**
```typescript
test('creates REST API with correct name', () => {
  const app = new App();
  const stack = new Stack(app, 'Test');
  
  new ApiGatewayConstruct(stack, 'Api', { apiName: 'MyAPI' });
  
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    Name: 'MyAPI',
  });
});
```

**2. Run test (should fail)**
```bash
npm test  # Fails because construct doesn't exist
```

**3. Write minimal code (GREEN)**
```typescript
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export interface ApiGatewayConstructProps {
  readonly apiName: string;
}

export class ApiGatewayConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);
    new apigateway.RestApi(this, 'RestApi', {
      restApiName: props.apiName,
    });
  }
}
```

**4. Test passes, then refactor and add features**

## Workflow 4: Environment-Specific Configuration

### Configuration File
**File: `config/environment.config.ts`**
```typescript
export interface EnvironmentConfig {
  readonly account: string;
  readonly region: string;
  readonly vpcCidr: string;
  readonly enableBackup: boolean;
  readonly enableMultiAz: boolean;
  readonly removalPolicy: 'DESTROY' | 'RETAIN' | 'SNAPSHOT';
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '',
    region: 'us-east-1',
    vpcCidr: '10.0.0.0/16',
    enableBackup: false,
    enableMultiAz: false,
    removalPolicy: 'DESTROY',
  },
  prod: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '',
    region: 'us-west-2',
    vpcCidr: '10.2.0.0/16',
    enableBackup: true,
    enableMultiAz: true,
    removalPolicy: 'RETAIN',
  },
};

export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const config = environments[env];
  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }
  return config;
}
```

### Usage in Stack
```typescript
import { getEnvironmentConfig } from '../config/environment.config';

const envName = this.node.tryGetContext('env') || 'dev';
const config = getEnvironmentConfig(envName);

const vpc = new ec2.Vpc(this, 'VPC', {
  ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
  maxAzs: config.enableMultiAz ? 3 : 2,
});
```

### Deploy
```bash
cdk deploy --context env=dev
cdk deploy --context env=prod
```

## Workflow 5: Debugging

### Test Failures
```bash
# Verbose output
npm test -- --verbose

# See full template
const template = Template.fromStack(stack);
console.log(JSON.stringify(template.toJSON(), null, 2));

# Run specific test
npm test -- --testNamePattern="creates S3 bucket"
```

### Deployment Failures
```bash
# Check synthesis
npm run build && cdk synth

# Review changes
cdk diff

# Deploy with verbose
cdk deploy --verbose

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name MyStack
```

## Workflow 6: Code Quality Checklist

### Before Committing
- [ ] Props use `readonly` modifier
- [ ] No hardcoded secrets or credentials
- [ ] S3 buckets have `blockPublicAccess: BLOCK_ALL`
- [ ] Encryption enabled for data at rest
- [ ] IAM follows least privilege
- [ ] Tests written and passing (>80% coverage)
- [ ] `npm run build` succeeds
- [ ] `cdk synth` succeeds
- [ ] `cdk diff` reviewed

### TypeScript Best Practices
```typescript
// ✅ GOOD: Readonly, explicit types, validation
export interface MyProps {
  readonly vpc: ec2.IVpc;
  readonly databaseName: string;
}

export class MyConstruct extends Construct {
  public readonly bucket: s3.IBucket;
  
  constructor(scope: Construct, id: string, props: MyProps) {
    super(scope, id);
    
    if (!props.vpc) {
      throw new Error('VPC is required');
    }
    
    // Implementation
  }
}
```

## Testing Patterns

### Resource Count
```typescript
template.resourceCountIs('AWS::EC2::VPC', 1);
```

### Resource Properties
```typescript
template.hasResourceProperties('AWS::S3::Bucket', {
  BucketEncryption: Match.objectLike({
    ServerSideEncryptionConfiguration: Match.anyValue(),
  }),
});
```

### IAM Permissions
```typescript
template.hasResourceProperties('AWS::IAM::Policy', {
  PolicyDocument: {
    Statement: Match.arrayWith([
      Match.objectLike({
        Effect: 'Allow',
        Action: Match.arrayWith(['s3:PutObject*']),
      }),
    ]),
  },
});
```

### Error Conditions
```typescript
expect(() => {
  new MyConstruct(stack, 'Test', { vpc: undefined as any });
}).toThrow('VPC is required');
```

### Snapshot Testing
```typescript
expect(template.toJSON()).toMatchSnapshot();
```

## Quick Reference - Common Tasks

### Lambda Function
```typescript
const fn = new lambda.Function(this, 'Function', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  environment: { TABLE_NAME: table.tableName },
});
table.grantReadWrite(fn);
```

### DynamoDB Table
```typescript
const table = new dynamodb.Table(this, 'Table', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});
```

### S3 Bucket (Secure)
```typescript
const bucket = new s3.Bucket(this, 'Bucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
```

### VPC
```typescript
const vpc = new ec2.Vpc(this, 'VPC', {
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
  maxAzs: 2,
  natGateways: 1,
});
```

### Stack Output
```typescript
new cdk.CfnOutput(this, 'ApiUrl', {
  value: api.url,
  exportName: 'MyApiUrl',
});
```

## Common Commands

```bash
# Development
npm install
npm run build
npm test
npm test -- --watch

# CDK Operations
cdk list
cdk synth
cdk diff
cdk deploy
cdk deploy --all
cdk destroy

# With Context
cdk deploy --context env=prod

# Bootstrap
cdk bootstrap

# Validation
scripts/validate-stack.sh
scripts/diff-all-stacks.sh
```

For more detailed patterns, see [references/PATTERNS.md](references/PATTERNS.md)  
For AWS service examples, see [references/AWS_SERVICES.md](references/AWS_SERVICES.md)  
For complete CLI reference, see [references/COMMANDS.md](references/COMMANDS.md)
