/**
 * cdk-init-stack.ts
 * cdk-init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-06-19
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcService } from './services/vpc.service';
import { ENV } from '../config/environment';
import { S3Service } from './services/s3.service';
import { CloudfrontService } from './services/cloudfront.service';

export class CdkInitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create vpc
    let vpc = new VpcService(this);
    // create s3
    let s3 = new S3Service(this);
    // create cloudfront
    let cloudfront = new CloudfrontService(this, s3.bucket)
    // Apply tags for all resource
    cdk.Tags.of(this).add('ProjectID', ENV.prefix)
  }
}