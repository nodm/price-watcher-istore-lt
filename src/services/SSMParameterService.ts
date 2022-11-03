import * as AWS from 'aws-sdk';

const ssmClient = new AWS.SSM();

const SSMParameterService = {
  getParameter: async (name: string): Promise<string | string[]> => {
    try {
      const {
        Parameter: {
          Type: type,
          Value: value,
        } = {},
      } = await ssmClient.getParameter({ Name: name, WithDecryption: true }).promise();

      if (type === 'StringList') {
        return value.split(',');
      }

      return value;
    } catch(error) {
      console.error(error);
      throw error;
    }
  },
};

export default SSMParameterService;
