import HttpsService from '@services/HttpsService';

const TelegramService = {
  send: (
    chatId: number,
    text: string,
    parseMode = 'HTML',
  ) => {
    return HttpsService.post(
      {
        hostname: 'api.telegram.org',
        path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        headers: {
          'Content-Type': 'application/json',
        }
      },
      {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }
    );
  },

  encodeHtml: (text: string): string => text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;'),
};

export default TelegramService;
