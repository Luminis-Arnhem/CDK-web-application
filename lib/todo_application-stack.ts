import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as customResources from '@aws-cdk/custom-resources';

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

    const todoItemsTable = new dynamodb.Table(this, 'TodoApplicationTodoItemsTable', {
      partitionKey: {
        name: 'who',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'creationDate',
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const sharedCodeLayer = new lambda.LayerVersion(this, 'TodoApplicationSharedCode', {
      code: lambda.Code.fromAsset('application/functions/shared-code'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
    });

    const addItemLambda = new lambda.Function(this, 'TodoApplicationAddItemFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('application/functions/add-item', {exclude: ["node_modules", "*.json"]}),
      environment: {
        TODO_ITEMS_TABLE_NAME: todoItemsTable.tableName,
        ALLOWED_ORIGINS: '*'
      },
      layers: [
        sharedCodeLayer
      ]
    })
    todoItemsTable.grantReadWriteData(addItemLambda)

    const getItemsLambda = new lambda.Function(this, 'TodoApplicationGetItemsFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('application/functions/get-items', {exclude: ["node_modules", "*.json"]}),
      environment: {
        TODO_ITEMS_TABLE_NAME: todoItemsTable.tableName,
        ALLOWED_ORIGINS: '*'
      },
      layers: [
        sharedCodeLayer
      ]
    })
    todoItemsTable.grantReadData(getItemsLambda)

    const apiGateway = new apigateway.RestApi(this, 'TodoApplicationApiGateway', {
      restApiName: 'TodoApplicationApi'
    })

    const itemResource = apiGateway.root.addResource('item')
    itemResource.addCorsPreflight({
      allowOrigins: [ '*' ],
      allowMethods: [ 'GET', 'PUT' ]
    });
    itemResource.addMethod('PUT', new apigateway.LambdaIntegration(addItemLambda), {})
    itemResource.addMethod('GET', new apigateway.LambdaIntegration(getItemsLambda), {})

    const frontendConfig = {
      itemsApi: apiGateway.url,
      lastChanged: new Date().toUTCString()
    };

    const dataString = `window.AWSConfig = ${JSON.stringify(frontendConfig, null, 4)};`;

    const putUpdate = {
      service: 'S3',
      action: 'putObject',
      parameters: {
        Body: dataString,
        Bucket: `${frontendBucket.bucketName}`,
        Key: 'config.js',
      },
      physicalResourceId: customResources.PhysicalResourceId.of(`${frontendBucket.bucketName}`)
    };

    const s3Upload = new customResources.AwsCustomResource(this, 'TodoApplicationSetConfigJS', {
      policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({resources: customResources.AwsCustomResourcePolicy.ANY_RESOURCE}),
      onUpdate: putUpdate,
      onCreate: putUpdate,
    });
    s3Upload.node.addDependency(bucketDeployment);
    s3Upload.node.addDependency(apiGateway);
  }
}
