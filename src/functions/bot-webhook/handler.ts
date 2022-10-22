import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { Message } from '@grammyjs/types';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

const sqs = new SQS();

const botWebhook = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('botWebhook :: Message received', event.body, typeof event.body);

  const message = (typeof event.body === 'string' ? JSON.parse(event.body) : event.body)?.message as Message;
  const [, , , region, accountId] = context.invokedFunctionArn.split(':');
  const { TELEGRAM_MESSAGE_QUEUE_NAME: queueName } = process.env;
  const queueUrl: string = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`

  console.log('botWebhook :: SNS URL', queueUrl);

  try {
    await sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    }).promise();
  } catch (error) {
    console.error('botWebhook :: Error', error);
    return formatJSONResponse({ message: 'Internal function error.' }, 500);
  }

  console.log('botWebhook :: Message sent to SQS', message);

  return formatJSONResponse({ message: 'Message received.' });
};

export const main = middyfy(botWebhook);
