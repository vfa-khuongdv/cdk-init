#!/bin/bash

# Show differences for all CDK stacks
# This script runs cdk diff for all stacks in the project

set -e

echo "📊 Getting differences for all stacks..."

# Build the project
echo "📦 Building project..."
npm run build

# Get list of all stacks
STACKS=$(cdk list)

if [ -z "$STACKS" ]; then
    echo "❌ No stacks found"
    exit 1
fi

# Run diff for each stack
echo "Stacks found:"
echo "$STACKS"
echo ""

for stack in $STACKS; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Differences for: $stack"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cdk diff "$stack" || echo "⚠️  Stack $stack not deployed yet or no changes"
    echo ""
done

echo "✅ Diff complete for all stacks"
