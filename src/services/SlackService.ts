import { EnvVariable, getEnvVariable } from '@config/get-env-variable';
import HttpsService from '@services/HttpsService';
import SSMParameterService from '@services/SSMParameterService';

const SlackService = {
  send: async (message) => {
    const slackTokenSsm = getEnvVariable(EnvVariable.SLACK_TOKEN_SSM);
    console.log('Request paths from SSM:', slackTokenSsm);
    const slackToken = await SSMParameterService.getParameter(slackTokenSsm) as string;
    console.log('Slack token received');

    const slackChannelSsm = getEnvVariable(EnvVariable.SLACK_CHANNEL_SSM);
    console.log('Request paths from SSM:', slackChannelSsm);
    const channel = await SSMParameterService.getParameter(slackChannelSsm) as string;
    console.log('Slack chanel received');

    return HttpsService.post(
      {
        hostname: 'slack.com',
        path: '/api/chat.postMessage',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${slackToken}`
        }
      },
      {
        channel,
        ...message,
      }
    );
  },

  encodeHtml: (text: string): string => text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;'),
};

export default SlackService;
