# CDK Infrastructure Template

A production-ready AWS CDK template for building scalable infrastructure. This template provides a solid foundation for multi-environment deployments with best practices built-in.

## ✨ Features

- 🔒 **Type-Safe Configuration** - Environment variables validated with Zod
- 🏗️ **Modular Architecture** - Reusable constructs with clear separation of concerns
- 🏷️ **Smart Tagging** - Automatic resource tagging for cost tracking and management
- 🌍 **Multi-Environment** - Support for dev, staging, and production environments
- 📦 **VPC Management** - Flexible VPC configuration with customizable subnets
- 🧪 **Testing Ready** - Jest configuration for unit and integration tests
- 📝 **TypeScript** - Full type safety and IntelliSense support

## 📋 Prerequisites

- Node.js >= 18.x
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- An AWS account with proper permissions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file from the template:

```bash
cp .env.template .env
```

Edit `.env` with your AWS account details:

```env
STAGE=dev
PROJECT=myproject
CDK_REGION=ap-northeast-1
CDK_ACCOUNT_ID=123456789012
CIDR_BLOCK=10.128.0.0/16

# Optional VPC settings
VPC_MAX_AZS=2
VPC_NAT_GATEWAYS=0
```

### 3. Bootstrap AWS Environment

First-time setup for your AWS account (only needed once per account/region):

```bash
npm run bootstrap
```

### 4. Deploy Infrastructure

```bash
npm run deploy
```

## 📁 Project Structure

```
cdk-init/
├── bin/
│   └── cdk-init.ts              # Application entry point
├── lib/
│   ├── cdk-init-stack.ts        # Main stack definition
│   ├── constructs/              # Reusable infrastructure constructs
│   │   └── vpc.construct.ts     # VPC construct
│   ├── shared/                  # Shared utilities
│   │   ├── base.construct.ts    # Base class for all constructs
│   │   └── helper.ts            # Helper functions
│   └── types/                   # TypeScript interfaces
│       └── index.ts             # Type definitions
├── config/
│   └── environment.config.ts    # Environment configuration with validation
├── deployment/
│   ├── .env.dev                 # Development environment variables
│   ├── .env.stg                 # Staging environment variables
│   └── .env.prod                # Production environment variables
├── test/
│   └── *.test.ts                # Test files
├── .env.template                # Environment variable template
└── package.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STAGE` | ✅ | Deployment stage | `dev`, `stg`, `prod` |
| `PROJECT` | ✅ | Project name | `myproject` |
| `CDK_REGION` | ✅ | AWS region | `ap-northeast-1` |
| `CDK_ACCOUNT_ID` | ✅ | AWS account ID | `123456789012` |
| `CIDR_BLOCK` | ✅ | VPC CIDR block | `10.128.0.0/16` |
| `VPC_MAX_AZS` | ❌ | Max availability zones | `2` (default) |
| `VPC_NAT_GATEWAYS` | ❌ | Number of NAT gateways | `0` (default) |

### Multi-Environment Deployment

Deploy to different environments using environment-specific files:

```bash
# Development
cp deployment/.env.dev .env
npm run deploy

# Staging
cp deployment/.env.stg .env
npm run deploy

# Production
cp deployment/.env.prod .env
npm run deploy
```

## 🏗️ Adding New Infrastructure

### Creating a New Construct

1. Create a new file in `lib/constructs/`:

```typescript
// lib/constructs/database.construct.ts
import { Construct } from 'constructs';
import { BaseConstruct } from '../shared/base.construct';
import { IEnvironmentConfig } from '../types';

export class DatabaseConstruct extends BaseConstruct {
  constructor(scope: Construct, id: string, env: IEnvironmentConfig) {
    super(scope, id, env);
    
    // Your infrastructure code here
  }
}
```

2. Use it in your stack:

```typescript
// lib/cdk-init-stack.ts
import { DatabaseConstruct } from './constructs/database.construct';

// Inside the stack constructor:
const database = new DatabaseConstruct(this, 'Database', props.env);
```

### Adding Configuration Options

1. Add type definition in `lib/types/index.ts`:

```typescript
export interface IDatabaseConfig {
  instanceType: string;
  allocatedStorage: number;
}
```

2. Add schema validation in `config/environment.config.ts`:

```typescript
const databaseConfigSchema = z.object({
  instanceType: z.string().default('db.t3.micro'),
  allocatedStorage: z.number().default(20),
});
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch for changes and compile |
| `npm test` | Run Jest tests |
| `npm run bootstrap` | Bootstrap CDK in your AWS account |
| `npm run deploy` | Deploy stack to AWS |
| `npm run destroy` | Remove all deployed resources |
| `npm run diff` | Show differences between deployed and local |
| `npm run synth` | Generate CloudFormation template |
| `npm run list` | List all stacks |

## 🧪 Testing

Run tests with Jest:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

For detailed testing documentation, see [TESTING.md](TESTING.md).

**Current Test Coverage:**
- ✅ 52 tests passing
- ✅ 4 test suites
- ✅ Environment configuration validation
- ✅ Base construct functionality
- ✅ VPC construct creation and configuration
- ✅ Stack integration and CloudFormation templates

## 🏷️ Resource Tagging

All resources are automatically tagged with:

- `Environment` - The deployment stage (dev/stg/prod)
- `Project` - Project name from configuration
- `ManagedBy` - Set to "AWS-CDK"
- `ProjectID` - Combination of project and stage
- `Repository` - Set to "cdk-init"

## 🔍 Best Practices

1. **Use Environment Variables** - Never hardcode sensitive information
2. **Follow Naming Conventions** - All resources are prefixed with `{project}-{stage}`
3. **Apply Tags Consistently** - Use the `BaseConstruct` class for common functionality
4. **Validate Configuration** - Add Zod schemas for all new configurations
5. **Write Tests** - Test your constructs before deploying
6. **Use Type Safety** - Define interfaces for all configuration objects

## 🚨 Troubleshooting

### Configuration Validation Errors

If you see validation errors on startup:

```
❌ Environment configuration validation failed:
  - CDK_ACCOUNT_ID: CDK_ACCOUNT_ID must be a 12-digit AWS account ID
```

Check your `.env` file and ensure all required variables are set correctly.

### CDK Bootstrap Issues

If deployment fails with "unable to resolve asset":

```bash
npm run bootstrap
```

### Permission Errors

Ensure your AWS credentials have the necessary permissions:
- CloudFormation full access
- EC2 full access (for VPC)
- IAM permissions for role creation

## 📚 Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
- [AWS CDK Examples](https://github.com/aws-samples/aws-cdk-examples)
- [CDK Patterns](https://cdkpatterns.com/)

## 🤝 Contributing

When extending this template:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Update documentation
4. Write tests for new features
5. Validate configuration with Zod schemas

## 📄 License

MIT License - Copyright (c) 2024 VFA Asia Co.,Ltd.

## 👥 Support

For questions or issues:
- Open an issue in the repository
- Contact: khuongdv@vitalify.asia
