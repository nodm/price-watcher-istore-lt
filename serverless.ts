import type { AWS } from '@serverless/typescript';

import botWebhook from '@functions/bot-webhook';
// import priceWatcher from '@functions/price-watcher';

const serverlessConfiguration: AWS = {
  service: 'price-watcher-istore-lt',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
    'serverless-dotenv-plugin',
    'serverless-offline',
    'serverless-dynamodb-local',
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    stage: 'production',
    region: 'us-east-1',
    memorySize: 128,
    timeout: 15,
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [],
            Resource: '',
          },
          {
          Effect: 'Allow',
          Action: [
            'dynamodb:DescribeTable',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
          ],
          Resource: 'arn:aws:dynamodb:us-east-1:*:table/BotClients',
        }],
      },
    },
  },
  resources: {
    Resources: {
      BotClients: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'BotClients',
          AttributeDefinitions: [
            {
              AttributeName: 'clientId',
              AttributeType: 'N',
            },
          ],
          KeySchema: [{
            AttributeName: 'clientId',
            KeyType: 'HASH',
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          BillingMode: 'PEY_PER_REQUEST',
        },
      },
    },
  },
  functions: {
    botWebhook,
    // priceWatcher,
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    dynamodb:{
      start:{
        port: 5000,
        inMemory: true,
        migrate: true,
      },
      stages: "dev",
    },
  },
};

module.exports = serverlessConfiguration;
