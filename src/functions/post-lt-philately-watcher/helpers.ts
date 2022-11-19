import { PhilatelyProduct } from '@models/philatelyProduct';
import TelegramService from '@services/TelegramService';

export const createTelegramMessage = (product: PhilatelyPuroduct): string => {
    const title = `<a href="${product.href}"><b>${TelegramService.encodeHtml(product.title)}</b></a>`;
    const type = `<i>${product.type}</i>`;
    const year = product.year && `<b>${product.year}</b>`;
    const dateOfIssue = product.dateOfIssue && `<b>Date:</b> <i>${product.dateOfIssue}</i>`;
    const catalogNumber = product.catalogNumber && `<b>No.</b> <i>${product.catalogNumber}</i>`;
    const price = product.price && `<b>Price:</b> <i>${product.price.value} ${product.price.currency}</i>`;
    const meta = product.meta.length && `<i>${TelegramService.encodeHtml(product.meta.join('\n'))}</i>`;
    const description = product.description.length &&
      `<b>Description:</b>\n${TelegramService.encodeHtml(product.description.join('\n'))}`;


    return [
        title,
        year,
        [dateOfIssue, type, catalogNumber].filter(Boolean).join('&mbsp;'),
        price,
        meta,
        description,
    ].filter(Boolean).join('\n\n');
};
