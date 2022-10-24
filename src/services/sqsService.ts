import { Context } from 'aws-lambda';
import { SQS } from 'aws-sdk';

export const sendSQSMessage = (context: Context) => (queueName: string, message: unknown) => {
  const sqs = new SQS();
  const [, , , region, accountId] = context.invokedFunctionArn.split(':');
  const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;

  return sqs.sendMessage({
    QueueUrl: queueUrl,
    MessageBody: typeof message === 'string' ? message : JSON.stringify(message),
  }).promise();
};
