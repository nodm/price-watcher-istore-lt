import { SQSEvent, SQSHandler, SQSMessageAttributes, SQSRecord } from 'aws-lambda';
import { Message } from '@grammyjs/types';
import { sendMessage } from '../../services/telegram';

const telegramMessageProcessor: SQSHandler = async (event: SQSEvent) => {
  console.log('telegramMessageProcessor :: Event received', event);

  await Promise.allSettled(event.Records.map((record: SQSRecord) => {
    const messageAttributes: SQSMessageAttributes = record.messageAttributes;
    console.log(
      'telegramMessageProcessor :: Message Attributes',
      JSON.stringify(messageAttributes, null, 2),
    );
    const message = JSON.parse(record.body) as Message;
    const { chat: { id: chatId }, text } = message

    return sendMessage(`_${text}_ Hello, *${message?.from?.first_name}*!`, chatId);
  }));
};

export const main = telegramMessageProcessor;
