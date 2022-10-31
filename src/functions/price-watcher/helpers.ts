import { ProductItem } from '@models/product';
import TelegramService from '@services/TelegramService';

const splitNumber = (value: number): string => value
  .toString()
  .match(/(\d+?)(?=(\d{3})+(?!\d)|$)/g).join(' ');

export const createTelegramMessage = (products: ProductItem[]): string =>  products
  .map(({ name, currentPrice, previousPrice, specialPrice, url }) => {
    const priceDelta = Math.round(currentPrice - previousPrice);
    const priceChange = priceDelta
      ? ` (${priceDelta > 0 ? '⬆️' : '⬇️'} ${splitNumber(Math.abs(priceDelta))})`
      : '';

    return `
        <a href="${url}">
            <b>${TelegramService.encodeHtml(name)}</b>
        </a> - <b>${splitNumber(Math.round(currentPrice))}</b>${specialPrice ? '👍' : ''}${priceChange}
    `;
  })
  .join('\n');
