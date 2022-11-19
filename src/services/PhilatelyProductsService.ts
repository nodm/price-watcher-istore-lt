import { EnvVariable, getEnvVariable } from '@config/get-env-variable';
import { PhilatelyProduct } from '@models/philatelyProduct';
import { provideDynamoDBClient } from '@services/dynamoDBClientProvider';

const philatelyProductsTable = getEnvVariable(EnvVariable.PHILATELY_PRODUCTS_TABLE_NAME);
const dynamoDBClient = provideDynamoDBClient();

const PhilatelyProductsService = {
  getProduct: async (href: string): Promise<PhilatelyProduct> | never => {
    console.log('PhilatelyProductsService::getProduct called with', href);

    try {
      const { Item: product } = await dynamoDBClient.get({
        TableName: philatelyProductsTable,
        Key: {
          href,
        },
      }).promise();

      console.log('PhilatelyProductsService::getProduct product founded', product);

      return product as PhilatelyProduct;
    } catch(error) {
      console.log('PhilatelyProductsService::getProduct error', error);
    }
  },

  addProduct: async (product: PhilatelyProduct): Promise<PhilatelyProduct> | never => {
    console.log('PhilatelyProductsService::addProduct called with', product);

    try {
      await dynamoDBClient.put({
        TableName: philatelyProductsTable,
        Item: product,
      }).promise();

      console.log('PhilatelyProductsService::addProduct product added');

      return product;
    } catch(error) {
      console.log('PhilatelyProductsService::addProduct error', error);
    }
  },
};

export default PhilatelyProductsService;
