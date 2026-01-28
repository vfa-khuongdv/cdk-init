# CDK Template Quick Reference

## Common Commands

```bash
# Setup
npm install                     # Install dependencies
cp .env.template .env          # Create environment file
npm run bootstrap              # Bootstrap AWS account

# Development
npm run build                  # Compile TypeScript
npm run watch                  # Watch mode compilation
npm test                       # Run tests
npm run test:watch             # Watch mode tests

# Deployment
npm run deploy                 # Deploy all stacks
npm run diff                   # Show deployment diff
npm run synth                  # Generate CloudFormation
npm run list                   # List all stacks
npm run destroy                # Remove all resources

# Specific stack operations
cdk deploy StackName           # Deploy specific stack
cdk destroy StackName          # Destroy specific stack
```

## File Organization

### When to Create New Files

| Location | Purpose | Example |
|----------|---------|---------|
| `lib/constructs/` | Reusable infrastructure components | `database.construct.ts`, `s3.construct.ts` |
| `lib/types/` | TypeScript interfaces | `IDatabaseConfig`, `IS3Config` |
| `lib/stacks/` | Multi-stack deployments | `vpc.stack.ts`, `app.stack.ts` |
| `config/` | Configuration logic | Feature flags, region configs |

## Quick Patterns

### Creating a New Construct

```typescript
// lib/constructs/example.construct.ts
import { Construct } from 'constructs';
import { BaseConstruct } from '../shared/base.construct';
import { IEnvironmentConfig } from '../types';

export class ExampleConstruct extends BaseConstruct {
  constructor(scope: Construct, id: string, env: IEnvironmentConfig) {
    super(scope, id, env);
    
    // 1. Create resources
    // 2. Apply tags: this.applyTags(this.getCommonTags())
    // 3. Create outputs: this.createOutput('Name', value, 'Description')
  }
}
```

### Adding Configuration

```typescript
// 1. lib/types/index.ts
export interface IMyConfig {
  setting: string;
  enabled: boolean;
}

// 2. config/environment.config.ts
const myConfigSchema = z.object({
  setting: z.string().default('value'),
  enabled: z.boolean().default(true),
});

// In EnvironmentConfig class:
public getMyConfig(): IMyConfig {
  return myConfigSchema.parse({
    setting: process.env.MY_SETTING || 'default',
    enabled: process.env.MY_ENABLED === 'true',
  });
}

// 3. .env
MY_SETTING=customvalue
MY_ENABLED=true

// 4. Usage in construct
const config = envConfig.getMyConfig();
```

### Using Constructs in Stack

```typescript
// lib/cdk-init-stack.ts
import { MyConstruct } from './constructs/my.construct';

constructor(scope: Construct, id: string, props: CdkInitStackProps) {
  super(scope, id, props);
  
  const myResource = new MyConstruct(
    this,
    'MyResource',
    props.env
  );
}
```

## Configuration Checklist

### Required Environment Variables
- [ ] STAGE (dev/stg/prod)
- [ ] PROJECT (your project name)
- [ ] CDK_REGION (AWS region)
- [ ] CDK_ACCOUNT_ID (12-digit AWS account)
- [ ] CIDR_BLOCK (VPC CIDR in x.x.x.x/x format)

### Optional Environment Variables
- [ ] VPC_MAX_AZS (default: 2)
- [ ] VPC_NAT_GATEWAYS (default: 0)

## Naming Conventions

### Resources
Format: `{project}-{stage}-{resource-name}`
Example: `myapp-dev-vpc`, `myapp-prod-db`

### Constructs
Format: `{Resource}Construct`
Example: `VpcConstruct`, `DatabaseConstruct`

### Interfaces
Format: `I{Name}Config` or `I{Name}Props`
Example: `IVpcConfig`, `IDatabaseProps`

### CloudFormation Outputs
Format: `{ResourceType}{Property}`
Example: `VpcId`, `BucketName`, `DatabaseEndpoint`

## Common Zod Patterns

