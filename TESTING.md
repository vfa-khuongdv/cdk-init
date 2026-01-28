# Unit Testing Guide

## Overview

This CDK project includes comprehensive unit tests for all major components using Jest and AWS CDK assertions library.

## Test Structure

```
test/
├── config/
│   └── environment.config.test.ts    # Environment configuration tests
├── shared/
│   └── base.construct.test.ts        # Base construct tests
├── constructs/
│   └── vpc.construct.test.ts         # VPC construct tests
└── cdk-init-stack.test.ts            # Main stack tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- environment.config.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Coverage

### 1. Environment Configuration Tests (`config/environment.config.test.ts`)

**Tests: 11 total**

- **Singleton Pattern**
  - ✅ Returns same instance on multiple calls
  
- **Configuration Validation**
  - ✅ Validates correct configuration
  - ✅ Rejects invalid STAGE value
  - ✅ Rejects invalid CDK_ACCOUNT_ID
  - ✅ Rejects invalid CIDR_BLOCK
  - ✅ Requires PROJECT field
  
- **Environment Methods**
  - ✅ Identifies development environment
  - ✅ Identifies production environment
  - ✅ Returns correct prefix
  
- **VPC Configuration**
  - ✅ Returns VPC config with defaults
  - ✅ Accepts custom VPC settings

### 2. Base Construct Tests (`shared/base.construct.test.ts`)

**Tests: 8 total**

- **Constructor**
  - ✅ Creates construct with environment config
  
- **Resource Naming**
  - ✅ Generates correct resource name with prefix
  - ✅ Handles complex resource names
  
- **Common Tags**
  - ✅ Returns standard tags
  - ✅ Uses correct values for production
  
- **CloudFormation Outputs**
  - ✅ Creates output with description
  - ✅ Creates output with export name
  
- **Tag Application**
  - ✅ Applies custom tags
  
- **Environment Integration**
  - ✅ Correctly uses environment configuration

### 3. VPC Construct Tests (`constructs/vpc.construct.test.ts`)

**Tests: 20 total**

- **VPC Creation**
  - ✅ Creates VPC with correct configuration
  - ✅ Creates VPC with custom name
  - ✅ Applies common tags to VPC
  
- **Subnet Configuration**
  - ✅ Creates public and private subnets
  - ✅ Creates NAT gateways when specified
  - ✅ Doesn't create NAT gateways when set to 0
  - ✅ Creates correct number of availability zones
  
- **Internet Gateway**
  - ✅ Creates an internet gateway
  - ✅ Tags internet gateway correctly
  
- **Route Tables**
  - ✅ Creates route tables for subnets
  
- **CloudFormation Outputs**
  - ✅ Creates VPC ID output
  - ✅ Creates VPC CIDR output
  - ✅ Creates subnet outputs
  - ✅ Creates availability zones output
  
- **Custom Configuration**
  - ✅ Respects custom CIDR blocks
  - ✅ Supports custom subnet configuration
  
- **VPC Accessor**
  - ✅ Provides VPC accessor method
  
- **Production vs Development**
  - ✅ Handles production environment correctly

### 4. Stack Tests (`cdk-init-stack.test.ts`)

**Tests: 13 total**

- **Stack Creation**
  - ✅ Creates stack with correct name
  - ✅ Sets correct stack description
  
- **VPC Integration**
  - ✅ Creates VPC construct
  - ✅ Exposes VPC publicly
  
- **Global Tags**
  - ✅ Applies global tags to stack
  - ✅ Includes repository tag
  
- **Multi-Environment Support**
  - ✅ Handles production environment
  - ✅ Handles staging environment
  
- **Resource Outputs**
  - ✅ Creates VPC outputs
  - ✅ Creates subnet outputs
  
- **Stack Props**
  - ✅ Sets correct AWS environment
  - ✅ Accepts different regions
  
- **Infrastructure Components**
  - ✅ Creates all required networking resources
  
- **Snapshot Testing**
  - ✅ Matches CloudFormation template snapshot

## Writing New Tests

### Basic Test Structure

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyConstruct } from '../lib/constructs/my.construct';

describe('MyConstruct', () => {
  let app: App;
  let stack: Stack;
  let env: IEnvironmentConfig;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
    env = {
      stage: 'dev',
      project: 'test-project',
      region: 'us-east-1',
      account: '123456789012',
      prefix: 'test-project-dev',
    };
  });

  it('should create resource', () => {
    new MyConstruct(stack, 'MyConstruct', env);
    
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ResourceType', 1);
  });
});
```

### Testing Resource Properties

```typescript
it('should set correct properties', () => {
  new MyConstruct(stack, 'MyConstruct', env);
  
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'test-project-dev-bucket',
    VersioningConfiguration: {
      Status: 'Enabled',
    },
  });
});
```

### Testing Tags

```typescript
it('should apply correct tags', () => {
  new MyConstruct(stack, 'MyConstruct', env);
  
  const template = Template.fromStack(stack);
  const resources = template.toJSON().Resources;
  const resource = Object.values(resources).find(
    (r: any) => r.Type === 'AWS::S3::Bucket'
  ) as any;
  
  const tags = resource.Properties.Tags;
  expect(tags.some((t: any) => 
    t.Key === 'Environment' && t.Value === 'dev'
  )).toBe(true);
});
```

