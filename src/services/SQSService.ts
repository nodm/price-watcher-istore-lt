import { Context } from 'aws-lambda';
import { SQS } from 'aws-sdk';

const sqs = new SQS();

const SQSService = {
  send: (context: Context, queueName: string) => {
    const [, , , region, accountId] = context.invokedFunctionArn.split(':');
    const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;

    return (message: unknown) => sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: typeof message === 'string' ? message : JSON.stringify(message),
    }).promise();
  },
};

export default SQSService;
