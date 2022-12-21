import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 512,
  timeout: 15,
  events: [
    {
      schedule: 'cron(30 9 ? * MON-SAT *)',
    },
  ],
};
