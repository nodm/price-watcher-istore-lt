import { Context, ScheduledHandler } from 'aws-lambda';
import { getPrices } from '@services/prices';
import { sendSQSMessage } from '@services/sqsService';
import { createMessage } from '@services/telegram';

const priceWatcher: ScheduledHandler = async (_, context: Context): Promise<void> => {
  const paths = process.env.PAGE_PATHS?.split(',');
  if (!paths || !paths.length) return;

  const chatId = parseInt(process.env.TELEGRAM_CHAT_ID);
  const { OUTGOING_MESSAGE_QUEUE_NAME: queueName } = process.env;
  const sendMessage = sendSQSMessage(context);
  const results = await Promise.allSettled(paths.map(url => getPrices(url)
    .then(createMessage)
    .then(text => sendMessage(queueName, { chatId,  text }))
  ));

  results
    .forEach(result => {
      if (result.status === 'rejected') {
        console.error(result.reason);
      }
    });
};

export const main = priceWatcher;
