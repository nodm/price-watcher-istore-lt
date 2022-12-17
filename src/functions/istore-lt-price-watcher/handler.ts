import { ScheduledHandler } from 'aws-lambda';

import { EnvVariable, getEnvVariable } from '@config/get-env-variable';
import { ProductItem } from '@models/product';
import IStoreLtPricesService from '@services/IStoreLtPricesService';
import ProductService from '@services/ProductService';
import SQSService from '@services/SQSService';
import SSMParameterService from '@services/SSMParameterService';
import { createSlackMessage } from './helpers';

const iStoreLtPriceWatcher: ScheduledHandler = async (): Promise<void> => {
  console.log('Started...');

  const iStoreLtPagesSsm = getEnvVariable(EnvVariable.ISTORE_LT_PAGES_SSM);
  console.log('Request paths from SSM:', iStoreLtPagesSsm);
  const paths = await SSMParameterService.getParameter(iStoreLtPagesSsm) as string[];
  console.log('Paths:', paths);

  if (!paths || !paths.length) return;

  const slackChannelSsm = getEnvVariable(EnvVariable.SLACK_CHANNEL_I_STORE_LT_UPDATES_SSM);
  console.log('Request channel from SSM:', slackChannelSsm);
  const channel = await SSMParameterService.getParameter(slackChannelSsm) as string;
  console.log('Paths:', channel);

  const queueUrl = getEnvVariable(EnvVariable.SLACK_OUTGOING_MESSAGE_QUEUE_URL);
  const sendMessage = SQSService.send(queueUrl);

  const results = await Promise.allSettled(paths.map(async (url: string) => {
    const products = await IStoreLtPricesService.getPrices(url);
    console.log('Products:', products);

    const productItemPromiseResults = await Promise.allSettled(
      products.map(product => ProductService.setPrice(product))
    );
    console.log('Product Item Promise Results:', productItemPromiseResults);

    const productItems = productItemPromiseResults.reduce((products, result) => {
      if (result.status === 'rejected') return products;

      return [...products, result.value];
    }, [] as ProductItem[]);
    console.log('Product Items:', productItems);

    const messages = createSlackMessage(productItems);
    console.log('Slack messages', messages);
    
    return Promise.all(messages.map(message => sendMessage({ channel, message })));
  }));

  results
    .forEach(result => {
      if (result.status === 'rejected') {
        console.error(result.reason);
      }
    });
};

export const main = iStoreLtPriceWatcher;
