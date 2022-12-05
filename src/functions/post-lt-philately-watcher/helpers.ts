import { PhilatelyProduct } from '@models/philatelyProduct';
import SlackService from '@services/SlackService';

export const createSlackMessage = (product: PhilatelyProduct) => {
  const title = SlackService.encodeHtml(product.title);
  const type = product.type;
  const year = product.year && `*${product.year}*`;
  const dateOfIssue = product?.dateOfIssue && `*Date:* ${product.dateOfIssue}`;
  const catalogNumber = product?.catalogNumber && `*No.* ${product.catalogNumber}`;
  const price = product.price && `*Price:* ${product.price.value} ${product.price.currency}`;
  const meta = product?.meta?.length && `_${SlackService.encodeHtml(product.meta.join('\n'))}_`;
  const description = product?.description?.length &&
    `*Description:*\n${SlackService.encodeHtml(product.description.join('\n'))}`;

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${product.href}|*${title}*>`,
      },
    },
    {
      type: 'image',
      image_url: product.imgUrl,
      alt_text: `${product.type} ${title}`,
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: year,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [dateOfIssue, type, catalogNumber].filter(Boolean).join(' '),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: price,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: meta,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: description,
      },
    },
  ].filter((block) => block.type !== 'section' || block?.text?.text);

  return { blocks };
};
