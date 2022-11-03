import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { Message } from '@grammyjs/types';
import SQSService from '@services/SQSService';

const telegramMessageProcessor: SQSHandler = async (event: SQSEvent) => {
  console.log('telegramMessageProcessor :: Message received', event);

  const { TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL: queueUrl } = process.env;

  const results = await Promise.allSettled(event.Records.map((record: SQSRecord) => {
    const message = JSON.parse(record.body) as Message;
    const { chat: { id: chatId }, text } = message;

    return SQSService.send(queueUrl)({
      chatId,
      text: `<i>${text}</i> Hello <b>${message?.from?.first_name}</b>`
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
