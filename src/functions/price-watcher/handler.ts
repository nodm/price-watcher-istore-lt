import { ScheduledHandler } from 'aws-lambda';
import { getPrices } from '../../services/prices';
import { createMessage, sendMessage } from '../../services/telegram';

const priceWatcher: ScheduledHandler = async (): Promise<void> => {
  const paths = process.env.PAGE_PATHS?.split(',');
  if (!paths || !paths.length) return;

  const results = await Promise.allSettled(paths.map(url => getPrices(url)
    .then(createMessage)
    .then(sendMessage)
  ));

  results
    .forEach(result => {
      if (result.status === 'rejected') {
        console.error(result.reason);
      }
    });
};

export const main = priceWatcher;
