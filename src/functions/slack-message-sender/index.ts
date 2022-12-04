import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 128,
  timeout: 5,
  events: [
    {
      sqs: {
        arn: { 'Fn::GetAtt': ['SlackOutgoingMessageQueue', 'Arn'] },
      },
    },
  ],
};
