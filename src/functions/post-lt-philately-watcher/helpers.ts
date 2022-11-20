import { PhilatelyProduct } from '@models/philatelyProduct';
import TelegramService from '@services/TelegramService';

export const createTelegramMessage = (product: PhilatelyProduct): string => {
    const title = `<a href="${product.href}"><b>${TelegramService.encodeHtml(product.title)}</b></a>`;
    const type = `<i>${product.type}</i>`;
    const year = product.year && `<b>${product.year}</b>`;
    const dateOfIssue = product.dateOfIssue && `<b>Date:</b> ${product.dateOfIssue}`;
    const catalogNumber = product.catalogNumber && `<b>No.</b> ${product.catalogNumber}`;
    const price = product.price && `<b>Price:</b> ${product.price.value} ${product.price.currency}`;
    const meta = product.meta.length && `<i>${TelegramService.encodeHtml(product.meta.join('\n'))}</i>`;
    const description = product.description.length &&
      `<b>Description:</b>\n${TelegramService.encodeHtml(product.description.join('\n'))}`;

    return [
        title,
        year,
        [dateOfIssue, type, catalogNumber].filter(Boolean).join(' '),
        price,
        meta,
        description,
    ].filter(Boolean).join('\n\n');
};
