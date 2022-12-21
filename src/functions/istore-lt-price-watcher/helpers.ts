import { ProductItem } from '@models/product';
import SlackService from '@services/SlackService';
import TelegramService from '@services/TelegramService';

const splitNumber = (value: number): string => value
  .toString()
  .match(/(\d+?)(?=(\d{3})+(?!\d)|$)/g).join(' ');

export const createTelegramMessage = (products: ProductItem[]): string =>  products
  .map(({ name, currentPrice, previousPrice, specialPrice, url }) => {
    const messageTitle =  `<a href="${url}"><b>${TelegramService.encodeHtml(name)}</b></a>`;
    const messagePrice = `<b>${splitNumber(Math.round(currentPrice))}</b>${specialPrice ? '👍' : ''}`;
    const priceDelta = Math.round(currentPrice - previousPrice);
    const priceChange = priceDelta
      ? ` (${priceDelta > 0 ? '⬆️' : '⬇️'} <b><i>${splitNumber(Math.abs(priceDelta))})</i></b>`
      : '';

    return `${messageTitle} - ${messagePrice}${priceChange}`;
  })
  .join('\n\n');


export const createSlackMessage = (products: ProductItem[]) => products.map(({
  name,
  currentPrice,
  previousPrice,
  specialPrice,
  url,
}) => {
  const priceDelta = Math.round(currentPrice - previousPrice);
  const priceChange = priceDelta
    ? ` (${priceDelta > 0 ? '⬆️' : '⬇️'} *_${splitNumber(Math.abs(priceDelta))}_*)`
    : '';
  const price = `*€ ${splitNumber(Math.round(currentPrice))}*${specialPrice ? '👍' : ''}`;
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `<${url}|*${SlackService.encodeHtml(name)}*> - ${price}${priceChange}`,
    },
  };
});
