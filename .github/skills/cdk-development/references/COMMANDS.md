# CDK Command Reference

Quick reference for common CDK CLI commands used in workflows.

## Project Setup

```bash
# Install CDK globally
npm install -g aws-cdk

# Initialize new CDK project
cdk init app --language typescript

# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (auto-compile on changes)
npm run watch
```

## Stack Operations

```bash
# List all stacks
cdk list
cdk ls

# Synthesize CloudFormation template
cdk synth

# Synthesize specific stack
cdk synth MyStack

# Show differences between deployed and local
cdk diff

# Diff specific stack
cdk diff MyStack

# Deploy stack
cdk deploy

# Deploy specific stack
cdk deploy MyStack

# Deploy all stacks
cdk deploy --all

# Deploy without confirmation prompts
cdk deploy --require-approval never

# Deploy with context variables
cdk deploy --context env=prod

# Destroy stack
cdk destroy

# Destroy specific stack
cdk destroy MyStack

# Destroy without confirmation
cdk destroy --force
```

## Bootstrap

```bash
# Bootstrap default account/region
cdk bootstrap

# Bootstrap specific account/region
cdk bootstrap aws://123456789012/us-east-1

# Bootstrap with custom CloudFormation execution policies
cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess

# Bootstrap multiple accounts
cdk bootstrap aws://111111111111/us-east-1 aws://222222222222/us-west-2
```

## Context and Configuration

```bash
# Pass context values
cdk deploy --context env=production
cdk deploy --context key=value

# Show context values
cdk context

# Clear context cache
cdk context --clear

# Reset specific context value
cdk context --reset vpc-provider:account=123456789012:filter.vpc-id=vpc-12345
```

## Metadata and Information

```bash
# Show CDK version
cdk --version

# Show detailed synthesis information
cdk synth --verbose

# Show only CloudFormation template (no assets)
cdk synth --no-staging

# Output template to file
cdk synth > template.json

# Show CDK Toolkit stack status
aws cloudformation describe-stacks --stack-name CDKToolkit
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- my-stack.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="VPC"

# Update snapshots
npm test -- --updateSnapshot

# Run tests in parallel
npm test -- --maxWorkers=4

# Verbose test output
npm test -- --verbose
```

## Asset Management

```bash
# Deploy with asset rebuild
cdk deploy --force

# Deploy without building assets
cdk deploy --no-asset-build

# List assets
cdk synth > /dev/null && ls -R cdk.out/

# Check asset integrity
cdk synth --verbose
```

## Security and Permissions

```bash
# Validate IAM policies
cdk synth && cfn-lint cdk.out/*.template.json

# Check for security issues (requires cfn_nag)
cdk synth
cfn_nag_scan --input-path cdk.out/

# List IAM policy changes
cdk diff | grep -A 10 "IAM"
```

## Multi-Environment Workflows

```bash
# Deploy to dev
cdk deploy --context env=dev --profile dev-profile

# Deploy to staging
cdk deploy --context env=staging --profile staging-profile

# Deploy to production (with confirmation)
cdk deploy --context env=prod --profile prod-profile

# Show prod diff without deploying
cdk diff --context env=prod --profile prod-profile
```

## Debugging

```bash
# Verbose output
cdk deploy --verbose

# Very verbose (debug) output
cdk deploy --verbose --verbose

# Show CDK trace
cdk synth --trace

# Show app output
cdk synth --app='npx ts-node bin/app.ts'

# Validate CloudFormation template
aws cloudformation validate-template --template-body file://cdk.out/MyStack.template.json
```

## Troubleshooting

```bash
# Clear CDK cache
rm -rf cdk.out
rm -rf node_modules
npm install
npm run build

# Reset context
cdk context --clear

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name MyStack

# Get CloudFormation stack events
aws cloudformation describe-stack-events --stack-name MyStack

# Get stack failure reason
aws cloudformation describe-stack-events --stack-name MyStack \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Cancel stack update
aws cloudformation cancel-update-stack --stack-name MyStack

# Continue rollback
aws cloudformation continue-update-rollback --stack-name MyStack
```

## CI/CD Pipeline Commands

```bash
# CI/CD: Install and build
npm ci
npm run build

# CI/CD: Run tests with JUnit output
npm test -- --ci --coverage --reporters=default --reporters=jest-junit

# CI/CD: Synthesize for validation
cdk synth --no-lookups

# CI/CD: Deploy with role assumption
cdk deploy --role-arn arn:aws:iam::123456789012:role/DeployRole

# CI/CD: Deploy with progress output
cdk deploy --progress events
```

## Stack Parameters

```bash
# Pass parameters during deploy
cdk deploy --parameters MyStack:Param1=Value1

# Multiple parameters
cdk deploy --parameters MyStack:Param1=Value1 --parameters MyStack:Param2=Value2
```

## Outputs

```bash
# Get stack outputs
aws cloudformation describe-stacks --stack-name MyStack \
  --query 'Stacks[0].Outputs'

# Get specific output value
aws cloudformation describe-stacks --stack-name MyStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text

# Export all outputs
cdk synth && jq -r '.Outputs' cdk.out/MyStack.template.json
```

## Common Patterns

```bash
# Build, test, and deploy
npm run build && npm test && cdk deploy

# Clean build and deploy
rm -rf cdk.out node_modules && npm install && npm run build && cdk deploy

# Quick iteration workflow
npm run watch &  # In one terminal
npm test -- --watch &  # In another terminal

# Validate before deploy
npm run build && npm test && cdk synth && cdk diff && cdk deploy

# Safe production deployment
npm run build && \
npm test && \
cdk diff --context env=prod && \
read -p "Deploy to production? (y/n) " -n 1 -r && \
[[ $REPLY =~ ^[Yy]$ ]] && cdk deploy --context env=prod
```

## Useful Aliases

Add these to your shell profile (`.bashrc`, `.zshrc`):

```bash
alias cdks='cdk synth'
alias cdkd='cdk deploy'
alias cdkdi='cdk diff'
alias cdkl='cdk list'
alias cdkdes='cdk destroy'
alias cdkbuild='npm run build && cdk synth'
alias cdktest='npm run build && npm test'
alias cdkdeploy='npm run build && npm test && cdk deploy'
```

## Environment Variables

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_DEFAULT_REGION=us-east-1

# Use AWS profile
export AWS_PROFILE=my-profile

# Set CDK default account
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1

# Enable verbose CDK output
export CDK_DEBUG=true

# Set custom app command
export CDK_APP="npx ts-node --prefer-ts-exts bin/app.ts"
```
