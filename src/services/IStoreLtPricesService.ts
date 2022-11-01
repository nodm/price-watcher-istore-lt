import * as path from 'node:path';
import { load } from 'cheerio';
import type { Product } from '@models/product';
import HttpsService from '@services/HttpsService';

const HOST_NAME = 'https://istore.lt';

const IStoreLtPricesService = {
  getPrices: async (pathToPage: string): Promise<Product[]> => {
    const data = await HttpsService.get(path.join(HOST_NAME, pathToPage));
    const $ = load(data, null, false);

    const productElements = $('ul.products-grid > li > div.inner').toArray();
    console.log('Number of elements found:', productElements.length);

    return productElements
      .reduce((products, product) => {
        const productElement = $(product);

        const inStock = productElement.find('p.availability').hasClass('in-stock');
        if (!inStock) return products;

        const name = productElement.find('h2.product-name > a').text();
        const url = productElement.find('.image-box > a').attr('href');

        const priceBoxElement = productElement.find('div.price-box');
        const specialPriceElement = priceBoxElement.find('.special-price');
        const currentPrice = parseFloat(
          ((specialPriceElement.length && specialPriceElement) || priceBoxElement)
            .find('span.price')
            .text()
            .replace(/[^0-9,]/g, '')
        );
        const specialPrice = !!specialPriceElement.length;

        return [
          ...products,
          {
            url,
            name,
            currentPrice,
            specialPrice,
          },
        ];
      }, []);
  },
};
export default IStoreLtPricesService;