```typescript
// String validation
z.string().min(1, 'Required')
z.string().regex(/pattern/, 'Must match pattern')
z.string().email('Must be valid email')

// Number validation
z.number().min(0).max(100)
z.number().int('Must be integer')
z.number().positive()

// Enum
z.enum(['value1', 'value2', 'value3'])

// Boolean
z.boolean().default(false)

// Optional with default
z.string().default('default-value')
z.number().optional()

// Complex objects
z.object({
  nested: z.object({
    field: z.string()
  }).optional()
})

// Array
z.array(z.string())
```

## Tagging Strategy

### Automatic Tags (via BaseConstruct)
- `Environment` - Stage name
- `Project` - Project name
- `ManagedBy` - "CDK"
- `Prefix` - "{project}-{stage}"

### Adding Custom Tags

```typescript
// Single resource
this.applyTags({
  'CustomTag': 'value',
  'Owner': 'team-name',
});

// Specific resource types
this.applyTagsToResourceTypes({
  key: 'Name',
  value: this.getResourceName('resource-name'),
  resourceTypes: ['AWS::EC2::Instance'],
  priority: 300,
});
```

## CloudFormation Outputs

```typescript
// Basic output
this.createOutput('OutputName', value, 'Description');

// With export name
this.createOutput(
  'OutputName',
  value,
  'Description',
  'custom-export-name'
);
```

## Multi-Environment Deployment

```bash
# Deploy to development
cp deployment/.env.dev .env
npm run deploy

# Deploy to staging
cp deployment/.env.stg .env
npm run deploy

# Deploy to production
cp deployment/.env.prod .env
npm run deploy
```

## Troubleshooting Quick Fixes

### Build Errors
```bash
rm -rf node_modules dist cdk.out
npm install
npm run build
```

### Configuration Errors
1. Check .env file exists
2. Verify all required variables are set
3. Check for typos in variable names
4. Ensure CIDR_BLOCK format is correct
5. Verify CDK_ACCOUNT_ID is 12 digits

### Deployment Errors
```bash
# Check differences
npm run diff

# Verify credentials
aws sts get-caller-identity

# Bootstrap if needed
npm run bootstrap

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name {stack-name}
```

## Testing Patterns

```typescript
// test/construct.test.ts
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyConstruct } from '../lib/constructs/my.construct';

test('Creates expected resources', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack');
  
  const env = {
    stage: 'test',
    project: 'test-project',
    region: 'us-east-1',
    account: '123456789012',
    prefix: 'test-project-test',
  };
  
  new MyConstruct(stack, 'Test', env);
  
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::ResourceType', 1);
});
```

## Useful AWS CDK Snippets

### Get VPC from lookup
```typescript
const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
  vpcId: 'vpc-xxxxx',
});
```

### Reference between stacks
```typescript
// In producing stack
new CfnOutput(this, 'VpcIdExport', {
  value: vpc.vpcId,
  exportName: 'SharedVpcId',
});

// In consuming stack
const vpcId = Fn.importValue('SharedVpcId');
```

### Conditional resources
```typescript
if (envConfig.isProduction()) {
  // Production-only resources
}

if (envConfig.isDevelopment()) {
  // Development-only resources
}
```

## Resource Naming Helper

```typescript
// In any BaseConstruct subclass
this.getResourceName('my-resource')
// Returns: {project}-{stage}-my-resource
```

## Getting Configuration

```typescript
import { envConfig } from '../config/environment.config';

// Get full environment
const env = envConfig.getEnvironment();
// Returns: { stage, project, region, account, prefix }

// Get VPC configuration
const vpcConfig = envConfig.getVpcConfig();

// Get prefix only
const prefix = envConfig.getPrefix();

// Check environment
if (envConfig.isProduction()) { /* ... */ }
if (envConfig.isDevelopment()) { /* ... */ }
```

## Important Notes

⚠️ **Never commit .env files to git**  
⚠️ **Always validate configuration before deploying**  
⚠️ **Use `npm run diff` before `npm run deploy`**  
⚠️ **Test in dev environment first**  
⚠️ **Keep deployment/*.env files updated**  
⚠️ **Review CloudFormation changesets carefully**  
⚠️ **Use stack protection for production**  

## Getting Help

1. Check `README.md` for detailed documentation
2. See `EXAMPLES.md` for code examples
3. Review `REFACTORING.md` for architecture details
4. Check AWS CDK documentation
5. Contact: khuongdv@vitalify.asia
