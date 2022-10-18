import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { TelegramWebhookMessage } from './telegram-webhook-message.model';

const botWebhook = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { message } = JSON.parse(event.body) as TelegramWebhookMessage;
  console.log(message);

  return formatJSONResponse({ message: 'New client added' }, 200);
};

export const main = middyfy(botWebhook);
