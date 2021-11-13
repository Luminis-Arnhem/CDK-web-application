import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as customResources from '@aws-cdk/custom-resources';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as route53Targets from '@aws-cdk/aws-route53-targets';
import * as cognito from '@aws-cdk/aws-cognito';
import { ApiGateway } from '@aws-cdk/aws-route53-targets';

export class TodoApplicationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, 'TodoApplicationHostedZone', {
      domainName: 'tomhanekamp.com'
    });

    const frontendCertificate = new acm.DnsValidatedCertificate(this, 'TodoApplicationFrontendCertificate', {
      domainName: 'todoapplication.tomhanekamp.com',
      hostedZone: hostedZone,
      region: 'us-east-1'
    });

    const apiCertificate = new acm.DnsValidatedCertificate(this, 'TodoApplicationApiCertificate', {
      domainName: 'todoapplication-api.tomhanekamp.com',
      hostedZone: hostedZone
    });

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

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: frontendBucket
          },
          behaviors : [ { isDefaultBehavior: true } ],
        }
      ],
      viewerCertificate: {
        aliases: [ 'todoapplication.tomhanekamp.com' ],
        props: {
          acmCertificateArn: frontendCertificate.certificateArn,
          sslSupportMethod: "sni-only",
          minimumProtocolVersion: "TLSv1.2_2021"
        }
      }
    });

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

    const userPool = new cognito.UserPool(this, "TodoApplicationUserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const userPoolClient = userPool.addClient("TodoApplicationUserPoolClient", {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [ cognito.OAuthScope.OPENID ],
        callbackUrls: [ `https://todoapplication.tomhanekamp.com/` ],
        logoutUrls: [ `https://todoapplication.tomhanekamp.com/` ]
      }
    });

    userPool.addDomain("TodoApplicationCognitoDomain", {
      cognitoDomain: {
        domainPrefix: "todo-application",
      },
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
      restApiName: 'TodoApplicationApi',
      domainName: {
        domainName: 'todoapplication-api.tomhanekamp.com',
        certificate: apiCertificate,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2
      }
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

    const websiteARecord = new route53.ARecord( this, "TodoApplicationWebsiteRecord", {
      recordName:  'todoapplication.tomhanekamp.com',
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution))
    });

    const apiARecord = new route53.ARecord( this, "TodoApplicationAPIRecord", {
      recordName:  'todoapplication-api.tomhanekamp.com',
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(apiGateway))
    });
  }
}
