import { Context, ScheduledHandler } from 'aws-lambda';
import IStoreLtPricesService from '@services/IStoreLtPricesService';
import ProductService from '@services/ProductService';
import SQSService from '@services/SQSService';
import { ProductItem } from '@models/product';
import { createTelegramMessage } from './helpers';

const iStoreLtPriceWatcher: ScheduledHandler = async (_, context: Context): Promise<void> => {
  console.log('Started...');

  const paths = process.env.PAGE_PATHS?.split(',');
  console.log('Paths:', paths);
  if (!paths || !paths.length) return;

  const chatId = parseInt(process.env.TELEGRAM_CHAT_ID);
  const { TELEGRAM_OUTGOING_MESSAGE_QUEUE_NAME: queueName } = process.env;
  const sendMessage = SQSService.send(context, queueName);

  const results = await Promise.allSettled(paths.map(async (url: string) => {
    const products = await IStoreLtPricesService.getPrices(url);
    console.log('Products:', products);

    const productItemPromiseResults = await Promise.allSettled(
      products.map(product => ProductService.setPrice(product))
    );
    console.log('Product Item Promise Results:', productItemPromiseResults);

    const productItems = productItemPromiseResults.reduce((products, result) => {
      if (result.status === 'rejected') return products;

      return [...products, result.value];
    }, [] as ProductItem[]);
    console.log('Product Items:', productItems);

    const text = createTelegramMessage(productItems);
    console.log('Telegram message text', text);

    return sendMessage({ chatId,  text, parseMode: 'HTML' })
  }));

  results
    .forEach(result => {
      if (result.status === 'rejected') {
        console.error(result.reason);
      }
    });
};

export const main = iStoreLtPriceWatcher;
