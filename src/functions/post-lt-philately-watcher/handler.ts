import { ScheduledHandler } from 'aws-lambda';

import { EnvVariable, getEnvVariable } from '@config/get-env-variable';
import { PhilatelyProduct } from '@models/philatelyProduct';
import PostLtPhilatelyService from '@services/PostLtPhilatelyService';
import PhilatelyProductsService from '@services/PhilatelyProductsService';
import SQSService from '@services/SQSService';
import { createSlackMessage } from './helpers';
import SSMParameterService from '@services/SSMParameterService';

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

  const queueUrl = getEnvVariable(EnvVariable.SLACK_OUTGOING_MESSAGE_QUEUE_URL);
  const sendMessage = SQSService.send(queueUrl);

  const slackChannelSsm = getEnvVariable(EnvVariable.SLACK_CHANNEL_POST_LT_UPDATES_SSM);
  console.log('Request paths from SSM:', slackChannelSsm);
  const channel = await SSMParameterService.getParameter(slackChannelSsm) as string;
  console.log('Slack chanel received');

  const results = await Promise.allSettled(newProducts.map(async (product: PhilatelyProduct) => {
    const message = createSlackMessage(product);
    console.log('Slack message text', message);

    return sendMessage({ channel, message });
  }));

  results
    .forEach(result => {
      if (result.status === 'rejected') {
        console.error(result.reason);
      }
    });
};

export const main = postLtPhilatelyWatcher;
