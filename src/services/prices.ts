import * as path from 'node:path';
import { load } from 'cheerio';
import { fetchPage } from './fetch';

export type Product = {
  name: string;
  price: number;
  specialPrice: boolean;
  url: string;
}

const HOST_NAME = 'https://istore.lt';

export const getPrices = async (pathToPage: string): Promise<Product[]> => {
  const data = await fetchPage(path.join(HOST_NAME, pathToPage));
  const $ = load(data, null, false);

  const productElements = $('ul.products-grid > li > div.inner').toArray();
  return productElements
    .reduce((products, product) => {
      const productElement = $(product);

      const inStock = productElement.find('p.availability').hasClass('in-stock');
      if (!inStock) return products;

      const name = productElement.find('h2.product-name > a').text();
      const url = productElement.find('.image-box > a').attr('href');

      const priceBoxElement = productElement.find('div.price-box');
      const specialPriceElement = priceBoxElement.find('.special-price');
      const price = parseFloat(
        ((specialPriceElement.length && specialPriceElement) || priceBoxElement)
          .find('span.price')
          .text()
          .replace(/[^0-9,]/g, '')
      );
      const specialPrice = !!specialPriceElement.length;

      console.log(JSON.stringify({
        name,
        price,
        specialPrice,
        url,
      }, null, 2));

      return [
        ...products,
        {
          name,
          price,
          specialPrice,
          url,
        },
      ];
    }, []);
};
