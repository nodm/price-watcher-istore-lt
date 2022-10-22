import * as https from 'node:https';
import type { Product } from '../models/product';

export const sendMessage = (
  text: string,
  chatId = parseInt(process.env.TELEGRAM_CHAT_ID),
) => new Promise<string | never>((resolve, reject) => {
  const request = https.request({
    method: 'POST',
    hostname: 'api.telegram.org',
    path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    headers: {
      'Content-Type': 'application/json',
    }
  }, res => {
    const data = [];

    res.on('data', chunk => {
      data.push(chunk);
    });

    res.on('end', () => {
      const resData = Buffer.concat(data).toString();
      const response = res.headers['content-type'] === 'application/json'
        ? JSON.parse(resData)
        : resData;

      resolve(response);
    });
  }).on('error', err => {
    reject(err);
  });

  request.write(JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: 'MarkdownV2',
  }));

  request.end();
});

const sanitizeText = (text: string): string => text
  .replace(/-/g, '\\-')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/\./g, '\\.');


export const createMessage = (products: Product[]): string =>  products
  .map(({ name, currentPrice, specialPrice, url }) => {
    const prettyPrice = Math.round(currentPrice)
      .toString()
      .match(/(\d+?)(?=(\d{3})+(?!\d)|$)/g).join(' ');

    return `[*_${sanitizeText(name)}_*](${url}) \\- ${specialPrice ? '👍' : ''} *${sanitizeText(prettyPrice)} €*`;
  })
  .join('\n\n');
