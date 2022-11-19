import { load } from 'cheerio';

import HttpsService from '../HttpsService';
import { POST_LT_HOST, POST_LT_PHILATELY_URL } from './constants.js';

const PRODUCT_LINK_SELECTOR = '.productlist > .itemsRow  a.title';

export const getLatestProductLinks = async (): Promise<string[]> => {
  console.log('PostLtPhilatelyService::getLatestProductLinks called');

  const data = await HttpsService.get(POST_LT_PHILATELY_URL);
  console.log(`PostLtPhilatelyService::getLatestProductLinks response from ${POST_LT_PHILATELY_URL} received:`, data);

  const $ = load(data, null, false);
  const productElements = $(PRODUCT_LINK_SELECTOR).toArray();

  const productLinks = productElements
    .map(productElement => POST_LT_HOST + encodeURI($(productElement).attr('href')));
  console.log('PostLtPhilatelyService::getLatestProductLinks links', productLinks);

  return productLinks;
};
