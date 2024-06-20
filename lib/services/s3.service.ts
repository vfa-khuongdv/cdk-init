/**
 * s3.service.ts
 * cdk-init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-01-16
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import { Construct } from 'constructs';
import { aws_s3, RemovalPolicy } from 'aws-cdk-lib';
import { PREFIX } from '../../config/environment';

export class S3Service {
  private readonly scope: Construct;
  public bucket: aws_s3.Bucket;
  constructor(scope: Construct) {
    this.scope = scope;
    this.init();
  }

  /**
   * Init the s3 bucket
   */
  private init() {
    this.bucket = new aws_s3.Bucket(this.scope, 'S3Bucket', {
      bucketName: `${PREFIX}-demo-bucket`,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}