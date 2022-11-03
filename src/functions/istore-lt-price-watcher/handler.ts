import { ScheduledHandler } from 'aws-lambda';
import IStoreLtPricesService from '@services/IStoreLtPricesService';
import ProductService from '@services/ProductService';
import SQSService from '@services/SQSService';
import SSMParameterService from '@services/SSMParameterService';
import { ProductItem } from '@models/product';
import { createTelegramMessage } from './helpers';

const iStoreLtPriceWatcher: ScheduledHandler = async (): Promise<void> => {
  console.log('Started...');

  const iStoreLtPagesSsm = process.env.ISTORE_LT_PAGES_SSM;
  console.log('Request paths from SSM:', iStoreLtPagesSsm);
  const paths = await SSMParameterService.getParameter(iStoreLtPagesSsm) as string[];
  console.log('Paths:', paths);

  if (!paths || !paths.length) return;

  const chatIdSsm = process.env.TELEGRAM_DEFAULT_CHAT_ID_SSM;
  console.log('Request paths from SSM:', chatIdSsm);
  const chatIdString = await SSMParameterService.getParameter(chatIdSsm) as string;
  console.log('Paths:', chatIdString);
  const chatId = parseInt(chatIdString);

  const queueUrl = process.env.TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL;
  const sendMessage = SQSService.send(queueUrl);

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
