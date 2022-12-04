import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import SlackService from '@services/SlackService';

const slackMessageSender: SQSHandler = async (event: SQSEvent) => {
  console.log('telegramMessageProcessor :: Event received', event);

  const sentResults = await Promise.allSettled(event.Records.map((record: SQSRecord) => {
    const message = JSON.parse(record.body);
    return SlackService.send(message);
  }));

  for(const result of sentResults) {
    console.log(
      'slackMessageSender',
      'status:', result.status,
      'value:', result.status === 'fulfilled' ? result.value : result.reason,
    );
  }
};

export const main = slackMessageSender;
