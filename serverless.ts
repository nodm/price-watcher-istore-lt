import type { AWS } from '@serverless/typescript';

import telegramBotWebhook from '@functions/telegram-bot-webhook';
import iStoreLtPriceWatcher from '@functions/istore-lt-price-watcher';
import postLtPhilatelyWatcher from '@functions/post-lt-philately-watcher';
import slackMessageSender from '@functions/slack-message-sender';
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
      SLACK_IWATCHER_TOKEN_SSM: '/${self:service}/${self:provider.stage}/slack-iwatcher-token',
      SLACK_PHILATELY_LITHUANIA_TOKEN_SSM: '/${self:service}/${self:provider.stage}/slack-philately-lithuania-token',
      SLACK_CHANNEL_I_STORE_LT_UPDATES_SSM: '/${self:service}/${self:provider.stage}/slack-channel-i-store-lt',
      SLACK_CHANNEL_POST_LT_UPDATES_SSM: '/${self:service}/${self:provider.stage}/slack-channel-post-lt',
      ISTORE_LT_PAGES_SSM: '/${self:service}/${self:provider.stage}/i-store-lt-pages',
      TELEGRAM_INCOMING_MESSAGE_QUEUE_URL: 'https://sqs.${self:provider.region}.amazonaws.com/${aws:accountId}/${self:resources.Resources.TelegramIncomingMessageQueue.Properties.QueueName}',
      TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL: 'https://sqs.${self:provider.region}.amazonaws.com/${aws:accountId}/${self:resources.Resources.TelegramOutgoingMessageQueue.Properties.QueueName}',
      SLACK_OUTGOING_MESSAGE_QUEUE_URL: 'https://sqs.${self:provider.region}.amazonaws.com/${aws:accountId}/${self:resources.Resources.SlackOutgoingMessageQueue.Properties.QueueName}',
      PRODUCTS_TABLE_NAME: '${self:resources.Resources.productsTable.Properties.TableName}',
      PHILATELY_PRODUCTS_TABLE_NAME: '${self:resources.Resources.philatelyProductsTable.Properties.TableName}',
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
            Action: ['sqs:SendMessage'],
            Resource: {
              'Fn::GetAtt': ['SlackOutgoingMessageQueue', 'Arn'],
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
            Action: [
              'dynamodb:DescribeTable',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
            ],
            Resource: {
              'Fn::GetAtt': ['philatelyProductsTable', 'Arn'],
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
    postLtPhilatelyWatcher,
    slackMessageSender,
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
      SlackOutgoingMessageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-${self:provider.stage}-slack-outgoing-message-queue',
          RedrivePolicy: {
            deadLetterTargetArn: {
              'Fn::GetAtt': ['SlackOutgoingMessageDLQ', 'Arn'],
            },
            maxReceiveCount: 5,
          },
        },
      },
      SlackOutgoingMessageDLQ: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-${self:provider.stage}-slack-outgoing-message-dlq',
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
      philatelyProductsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'philatelyProductsTable',
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
          'SLACK_CHANNEL_I_STORE_LT_UPDATES',
          'SLACK_CHANNEL_POST_LT_UPDATES',
          'SLACK_SLACK_IWATCHER_TOKEN',
          'SLACK_PHILATELY_LITHUANIA_TOKEN',
          'TELEGRAM_BOT_TOKEN',
          'TELEGRAM_DEFAULT_CHAT_ID',
        ],
      },
      include: [
        'AWS_NODEJS_CONNECTION_REUSE_ENABLED',
        'NODE_OPTIONS',
        'SLACK_SLACK_IWATCHER_TOKEN_SSM',
        'SLACK_PHILATELY_LITHUANIA_TOKEN_SSM',
        'SLACK_CHANNEL_I_STORE_LT_UPDATES_SSM',
        'SLACK_CHANNEL_POST_LT_UPDATES_SSM',
        'TELEGRAM_BOT_TOKEN_SSM',
        'TELEGRAM_DEFAULT_CHAT_ID_SSM',
        'ISTORE_LT_PAGES_SSM',
        'SLACK_OUTGOING_MESSAGE_QUEUE_URL',
        'TELEGRAM_INCOMING_MESSAGE_QUEUE_URL',
        'TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL',
        'PRODUCTS_TABLE_NAME',
        'PHILATELY_PRODUCTS_TABLE_NAME',
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
          path: '${self:provider.environment.SLACK_IWATCHER_TOKEN_SSM}',
          type: 'SecureString',
          value: '${env:SLACK_IWATCHER_TOKEN}',
          secure: true,
        },
        {
          path: '${self:provider.environment.SLACK_PHILATELY_LITHUANIA_TOKEN_SSM}',
          type: 'SecureString',
          value: '${env:SLACK_PHILATELY_LITHUANIA_TOKEN}',
          secure: true,
        },
        {
          path: '${self:provider.environment.SLACK_CHANNEL_I_STORE_LT_UPDATES_SSM}',
          type: 'SecureString',
          value: '${env:SLACK_CHANNEL_I_STORE_LT_UPDATES}',
          secure: true,
        },
        {
          path: '${self:provider.environment.SLACK_CHANNEL_POST_LT_UPDATES_SSM}',
          type: 'SecureString',
          value: '${env:SLACK_CHANNEL_POST_LT_UPDATES}',
          secure: true,
        },
        {
          path: '${self:provider.environment.ISTORE_LT_PAGES_SSM}',
          type: 'StringList',
          value: [
            '/apple-mac-kompiuteriai/macbook-pro/shopby/14/32_gb/?limit=all',
            '/apple-ipad-plansetes/ipad-air-2022/shopby/64gb/tik_wi_fi/',
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
