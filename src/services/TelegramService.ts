import HttpsService from '@services/HttpsService';
import SSMParameterService from '@services/SSMParameterService';

const TelegramService = {
  send: async (
    chatId: number,
    text: string,
    parseMode = 'HTML',
  ) => {
    const telegramBotTokenSsm = process.env.TELEGRAM_BOT_TOKEN_SSM;
    console.log('Request paths from SSM:', telegramBotTokenSsm);
    const telegramBotToken = await SSMParameterService.getParameter(telegramBotTokenSsm) as string;
    console.log('Paths:', telegramBotToken);

    return HttpsService.post(
      {
        hostname: 'api.telegram.org',
        path: `/bot${telegramBotToken}/sendMessage`,
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
