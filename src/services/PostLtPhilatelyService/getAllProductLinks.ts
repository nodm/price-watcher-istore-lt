import { load } from 'cheerio';

import { POST_LT_HOST } from '@services/PostLtPhilatelyService/constants';
import HttpsService from '../HttpsService';

const PRODUCT_LINK_SELECTOR = '.productlist > .itemsRow  a.title';
const NEXT_PAGE_LINK_SELECTOR = 'a.next';

export const getAllProductLinks = async ({ pageUrl, productLinks = [] }) => {
  console.log('PostLtPhilatelyService::getAllProductLinks called with', pageUrl, productLinks);

  if (!pageUrl) {
    return productLinks;
  }

  const data = await HttpsService.get(pageUrl);
  console.log(`PostLtPhilatelyService::getAllProductLinks response from ${pageUrl} received:`, data);

  const $ = load(data, null, false);
  const productElements = $(PRODUCT_LINK_SELECTOR).toArray();

  const pageProductLinks = productElements
    .map(productElement => POST_LT_HOST + encodeURI($(productElement).attr('href')));

  const linkToNextPage = $(NEXT_PAGE_LINK_SELECTOR).attr('href')
  console.log(`PostLtPhilatelyService::getAllProductLinks link to the next page`, linkToNextPage);

  return getAllProductLinks({
    pageUrl: linkToNextPage ? `${POST_LT_HOST}${linkToNextPage}` : null,
    productLinks: [...productLinks, ...pageProductLinks]
  });
};