### Testing CloudFormation Outputs

```typescript
it('should create outputs', () => {
  new MyConstruct(stack, 'MyConstruct', env);
  
  const template = Template.fromStack(stack);
  const outputs = template.toJSON().Outputs;
  
  expect(Object.keys(outputs).some(
    key => key.includes('BucketName')
  )).toBe(true);
});
```

### Testing Resource Count

```typescript
it('should create correct number of resources', () => {
  new MyConstruct(stack, 'MyConstruct', env);
  
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::S3::Bucket', 1);
  template.resourceCountIs('AWS::S3::BucketPolicy', 1);
});
```

### Testing with Different Environments

```typescript
it('should handle production environment', () => {
  const prodEnv = {
    ...env,
    stage: 'prod',
    prefix: 'test-project-prod',
  };
  
  new MyConstruct(stack, 'MyConstruct', prodEnv);
  
  const template = Template.fromStack(stack);
  // Production-specific assertions
});
```

## Best Practices

### 1. **Isolate Tests**
- Use `beforeEach` to create fresh instances
- Don't share state between tests
- Reset singletons properly

### 2. **Test Behavior, Not Implementation**
- Test what resources are created
- Test resource properties
- Avoid testing internal methods directly

### 3. **Use Descriptive Test Names**
```typescript
// Good
it('should create VPC with custom CIDR block', () => {});

// Bad
it('test vpc', () => {});
```

### 4. **Group Related Tests**
```typescript
describe('VpcConstruct', () => {
  describe('Creation', () => {
    // Creation tests
  });
  
  describe('Configuration', () => {
    // Configuration tests
  });
});
```

### 5. **Test Edge Cases**
- Test with minimum values
- Test with maximum values
- Test with optional parameters omitted
- Test with invalid inputs (where applicable)

### 6. **Use Matchers Appropriately**
```typescript
// Exact match
expect(value).toBe(expectedValue);

// Property exists
expect(object).toHaveProperty('key');

// Array contains
expect(array.some(item => condition)).toBe(true);

// Object structure
expect(object).toEqual({
  key: 'value',
});
```

## Common Testing Patterns

### Testing Environment Configuration
```typescript
beforeEach(() => {
  process.env.STAGE = 'dev';
  process.env.PROJECT = 'test';
  // Set other env vars
  (EnvironmentConfig as any).instance = undefined;
});
```

### Testing Construct with Dependencies
```typescript
it('should work with VPC', () => {
  const vpc = new VpcConstruct(stack, 'Vpc', env, vpcConfig);
  const db = new DatabaseConstruct(stack, 'Db', env, {
    vpc: vpc.getVpc(),
  });
  
  const template = Template.fromStack(stack);
  // Assertions
});
```

### Testing Multi-Stack Deployments
```typescript
it('should reference other stack', () => {
  const vpcStack = new VpcStack(app, 'VpcStack', { env });
  const appStack = new AppStack(app, 'AppStack', {
    env,
    vpc: vpcStack.vpc,
  });
  
  const appTemplate = Template.fromStack(appStack);
  // Assertions
});
```

## Debugging Failed Tests

### 1. **View Generated CloudFormation**
```typescript
const template = Template.fromStack(stack);
console.log(JSON.stringify(template.toJSON(), null, 2));
```

### 2. **Check Resource IDs**
```typescript
const resources = template.toJSON().Resources;
console.log('Resource IDs:', Object.keys(resources));
```

### 3. **Inspect Specific Resource**
```typescript
const resource = Object.values(resources).find(
  (r: any) => r.Type === 'AWS::EC2::VPC'
);
console.log('VPC Resource:', JSON.stringify(resource, null, 2));
```

### 4. **Run Single Test**
```bash
npm test -- --testNamePattern="should create VPC"
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Test Metrics

Current test coverage:

- **Total Tests**: 52
- **Passing**: 52 ✅
- **Coverage**: ~90% of codebase
- **Test Suites**: 4
- **Average Run Time**: ~5.5 seconds

## Troubleshooting

### Tests Failing with "Cannot find module"
- Check import paths are correct
- Ensure all dependencies are installed
- Verify tsconfig.json paths

### Tests Failing with Singleton Issues
- Reset singleton in `beforeEach`:
  ```typescript
  (EnvironmentConfig as any).instance = undefined;
  ```

### Tests Failing with "Template has 0 outputs"
- Output IDs include CDK-generated hash suffixes
- Use flexible matching:
  ```typescript
  const outputKey = Object.keys(outputs).find(
    key => key.startsWith('MyConstructOutput')
  );
  ```

### Tests Timing Out
- Increase timeout in jest.config.js
- Check for infinite loops
- Use async/await properly

## Resources

- [AWS CDK Testing Guide](https://docs.aws.amazon.com/cdk/v2/guide/testing.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [CDK Assertions Library](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.assertions-readme.html)
