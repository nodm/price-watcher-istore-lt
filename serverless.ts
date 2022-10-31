import type { AWS } from '@serverless/typescript';

import telegramBotWebhook from '@functions/telegram-bot-webhook';
import iStoreLtPriceWatcher from '@functions/istore-lt-price-watcher';
import telegramMessageProcessor from '@functions/telegram-message-processor';
import telegramMessageSender from '@functions/telegram-message-sender';

const ONE_DAY = 24 * 60 * 60;

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
      TELEGRAM_INCOMING_MESSAGE_QUEUE_NAME: '${self:service}-${self:provider.stage}-telegram-incoming-message-queue',
      TELEGRAM_INCOMING_MESSAGE_DLQ_NAME: '${self:service}-${self:provider.stage}-telegram-incoming-message-dlq',
      TELEGRAM_OUTGOING_MESSAGE_QUEUE_NAME: '${self:service}-${self:provider.stage}-telegram-outgoing-message-queue',
      TELEGRAM_OUTGOING_MESSAGE_DLQ_NAME: '${self:service}-${self:provider.stage}-telegram-outgoing-message-dlq',
      PRODUCT_TABLE_NAME: 'productsTable',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: {
              'Fn::GetAtt': ['TelegramIncomingMessageQueue', 'Arn'],
            },
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: {
              'Fn::GetAtt': ['TelegramOutgoingMessageQueue', 'Arn'],
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
    telegramBotWebhook,
    iStoreLtPriceWatcher,
    telegramMessageProcessor,
    telegramMessageSender,
  },
  resources: {
    Resources: {
      TelegramIncomingMessageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.TELEGRAM_INCOMING_MESSAGE_QUEUE_NAME}',
          RedrivePolicy: {
            deadLetterTargetArn: {
              'Fn::GetAtt': ['TelegramIncomingMessageDLQ', 'Arn'],
            },
            maxReceiveCount: 5,
          },
        },
      },
      TelegramIncomingMessageDLQ: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.TELEGRAM_INCOMING_MESSAGE_DLQ_NAME}',
          MessageRetentionPeriod: ONE_DAY,
        },
      },
      TelegramOutgoingMessageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.TELEGRAM_OUTGOING_MESSAGE_QUEUE_NAME}',
          RedrivePolicy: {
            deadLetterTargetArn: {
              'Fn::GetAtt': ['TelegramOutgoingMessageDLQ', 'Arn'],
            },
            maxReceiveCount: 5,
          },
        },
      },
      TelegramOutgoingMessageDLQ: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.TELEGRAM_OUTGOING_MESSAGE_DLQ_NAME}',
          MessageRetentionPeriod: ONE_DAY,
        },
      },
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
