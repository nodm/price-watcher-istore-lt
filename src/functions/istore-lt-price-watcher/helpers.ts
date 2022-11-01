import { ProductItem } from '@models/product';
import TelegramService from '@services/TelegramService';

const splitNumber = (value: number): string => value
  .toString()
  .match(/(\d+?)(?=(\d{3})+(?!\d)|$)/g).join(' ');

export const createTelegramMessage = (products: ProductItem[]): string =>  products
  .map(({ name, currentPrice, previousPrice, specialPrice, url }) => {
    const priceDelta = Math.round(currentPrice - previousPrice);
    const priceChange = priceDelta
      ? ` (${priceDelta > 0 ? '⬆️' : '⬇️'} <b><i>${splitNumber(Math.abs(priceDelta))})</i></b>`
      : '';
    const messageTitle =  `<a href="${url}"><b>${TelegramService.encodeHtml(name)}</b></a>`;
    const messagePrice = `<b>${splitNumber(Math.round(currentPrice))}</b>${specialPrice ? '👍' : ''}${priceChange}`

    return `${messageTitle} - ${messagePrice}${priceChange}`;
  })
  .join('\n');
