import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Message } from '@grammyjs/types';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import SQSService from '@services/SQSService';

const telegramBotWebhook = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('botWebhook :: Message received', event.body);

  const message = (typeof event.body === 'string' ? JSON.parse(event.body) : event.body)?.message as Message;
  const { TELEGRAM_INCOMING_MESSAGE_QUEUE_NAME: queueName } = process.env;

  try {
    await SQSService.send(context)(queueName, message);
  } catch (error) {
    console.error('botWebhook :: Error', error);
    return formatJSONResponse({ message: 'Internal function error.' }, 500);
  }

  console.log('botWebhook :: Message sent to SQS', message);

  return formatJSONResponse({ message: 'Message received.' });
};

export const main = middyfy(telegramBotWebhook);
