import { Context, SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { Message } from '@grammyjs/types';

const sqs = new SQS();

const telegramMessageProcessor: SQSHandler = async (event: SQSEvent, context: Context) => {
  console.log('telegramMessageProcessor :: Message received', event);
  console.log('telegramMessageProcessor :: Context.invokedFunctionArn', context.invokedFunctionArn.split);

  const [, , , region, accountId] = context.invokedFunctionArn.split(':');
  const { TELEGRAM_OUTGOING_MESSAGE_QUEUE_NAME: queueName } = process.env;
  const queueUrl: string = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`

  console.log('telegramMessageProcessor :: SNS URL', queueUrl);

  const results = await Promise.allSettled(event.Records.map((record: SQSRecord) => {
    const message = JSON.parse(record.body) as Message;
    const { chat: { id: chatId }, text } = message;

    return sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        chatId,
        text: `_${text}_ Hello *${message?.from?.first_name}*`
      }),
    }).promise();
  }));

  for(const result of results) {
    if (result.status === 'fulfilled') {
      console.log(
        'telegramMessageProcessor',
        'status:', result.status,
        'value:', result.value,
      );
      return;
    }

    console.log(
      'telegramMessageProcessor',
      'status:',result. status,
      'reason:', result.reason,
    );
  }
};

export const main = telegramMessageProcessor;
