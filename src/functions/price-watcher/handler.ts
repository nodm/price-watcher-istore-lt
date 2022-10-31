import { Context, ScheduledHandler } from 'aws-lambda';
import PricesService from '@services/PricesService';
import ProductService from '@services/ProductService';
import SQSService from '@services/SQSService';
import { Product, ProductItem } from '@models/product';
import { createTelegramMessage } from './helpers';

const priceWatcher: ScheduledHandler = async (_, context: Context): Promise<void> => {
  const paths = process.env.PAGE_PATHS?.split(',');
  if (!paths || !paths.length) return;

  const chatId = parseInt(process.env.TELEGRAM_CHAT_ID);
  const { TELEGRAM_OUTGOING_MESSAGE_QUEUE_NAME: queueName } = process.env;
  const sendMessage = SQSService.send(context, queueName);

  const results = await Promise.allSettled(paths.map(url => PricesService.getPrices(url)
    .then((products: Product[]) => Promise.allSettled(products.map(product => ProductService.setPrice(product))))
    .then(results => results.reduce((products, result) => {
      if (result.status === 'rejected') return products;

      return [...products, result.value];
    }, [] as ProductItem[]))
    .then(createTelegramMessage)
    .then(text => sendMessage({ chatId,  text, parseMode: 'HTML' }))
  ));

  results
    .forEach(result => {
      if (result.status === 'rejected') {
        console.error(result.reason);
      }
    });
};

export const main = priceWatcher;
