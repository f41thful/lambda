import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';
import getGroups from '@functions/get-groups';
import createGroup from '@functions/create-groups';
import getImages from '@functions/get-images';
import getImage from '@functions/get-image';
import createImage from '@functions/create-image';
import s3SendNotifications from '@functions/s3-send-notifications';

const serverlessConfiguration: AWS = {
  service: 'serverless-test',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    stage: '${opt:stage, "dev"}',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      GROUPS_TABLE: 'test-${self:provider.stage}',
      IMAGES_TABLE: 'images-${self:provider.stage}',
      INDEX_NAME: 'images-index-${self:provider.stage}',
      IMAGES_S3_BUCKET: 'serverless-udagram-images-325535-${self:provider.stage}',
      SIGNED_URL_EXPIRATION: '300'
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:GetItem"],
        Resource: "arn:aws:dynamodb:us-east-1:*:table/${self:provider.environment.GROUPS_TABLE}"
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query", "dynamodb:PutItem"],
        Resource: "arn:aws:dynamodb:us-east-1:*:table/${self:provider.environment.IMAGES_TABLE}"
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query"],
        Resource: "arn:aws:dynamodb:us-east-1:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.INDEX_NAME}"
      },
      {
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:GetObject"],
        Resource: "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*"
      }

    ]
  },
  // import the function via paths
  functions: { hello, getGroups, createGroup, getImages, getImage, createImage, s3SendNotifications },
  resources: {
    Resources: {
      GroupsDynamoDbTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S"
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          KeySchema: [ 
            { 
              AttributeName: "id",
              KeyType: "HASH"
            }
          ],
          TableName: "${self:provider.environment.GROUPS_TABLE}"
        }
      },
      ImagesDynamoDbTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "groupId",
              AttributeType: "S"
            },
            {
              AttributeName: "timestamp",
              AttributeType: "S"
            },
            {
              AttributeName: "id",
              AttributeType: "S"
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          KeySchema: [ 
            { 
              AttributeName: "groupId",
              KeyType: "HASH"
            },
            { 
              AttributeName: "timestamp",
              KeyType: "RANGE"
            }
          ],
          TableName: "${self:provider.environment.IMAGES_TABLE}",
          GlobalSecondaryIndexes: [{
            IndexName: '${self:provider.environment.INDEX_NAME}', 
            KeySchema: [{
              AttributeName: "id",
              KeyType: "HASH" 
            }],
            Projection: {
              ProjectionType: "ALL"
            }
            
          }]
        }
      },
      AttachmentsBucket: { 
        Type: 'AWS::S3::Bucket',
        Properties: { 
          BucketName: "${self:provider.environment.IMAGES_S3_BUCKET}",
          NotificationConfiguration: {
            LambdaConfigurations: [
              {
                Event: "s3:ObjectCreated:*",
                Function: {
                  GetAtt: "s3SendNotificationsLambdaFunction.Arn"
                }
              }
            ]
          },
          CorsConfiguration: { 
            CorsRules: [ { 
              AllowedOrigins: [ '*' ],
              AllowedHeaders: [ '*' ],
              AllowedMethods: [ 'GET', 'PUT', 'POST', 'DELETE', 'HEAD' ],
              MaxAge: 3000 } 
            ] 
          } 
        } 
      },   
      SampleBucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          Bucket: {
            Ref: "AttachmentsBucket"
          },
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Action: "s3:GetObject",
                Effect: "Allow",
                Principal: "*",
                Resource: "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*"
              }
            ]
          }
        }
      },
      SendUploadNotificationsPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: {
            Ref: "s3SendNotificationsLambdaFunction"
          },
          Principal: "s3.amazonaws.com",
          Action: "lambda:InvokeFunction",
          SourceAccount: {
            Ref: "AWS::AccountId"
          },
          SourceArn: "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}"
        }
      }
    }
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
