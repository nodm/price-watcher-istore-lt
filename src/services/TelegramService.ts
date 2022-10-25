import HttpsService from '@services/HttpsService';

const TelegramService = {
  send: (
    chatId: number,
    text: string,
    parseMode = 'MarkdownV2',
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
};

export default TelegramService;
