import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 256,
  timeout: 20,
  events: [
    {
      schedule: 'cron(0 10 ? * MON-SAT *)',
    },
  ],
};
