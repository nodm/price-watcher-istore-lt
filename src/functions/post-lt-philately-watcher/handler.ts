import { ScheduledHandler } from 'aws-lambda';

import { EnvVariable, getEnvVariable } from '@config/get-env-variable';
import { PhilatelyProduct } from '@models/philatelyProduct';
import PostLtPhilatelyService from '@services/PostLtPhilatelyService';
import PhilatelyProductsService from '@services/PhilatelyProductsService';
import SQSService from '@services/SQSService';
import SSMParameterService from '@services/SSMParameterService';
import { createTelegramMessage } from './helpers';

const postLtPhilatelyWatcher: ScheduledHandler = async (): Promise<void> => {
  console.log('Started...');

  const latestProductLinks = await PostLtPhilatelyService.getLatestProductLinks();
  console.log('Latest product links:\n', latestProductLinks);

  const isProductAlreadyAddedRequests = latestProductLinks
    .map(
      (productLink: string) => PhilatelyProductsService
        .getProduct(productLink)
        .then(product => ({ productLink, isNew: !product }))
    );
  const productCheckResults = await Promise.allSettled(isProductAlreadyAddedRequests);
  const newProductLinks = productCheckResults.reduce((newProducts, promiseResult, index) => {
    if (promiseResult.status === 'rejected') {
      console.log(`Product "${latestProductLinks[index]}" has error`, promiseResult.reason);
      return newProducts;
    }

    if (promiseResult.value.isNew) {
      return [...newProducts, promiseResult.value.productLink];
    }

    return newProducts;
  }, []);
  console.log('New product links:', newProductLinks);

  const newProductsPromises = newProductLinks.map(
    productLink => PostLtPhilatelyService.getProduct(productLink)
  );
  const newProductsResults = await Promise.allSettled(newProductsPromises);
  const newProducts = newProductsResults
    .filter((result) => {
      if (result.status === 'fulfilled') {
        return true;
      }

      console.log('Error getting product details:', result.reason);
      return false;
    })
    .map(result => result.status === 'fulfilled' && result.value);
  console.log('New products:', newProducts);

  const productStoringPromises = newProducts.map(product => PhilatelyProductsService.addProduct(product));
  const productStoringResults = await Promise.allSettled(productStoringPromises);
  productStoringResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.log('Error while storing product:', result.reason);
      return;
    }

    console.log('Product stored successfully:', result.value);
  });

  const chatIdSsm = getEnvVariable(EnvVariable.TELEGRAM_DEFAULT_CHAT_ID_SSM);
  console.log('Request paths from SSM:', chatIdSsm);
  const chatIdString = await SSMParameterService.getParameter(chatIdSsm) as string;
  console.log('Paths:', chatIdString);
  const chatId = parseInt(chatIdString);

  const queueUrl = getEnvVariable(EnvVariable.TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL);
  const sendMessage = SQSService.send(queueUrl);

  const results = await Promise.allSettled(newProducts.map(async (product: PhilatelyProduct) => {

    const text = createTelegramMessage(product);
    console.log('Telegram message text', text);

    return sendMessage({ chatId,  text, parseMode: 'HTML' })
  }));

  results
    .forEach(result => {
      if (result.status === 'rejected') {
        console.error(result.reason);
      }
    });
};

export const main = postLtPhilatelyWatcher;
