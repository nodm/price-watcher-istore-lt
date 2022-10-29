import type { AWS } from '@serverless/typescript';

import botWebhook from '@functions/bot-webhook';
import priceWatcher from '@functions/price-watcher';
import telegramMessageProcessor from '@functions/telegram-message-processor';
import telegramMessageSender from '@functions/telegram-message-sender';

// const ONE_HOUR = 60 * 60;

const serverlessConfiguration: AWS = {
  service: 'price-watcher-istore-lt',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
    'serverless-dotenv-plugin',
    'serverless-dynamodb-local',
    'serverless-offline',
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
      INCOMING_MESSAGE_QUEUE_NAME: '${self:service}-${self:provider.stage}-incoming-message-queue',
      // INCOMING_MESSAGE_DEAD_LETTER_QUEUE_NAME: '${self:service}-${self:provider.stage}-incoming-message-dead-letter-queue',
      OUTGOING_MESSAGE_QUEUE_NAME: '${self:service}-${self:provider.stage}-outgoing-message-queue',
      // OUTGOING_MESSAGE_DEAD_LETTER_QUEUE_NAME: '${self:service}-${self:provider.stage}-outgoing-message-dead-letter-queue',
      PRODUCT_TABLE_NAME: 'productsTable',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: {
              'Fn::GetAtt': ['IncomingMessageQueue', 'Arn'],
            },
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: {
              'Fn::GetAtt': ['OutgoingMessageQueue', 'Arn'],
            },
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:DescribeTable',
              // 'dynamodb:Query',
              // 'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              // 'dynamodb:DeleteItem',
            ],
            Resource: {
              'Fn::GetAtt': ['productsTable', 'Arn']
            },
          },
        ],
      },
    },
  },
  functions: {
    botWebhook,
    priceWatcher,
    telegramMessageProcessor,
    telegramMessageSender,
  },
  resources: {
    Resources: {
      IncomingMessageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.INCOMING_MESSAGE_QUEUE_NAME}',
          // FifoQueue: false,
          // VisibilityTimeout: 60,
          // RedrivePolicy: {
          //   deadLetterTargetArn: {
          //     'Fn::GetAtt': ['MessageDeadLetterQueue', 'Arn'],
          //   },
          //   maxReceiveCount: 5,
          // },
        },
      },
      // IncomingMessageDeadLetterQueue: {
      //   Type: 'AWS::SQS::Queue',
      //   Properties: {
      //     QueueName: '${self:provider.environment.INCOMING_MESSAGE_DEAD_LETTER_QUEUE_NAME}',
      //     MessageRetentionPeriod: ONE_HOUR,
      //   },
      // },
      OutgoingMessageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.OUTGOING_MESSAGE_QUEUE_NAME}',
          // FifoQueue: false,
          // VisibilityTimeout: 60,
          // RedrivePolicy: {
          //   deadLetterTargetArn: {
          //     'Fn::GetAtt': ['OutgoingMessageDeadLetterQueue', 'Arn'],
          //   },
          //   maxReceiveCount: 5,
          // },
        },
      },
      // OutgoingMessageDeadLetterQueue: {
      //   Type: 'AWS::SQS::Queue',
      //   Properties: {
      //     QueueName: '${self:provider.environment.OUTGOING_MESSAGE_DEAD_LETTER_QUEUE_NAME}',
      //     MessageRetentionPeriod: ONE_HOUR,
      //   },
      // },
      productsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.PRODUCT_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'url',
            AttributeType: 'S',
          }],
          KeySchema: [{
            AttributeName: 'url',
            KeyType: 'HASH',
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },
    },
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
    dynamodb: {
      stages: 'dev',
      start: {
        port: 8000,
        inMemory: true,
        heapInitial: '200m',
        heapMax: '1g',
        migrate: true,
        seed: true,
        convertEmptyValues: true,
      },
    },
  },
};

module.exports = serverlessConfiguration;
