import path from 'path';

import {
  aws_cloudfront as cloudfront,
  aws_s3 as s3,
  aws_s3_deployment as s3Deployment,
  CfnOutput,
  Fn,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface UGCFrontendDeploymentStackProps extends StackProps {
  ugcStackId: string;
}

export class UGCFrontendDeploymentStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: UGCFrontendDeploymentStackProps
  ) {
    super(scope, id, props);

    const { ugcStackId } = props;
    const stackNamePrefix = Stack.of(this).stackName;
    // Retrieve the bucket from the UGC stack
    const importedBucketNameValue = Fn.importValue(
      `${ugcStackId}-FE-Bucket-Name`
    );
    const importedDistributionIdValue = Fn.importValue(
      `${ugcStackId}-FE-CFDistribution-ID`
    );
    const importedDistributionDomainNameValue = Fn.importValue(
      `${ugcStackId}-FE-CFDistribution-Domain-Name`
    );
    const frontendAppS3Bucket = s3.Bucket.fromBucketName(
      this,
      `${stackNamePrefix}-FE-Bucket`,
      importedBucketNameValue.toString()
    );
    // Retrieve the distribution from the UGC stack
    const distribution = cloudfront.Distribution.fromDistributionAttributes(
      this,
      `${stackNamePrefix}-FE-CFDistribution`,
      {
        distributionId: importedDistributionIdValue.toString(),
        domainName: importedDistributionDomainNameValue.toString()
      }
    );

    // Deployment
    new s3Deployment.BucketDeployment(this, `${stackNamePrefix}-Deployment`, {
      sources: [
        s3Deployment.Source.asset(path.join(__dirname, '../../web-ui/build'))
      ],
      destinationBucket: frontendAppS3Bucket,
      distribution
    });

    const importedFrontendAppBaseUrl = Fn.importValue(
      `${ugcStackId}-frontendAppBaseUrl`
    );

    // Export the FE URL again for convenience at the end of the make target
    new CfnOutput(this, 'frontendAppBaseUrl', {
      value: importedFrontendAppBaseUrl.toString()
    });
  }
}
