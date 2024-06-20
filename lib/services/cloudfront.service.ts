/**
 * cloudfront.service.ts
 * cdk-init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-06-19
 * Copyright (c) 2023 VFA Asia Co.,Ltd. All rights reserved.
 */
import { Construct } from 'constructs';
import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_iam,
  aws_s3,
  CfnOutput,
  Duration,
} from 'aws-cdk-lib';
import { PREFIX } from '../../config/environment';
import * as path from 'path';
import { getEnv } from '../shared/helper';

export class CloudfrontService {
  private readonly scope: Construct;
  private readonly bucket: aws_s3.Bucket;

  constructor(scope: Construct, bucket: aws_s3.Bucket) {
    this.scope = scope;
    this.bucket = bucket;
    this.init();
  }

  /**
   * Init cloudfront via OAI
   */
  private init() {
    const cfnOriginAccessControl = new aws_cloudfront.CfnOriginAccessControl(
      this.scope,
      'OriginAccessIdentity',
      {
        originAccessControlConfig: {
          name: 'OriginAccessControl',
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
          description: 'Access Control',
        },
      },
    );

    // Cloudfront functions
    const cfFunction = new aws_cloudfront.Function(
      this.scope,
      'CfAuthorizedFunction',
      {
        functionName: `${PREFIX}-authorized`,
        code: aws_cloudfront.FunctionCode.fromFile({
          filePath: path.join(
            __dirname,
            '..',
            'cloudfront-functions/authorized/index.js',
          ),
        }),
      },
    );

    const distribution = new aws_cloudfront.Distribution(
      this.scope,
      'CloudfrontDistribution',
      {
        comment: `${PREFIX}-distribution`,
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            ttl: Duration.seconds(300),
            httpStatus: 403,
            responseHttpStatus: 403,
            responsePagePath: '/error.html',
          },
        ],
        defaultBehavior: {
          allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          origin: new aws_cloudfront_origins.S3Origin(this.bucket),
          functionAssociations: [
            {
              function: cfFunction,
              eventType: aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_200,
        httpVersion: aws_cloudfront.HttpVersion.HTTP2_AND_3,
      },
    );

    const cfnDistribution = distribution.node
      .defaultChild as aws_cloudfront.CfnDistribution;
    // OAI
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity',
      '',
    );
    // OAC
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.Origins.0.OriginAccessControlId',
      cfnOriginAccessControl.attrId,
    );

    // S3 - BucketPolicy
    const contentsBucketPolicyStatement = new aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: aws_iam.Effect.ALLOW,
      principals: [new aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
      resources: [`${this.bucket.bucketArn}/*`],
    });

    contentsBucketPolicyStatement.addCondition('StringEquals', {
      'AWS:SourceArn': `arn:aws:cloudfront::${getEnv('CDK_ACCOUNT_ID')}:distribution/${distribution.distributionId}`,
    });
    this.bucket.addToResourcePolicy(contentsBucketPolicyStatement);

    new CfnOutput(this.scope, 'DistributionId', {
      value: distribution.distributionId,
    });
    new CfnOutput(this.scope, 'DomainName', {
      value: distribution.distributionDomainName,
    });
  }
}