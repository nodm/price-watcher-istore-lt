import { Context, ScheduledHandler } from 'aws-lambda';
import PricesService from '@services/PricesService';
import ProductService from '@services/ProductService';
import SQSService from '@services/SQSService';
import { Product } from '@models/product';

const priceWatcher: ScheduledHandler = async (_, context: Context): Promise<void> => {
  const paths = process.env.PAGE_PATHS?.split(',');
  if (!paths || !paths.length) return;

  const chatId = parseInt(process.env.TELEGRAM_CHAT_ID);
  const { TELEGRAM_OUTGOING_MESSAGE_QUEUE_NAME: queueName } = process.env;
  const sendMessage = SQSService.send(context);

  const results = await Promise.allSettled(paths.map(url => PricesService.getPrices(url)
      .then((products: Product[]) => Promise
        .allSettled(products.map(product => ProductService.setPrice(product)))
        .then(() => products))
    .then(createTelegramMessage)
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

const sanitizeText = (text: string): string => text
  .replace(/-/g, '\\-')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/\./g, '\\.');

const createTelegramMessage = (products: Product[]): string =>  products
  .map(({ name, currentPrice, specialPrice, url }) => {
    const prettyPrice = Math.round(currentPrice)
      .toString()
      .match(/(\d+?)(?=(\d{3})+(?!\d)|$)/g).join(' ');

    return `[*_${sanitizeText(name)}_*](${url}) \\- ${specialPrice ? '👍' : ''} *${sanitizeText(prettyPrice)} €*`;
  })
  .join('\n\n');
