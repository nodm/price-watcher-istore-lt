import type { AWS } from '@serverless/typescript';

import telegramBotWebhook from '@functions/telegram-bot-webhook';
import iStoreLtPriceWatcher from '@functions/istore-lt-price-watcher';
import telegramMessageProcessor from '@functions/telegram-message-processor';
import telegramMessageSender from '@functions/telegram-message-sender';

const ONE_DAY = 24 * 60 * 60;

const serverlessConfiguration: AWS = {
  service: 'snitch',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
    'serverless-dotenv-plugin',
    'serverless-ssm-publish',
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
      TELEGRAM_BOT_TOKEN_SSM: '/${self:service}/${self:provider.stage}/telegram-bot-token',
      TELEGRAM_DEFAULT_CHAT_ID_SSM: '/${self:service}/${self:provider.stage}/telegram-default-chat-id',
      ISTORE_LT_PAGES_SSM: '/${self:service}/${self:provider.stage}/i-store-lt-pages',
      TELEGRAM_INCOMING_MESSAGE_QUEUE_URL: 'https://sqs.${self:provider.region}.amazonaws.com/${aws:accountId}/${self:resources.Resources.TelegramIncomingMessageQueue.Properties.QueueName}',
      TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL: 'https://sqs.${self:provider.region}.amazonaws.com/${aws:accountId}/${self:resources.Resources.TelegramOutgoingMessageQueue.Properties.QueueName}',
      PRODUCT_TABLE_NAME: '${self:resources.Resources.productsTable.Properties.TableName}',
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
              'dynamodb:GetItem',
              'dynamodb:PutItem',
            ],
            Resource: {
              'Fn::GetAtt': ['productsTable', 'Arn'],
            },
          },
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter'],
            Resource: ['arn:aws:ssm:*:${aws:accountId}:parameter/*'],
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
          QueueName: '${self:service}-${self:provider.stage}-telegram-incoming-message-queue',
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
          QueueName: '${self:service}-${self:provider.stage}-telegram-incoming-message-dlq',
          MessageRetentionPeriod: ONE_DAY,
        },
      },
      TelegramOutgoingMessageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-${self:provider.stage}-telegram-outgoing-message-queue',
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
          QueueName: '${self:service}-${self:provider.stage}-telegram-outgoing-message-dlq',
          MessageRetentionPeriod: ONE_DAY,
        },
      },
      productsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'productsTable',
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
      philatelyLithuaniaTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'philatelyLithuaniaTable',
          AttributeDefinitions: [{
            AttributeName: 'href',
            AttributeType: 'S',
          }],
          KeySchema: [{
            AttributeName: 'href',
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
    dotenv: {
      required: {
        env: [
          'TELEGRAM_BOT_TOKEN',
          'TELEGRAM_DEFAULT_CHAT_ID',
        ],
      },
      include: [
        'AWS_NODEJS_CONNECTION_REUSE_ENABLED',
        'NODE_OPTIONS',
        'TELEGRAM_BOT_TOKEN_SSM',
        'TELEGRAM_DEFAULT_CHAT_ID_SSM',
        'ISTORE_LT_PAGES_SSM',
        'TELEGRAM_INCOMING_MESSAGE_QUEUE_URL',
        'TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL',
        'PRODUCT_TABLE_NAME',
      ],
    },
    ssmPublish: {
      enabled: true,
      params: [
        {
          path: '${self:provider.environment.TELEGRAM_BOT_TOKEN_SSM}',
          type: 'SecureString',
          value: '${env:TELEGRAM_BOT_TOKEN}',
          secure: true,
        },
        {
          path: '${self:provider.environment.TELEGRAM_DEFAULT_CHAT_ID_SSM}',
          type: 'SecureString',
          value: '${env:TELEGRAM_DEFAULT_CHAT_ID}',
          secure: true,
        },
        {
          path: '${self:provider.environment.ISTORE_LT_PAGES_SSM}',
          type: 'StringList',
          value: [
            '/apple-mac-kompiuteriai/macbook-pro/shopby/14/32_gb/?limit=all',
            '/apple-ipad-plansetes/ipad-air-2022/shopby/64gb/tik_wi_fi/',
            '/apple-watch/apple-watch-series-8/shopby/45mm/gps_cellular_esim/aliuminio_lydinio/',
          ].join(),
          description: '${self:service}: Paths to the pages of iStore.lt to be crawled',
        },
      ],
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
