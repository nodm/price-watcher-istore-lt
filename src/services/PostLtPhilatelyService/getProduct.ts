import { load } from 'cheerio';

import { PhilatelyProduct, PhilatelyProductType } from '@models/philatelyProduct';
import HttpsService from '../HttpsService';
import { POST_LT_HOST } from './constants.js';

const PRODUCT_SELECTOR = 'div#maincontent';

export const getProduct = async (url: string): Promise<PhilatelyProduct> => {
  console.log('PostLtPhilatelyService::getProduct called with', url);

  const data = await HttpsService.get(url);
  const $ = load(data, null, false);
  const productElement = $(PRODUCT_SELECTOR).first();

  console.log('PostLtPhilatelyService::getProduct product element founded', productElement);

  if (!productElement) {
    return null;
  }

  const product = {
    href: url,
    ...parseTitle(productElement),
    ...parseImg(productElement),
    ...parsePrice(productElement),
    ...getDescription(productElement, $),
  };

  console.log('PostLtPhilatelyService::getProduct product', product);

  return product;
};

const TITLE_SELECTOR = 'h1.top';
const parseTitle = (productElement) => {
  const titleText = productElement.find(TITLE_SELECTOR).text();

  const dateString = titleText.substring(0, 10);
  const [year, month, date] = dateString.split(' ');

  let dateOfIssue = '';
  try {
    const issueDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(date),
      12,
      0,
      0,
      0
    );
    dateOfIssue = issueDate?.toISOString()?.substring(0,10) ?? '';
  } catch (error) {
    console.log('Parsing error:', error, productElement);
  }

  const rawTitle = sanitize(titleText.substring(10));

  let type = PhilatelyProductType.STAMP;
  if (rawTitle.includes('PVD') || rawTitle.includes('PDV') || rawTitle.includes('Pirmos dienos vokas')) {
    type = PhilatelyProductType.PDV;
  } else if(rawTitle.includes('ML') || rawTitle.includes('Mažas lapelis')|| rawTitle.includes('Mažas lapeiis')) {
    type = PhilatelyProductType.ML;
  } else if(rawTitle.includes('KM') || rawTitle.includes('Kartmaksimumas')) {
    type = PhilatelyProductType.KM;
  } else if(rawTitle.includes('PA')) {
    type = PhilatelyProductType.PA;
  } else if(rawTitle.includes('Bukletas')) {
    type = PhilatelyProductType.BOOKLET;
  } else if(rawTitle.includes('METŲ PAŠTO ŽENKLŲ RINKINYS')) {
    type = PhilatelyProductType.ANNUAL_COLLECTION;
  }

  const titleWithoutType = [
    'PVD', 'PDV', 'Pirmos dienos vokas',
    'ML', 'Mažas lapelis', 'Mažas lapeiis',
    'KM', 'Kartmaksimumas',
    'PA',
    'Bukletas',
    '\\(\\)\.',
    '\\(\\)',
  ]
    .reduce((a, w) => a.replace(new RegExp(w, 'g'), ''), rawTitle)
    .trim();
  const [, title = titleWithoutType] = titleWithoutType.match(/^"(.*)?"$/) ?? [];

  return { year: parseInt(year), dateOfIssue, type, title };
};

const IMAGE_SELECTOR = '.item .img > img'
const parseImg = (productElement) => {
  const imgUrl = [
    POST_LT_HOST,
    encodeURI(productElement.find(IMAGE_SELECTOR)?.attr('src')?.replace('/320x', '/1280x')),
  ].join('/');

  return { imgUrl };
};

const PRICE_SELECTOR = '.item .price > h2';
const parsePrice = (productElement) => {
  const priceText = productElement.find(PRICE_SELECTOR)?.text();
  const [valueText, currency] = priceText.split(' ');
  return {
    price: {
      value: Number(valueText.replace(',', '.')),
      currency: currency?.toUpperCase(),
    },
  };
};

const DESCRIPTION_SELECTOR = '.item .desc';
const getDescription = (productElement, $) => {
  const descriptionLines = productElement
    .find(`${DESCRIPTION_SELECTOR} > p`)
    .toArray()
    .map((element) => {
      return sanitize($(element).text());
    });

  return  descriptionLines.reduce((parsedDescription, descriptionLine) => {
    if (!descriptionLine) {
      return parsedDescription;
    }

    const line = sanitize(descriptionLine);

    const [, catalogNumber] =
      line.match(/Nr\. ([0-9-a-zA-Z]*)[\.\s]/) ||
      line.match(/Nr\. ([0-9-a-zA-Z]*)$/) ||
      [];

    if (catalogNumber) {
      return {
        catalogNumber,
        meta: parsedDescription.meta,
        description: parsedDescription.description,
      };
    }

    if (line.match(/(?:\s|^)(Dail\.|Ofsetas\.|Lape|Tiražas|Spausdino)(?=\s|$)/)) {
      return {
        catalogNumber: parsedDescription.catalogNumber,
        meta: [...parsedDescription.meta, line],
        description: parsedDescription.description,
      };
    }

    return {
      catalogNumber: parsedDescription.catalogNumber,
      meta: parsedDescription.meta,
      description: [...parsedDescription.description, line],
    };
  }, {
    catalogNumber: undefined,
    meta: [],
    description: [],
  });
};

const sanitize = (str: string): string => {
  return str
    .replace(/[/\n/\t]+/g, '')
    .trim()
    .replace(/,,/g, '"')
    .replace(/''/g, '"')
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/„/g, '"')
    .replace(/ /g, '');
}
