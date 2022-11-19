import { EnvVariable, getEnvVariable } from '@config/get-env-variable';
import { PhilatelyProduct } from '@models/philatelyProduct';
import { provideDynamoDBClient } from '@services/dynamoDBClientProvider';

const philatelyProductsTable = getEnvVariable(EnvVariable.PHILATELY_LITHUANIA_TABLE_NAME);
const dynamoDBClient = provideDynamoDBClient();

const PhilatelyProductsService = {
  getProduct: async (href: string): Promise<PhilatelyProduct> | never => {
    try {
      const { Item: product } = await dynamoDBClient.get({
        TableName: philatelyProductsTable,
        Key: {
          href,
        },
      }).promise();
      console.log('getProduct :: product', product);

      return product as PhilatelyProduct;
    } catch(error) {
      console.log(error);
    }
  },

  addProduct: async (product: PhilatelyProduct): Promise<PhilatelyProduct> | never => {
    try {
      await dynamoDBClient.put({
        TableName: philatelyProductsTable,
        Item: product,
      }).promise();

      return product;
    } catch(error) {
      console.log(error);
    }
  },
};

export default PhilatelyProductsService;
