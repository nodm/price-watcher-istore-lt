import { load } from 'cheerio';

import HttpsService from '../HttpsService';
import { POST_LT_HOST, POST_LT_PHILATELY_URL } from './constants.js';

const PRODUCT_LINK_SELECTOR = '.productlist > .itemsRow  a.title';

export const getLatestProductLinks = async (): Promise<string[]> => {
  const data = await HttpsService.get(POST_LT_PHILATELY_URL);
  const $ = load(data, null, false);
  const productElements = $(PRODUCT_LINK_SELECTOR).toArray();

  return productElements
    .map(productElement => [POST_LT_HOST, encodeURI($(productElement).attr('href'))].join('/'));
};
