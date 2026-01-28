---
name: cdk-development
description: AWS Cloud Development Kit (CDK) expertise for building, deploying, and managing cloud infrastructure as code using TypeScript. Use when working with CDK stacks, constructs, AWS resources, infrastructure deployment, cdk synth, cdk deploy, or when the user mentions AWS infrastructure, CloudFormation, or CDK-related tasks.
license: MIT
compatibility: Requires Node.js, AWS CDK CLI, and AWS credentials configured
metadata:
  author: cdk-init-template
  version: "1.0"
  cdk-version: "2.x"
---

# CDK Development Skill

This skill provides comprehensive guidance for AWS Cloud Development Kit (CDK) development, including best practices, patterns, and workflows for building cloud infrastructure as code.

## When to Use This Skill

Use this skill when:
- Creating or modifying CDK stacks and constructs
- Deploying AWS infrastructure using CDK
- Debugging CDK synthesis or deployment issues
- Implementing AWS resources (VPC, Lambda, ECS, RDS, etc.)
- Setting up multi-environment CDK projects
- Writing CDK tests with Jest
- Optimizing CDK code structure and organization

## Core Concepts

### CDK Stack
A stack is a unit of deployment that represents a CloudFormation stack. Each stack contains constructs that define AWS resources.

### CDK Construct
Constructs are the building blocks of CDK applications. There are three levels:
- **L1 Constructs**: Direct CloudFormation resource mappings (CfnXxx classes)
- **L2 Constructs**: Higher-level abstractions with sensible defaults
- **L3 Constructs**: Opinionated patterns combining multiple resources

### Project Structure
```
cdk-project/
├── bin/                 # Entry point for CDK app
├── lib/                 # Stack and construct definitions
│   ├── stacks/         # CDK stack classes
│   ├── constructs/     # Reusable construct classes
│   └── shared/         # Shared utilities and types
├── config/             # Environment-specific configuration
├── test/               # Jest unit tests
└── cdk.json            # CDK configuration
```

## Step-by-Step Workflows

### Creating a New Stack

1. **Define the stack class** in `lib/stacks/`:
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Add resources here
  }
}
```

2. **Register the stack** in `bin/cdk-app.ts`:
```typescript
import { MyStack } from '../lib/stacks/my-stack';

const app = new cdk.App();
new MyStack(app, 'MyStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

3. **Synthesize and deploy**:
```bash
npm run build
cdk synth
cdk deploy
```

### Creating a Reusable Construct

1. **Create construct class** in `lib/constructs/`:
```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface MyConstructProps {
  vpcCidr: string;
}

export class MyConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: MyConstructProps) {
    super(scope, id);
    
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      maxAzs: 2,
    });
  }
}
```

2. **Use in stack**:
```typescript
const myConstruct = new MyConstruct(this, 'MyConstruct', {
  vpcCidr: '10.0.0.0/16',
});
```

### Testing CDK Code

1. **Write unit tests** in `test/`:
```typescript
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyStack } from '../lib/stacks/my-stack';

test('VPC Created', () => {
  const app = new App();
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  
  template.resourceCountIs('AWS::EC2::VPC', 1);
});
```

2. **Run tests**:
```bash
npm test
```

### Deploying to Multiple Environments

1. **Create environment config** in `config/`:
```typescript
export interface EnvironmentConfig {
  account: string;
  region: string;
  vpcCidr: string;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    account: '123456789012',
    region: 'us-east-1',
    vpcCidr: '10.0.0.0/16',
  },
  prod: {
    account: '123456789012',
    region: 'us-west-2',
    vpcCidr: '10.1.0.0/16',
  },
};
```

2. **Deploy to specific environment**:
```bash
cdk deploy --context env=dev
cdk deploy --context env=prod
```

## Common Patterns

### VPC with Public and Private Subnets
```typescript
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
  ],
});
```

### Lambda Function with VPC Access
```typescript
const lambda = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  vpc: vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});
```

### S3 Bucket with Encryption
```typescript
const bucket = new s3.Bucket(this, 'MyBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
```

## Best Practices

### Resource Naming
- Use descriptive logical IDs
- Avoid hardcoding resource names (let CDK generate them)
- Use `cdk.Names.uniqueId()` for stable unique names

### Props Pattern
```typescript
export interface MyConstructProps {
  readonly vpc: ec2.IVpc;
  readonly databaseName: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}
```
- Use readonly properties
- Provide sensible defaults
- Make required vs optional explicit

### Tagging
```typescript
cdk.Tags.of(stack).add('Environment', 'production');
cdk.Tags.of(stack).add('Owner', 'platform-team');
```

### Security
- Enable encryption by default
- Use `blockPublicAccess` for S3 buckets
- Restrict security group rules to minimum required
- Use IAM roles with least privilege
- Never hardcode credentials

### Error Handling
```typescript
if (!props.vpc) {
  throw new Error('VPC is required');
}
```

## Troubleshooting

### Synthesis Errors
- Check for circular dependencies
- Verify all required props are provided
- Ensure constructs are created in correct order

### Deployment Failures
- Review CloudFormation events in AWS Console
- Check IAM permissions
- Verify resource limits and quotas
- Use `cdk diff` before deploying

### Resource Updates
- Some resources require replacement (will be deleted and recreated)
- Use `removalPolicy` to control deletion behavior
- Check `cdk diff` output for update/replace indicators

## Useful Commands

```bash
# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Show differences between local and deployed
cdk diff

# Deploy stack
cdk deploy

# Deploy specific stack
cdk deploy MyStack

# Deploy all stacks
cdk deploy --all

# Destroy stack
cdk destroy

# List all stacks
cdk list

# Bootstrap CDK toolkit stack
cdk bootstrap

# Run tests
npm test

# Watch mode for tests
npm test -- --watch
```

## Additional Resources

See [references/PATTERNS.md](references/PATTERNS.md) for advanced CDK patterns.
See [references/AWS_SERVICES.md](references/AWS_SERVICES.md) for service-specific guidance.

## Scripts

Use the provided scripts for common operations:
- `scripts/validate-stack.sh` - Validate stack configuration
- `scripts/diff-all-stacks.sh` - Show diffs for all stacks
