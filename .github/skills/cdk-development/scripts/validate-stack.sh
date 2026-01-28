#!/bin/bash

# Validate CDK Stack Configuration
# This script validates the CDK stack before deployment

set -e

echo "🔍 Validating CDK Stack..."

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK CLI is not installed. Install it with: npm install -g aws-cdk"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured. Run: aws configure"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Synthesize the stack
echo "🔨 Synthesizing stack..."
cdk synth

# Validate CloudFormation template
echo "✅ Validating CloudFormation template..."
TEMPLATE_FILE=$(find cdk.out -name "*.template.json" | head -n 1)
if [ -f "$TEMPLATE_FILE" ]; then
    aws cloudformation validate-template --template-body file://"$TEMPLATE_FILE" > /dev/null
    echo "✅ CloudFormation template is valid"
else
    echo "❌ No CloudFormation template found"
    exit 1
fi

echo "✅ All validations passed!"
