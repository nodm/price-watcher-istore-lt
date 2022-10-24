import { Context, SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { Message } from '@grammyjs/types';
import { sendSQSMessage } from '@services/sqsService';

const telegramMessageProcessor: SQSHandler = async (event: SQSEvent, context: Context) => {
  console.log('telegramMessageProcessor :: Message received', event);

  const { OUTGOING_MESSAGE_QUEUE_NAME: queueName } = process.env;

  const results = await Promise.allSettled(event.Records.map((record: SQSRecord) => {
    const message = JSON.parse(record.body) as Message;
    const { chat: { id: chatId }, text } = message;

    return sendSQSMessage(context)(queueName, {
      chatId,
      text: `_${text}_ Hello *${message?.from?.first_name}*`
    });
  }));

  for(const result of results) {
    console.log(
      'telegramMessageProcessor',
      'status:', result.status,
      'value:', result.status === 'fulfilled' ? result.value : result.reason,
    );
  }
};

export const main = telegramMessageProcessor;
