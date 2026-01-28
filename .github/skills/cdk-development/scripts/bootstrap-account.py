#!/usr/bin/env python3

"""
Bootstrap AWS accounts for CDK deployment
This script helps bootstrap multiple AWS accounts and regions for CDK
"""

import subprocess
import sys
import json

def run_command(command):
    """Run shell command and return output"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            capture_output=True, 
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        sys.exit(1)

def get_caller_identity():
    """Get AWS account information"""
    output = run_command("aws sts get-caller-identity")
    return json.loads(output)

def bootstrap_account(account_id, region, profile=None):
    """Bootstrap a specific account and region"""
    print(f"\n🚀 Bootstrapping account {account_id} in region {region}...")
    
    command = f"cdk bootstrap aws://{account_id}/{region}"
    if profile:
        command += f" --profile {profile}"
    
    try:
        output = run_command(command)
        print(f"✅ Successfully bootstrapped {account_id}/{region}")
        return True
    except:
        print(f"❌ Failed to bootstrap {account_id}/{region}")
        return False

def main():
    """Main function"""
    print("═══════════════════════════════════════")
    print("   CDK Account Bootstrap Tool")
    print("═══════════════════════════════════════\n")
    
    # Get current account
    identity = get_caller_identity()
    current_account = identity['Account']
    print(f"Current AWS Account: {current_account}")
    print(f"Current User/Role: {identity['Arn']}\n")
    
    # Define accounts and regions to bootstrap
    # Modify this list based on your needs
    environments = [
        {"account": current_account, "region": "us-east-1", "profile": None},
        {"account": current_account, "region": "us-west-2", "profile": None},
    ]
    
    print("Environments to bootstrap:")
    for idx, env in enumerate(environments, 1):
        profile_info = f" (profile: {env['profile']})" if env['profile'] else ""
        print(f"  {idx}. {env['account']}/{env['region']}{profile_info}")
    
    print("\nStarting bootstrap process...\n")
    
    # Bootstrap each environment
    results = []
    for env in environments:
        success = bootstrap_account(
            env['account'], 
            env['region'], 
            env.get('profile')
        )
        results.append(success)
    
    # Summary
    print("\n═══════════════════════════════════════")
    print("   Bootstrap Summary")
    print("═══════════════════════════════════════")
    successful = sum(results)
    total = len(results)
    print(f"Successful: {successful}/{total}")
    
    if successful == total:
        print("\n✅ All accounts bootstrapped successfully!")
        sys.exit(0)
    else:
        print("\n⚠️  Some accounts failed to bootstrap")
        sys.exit(1)

if __name__ == "__main__":
    main()
