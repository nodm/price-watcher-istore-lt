import { PhilatelyProduct } from '@models/philatelyProduct';
import TelegramService from '@services/TelegramService';

export const createTelegramMessage = (product: PhilatelyProduct): string => {
    const title = `<a href="${product.href}"><b>${TelegramService.encodeHtml(product.title)}</b></a>`;
    const type = `<b>${product.type}</b>`;
    const year = product.year && `<b>${product.year}</b>`;
    const dateOfIssue = product.dateOfIssue && `<b>Date:</b> <i>${product.dateOfIssue}</i>`;
    const catalogNumber = product.catalogNumber && `<b>No.</b> <i>${product.catalogNumber}</i>`;
    const price = product.price && `<i>${product.price.value} ${product.price.currency}</i>`;
    const meta = product.meta.length && `<i>${product.meta.join('\n')}</i>`;
    const description = product.description.length && `<b>Description:</b>\n${product.description.join('\n')}`;

    return [
        title,
        type,
        year,
        dateOfIssue,
        catalogNumber,
        price,
        meta,
        description,
    ].filter(Boolean).join('\n\n');
};
