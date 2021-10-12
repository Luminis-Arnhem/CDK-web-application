import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';

export class TodoApplicationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const frontendBucket = new s3.Bucket(this, 'TodoApplicationFrontend', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const bucketDeployment = new s3deploy.BucketDeployment(this, 'DeployTodoApplicationFrontend', {
      sources: [s3deploy.Source.asset(`application/frontend/dist/todo-application`)],
      destinationBucket: frontendBucket
    });
    bucketDeployment.node.addDependency(frontendBucket);
  }
}
