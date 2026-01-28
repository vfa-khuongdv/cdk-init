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

Expert guidance for AWS CDK development: creating stacks, writing constructs, testing, and deploying infrastructure as code with TypeScript.

## When to Use This Skill

- Creating or modifying CDK stacks and constructs
- Writing tests with Jest and CDK assertions
- Deploying AWS resources (VPC, Lambda, RDS, S3, ECS, etc.)
- Debugging synthesis or deployment issues
- Setting up multi-environment projects
- Code review and optimization

## Core Concepts

**Stack**: Unit of deployment (CloudFormation stack) containing constructs that define AWS resources.

**Constructs**: Building blocks of CDK apps
- **L1 (CfnXxx)**: Direct CloudFormation mappings
- **L2**: Higher-level abstractions with sensible defaults  
- **L3**: Opinionated patterns combining multiple resources

**Project Structure**:
```typescript
├── bin/           # App entry point
├── lib/           # Stacks and constructs
│   ├── stacks/    # Stack definitions
│   ├── constructs/# Reusable constructs
│   └── shared/    # Utilities
├── config/        # Environment configs
├── test/          # Jest tests
└── cdk.json       # CDK configuration
```

## Development Workflow

For detailed workflows and examples, see:
- [references/WORKFLOWS.md](references/WORKFLOWS.md) - Step-by-step workflows (TDD, debugging, etc.)
- [references/PATTERNS.md](references/PATTERNS.md) - Advanced patterns (multi-stack, aspects, etc.)
- [references/AWS_SERVICES.md](references/AWS_SERVICES.md) - Service-specific examples
- [references/COMMANDS.md](references/COMMANDS.md) - Complete CLI reference

Scripts:
- `scripts/validate-stack.sh` - Validate before deployment
- `scripts/diff-all-stacks.sh` - Show diffs for all stacks
- `scripts/bootstrap-account.py` - Bootstrap AWS accounts