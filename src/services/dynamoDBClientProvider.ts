import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { EnvVariable, getEnvVariable } from '@config/get-env-variable';

export const provideDynamoDBClient = (): DocumentClient => {
  if (getEnvVariable(EnvVariable.IS_OFFLINE, true)) {
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000',
    });
  }

  return new AWS.DynamoDB.DocumentClient();
};
