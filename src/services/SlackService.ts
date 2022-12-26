import HttpsService from '@services/HttpsService';

const SlackService = {
  send: async ({ token, channel, message }) => {
    return HttpsService.post(
      {
        hostname: 'slack.com',
        path: '/api/chat.postMessage',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${token}`
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
    .replace(/&/g, '&amp;'),
};

export default SlackService;
