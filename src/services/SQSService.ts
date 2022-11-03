import { SQS } from 'aws-sdk';

const sqs = new SQS();

const SQSService = {
  send: (queueUrl: string) => (message: unknown) => sqs.sendMessage({
    QueueUrl: queueUrl,
    MessageBody: typeof message === 'string' ? message : JSON.stringify(message),
  }).promise(),
};

export default SQSService;
