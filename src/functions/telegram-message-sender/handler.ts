import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { sendMessage } from '@services/telegram';

const telegramMessageSender: SQSHandler = async (event: SQSEvent) => {
  console.log('telegramMessageProcessor :: Event received', event);

  const sentResults = await Promise.allSettled(event.Records.map((record: SQSRecord) => {
    const message = JSON.parse(record.body);
    const { chatId, text = '' } = message;
    if (!chatId) {
      return Promise.reject(new Error('Incorrect chat ID.'));
    }

    return sendMessage(chatId, text);
  }));

  for(const result of sentResults) {
    console.log(
      'telegramMessageProcessor',
      'status:', result.status,
      'value:', result.status === 'fulfilled' ? result.value : result.reason,
    );
  }
};

export const main = telegramMessageSender;
