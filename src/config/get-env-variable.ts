export const enum EnvVariable {
  IS_OFFLINE= 'IS_OFFLINE',
  TELEGRAM_BOT_TOKEN_SSM = 'TELEGRAM_BOT_TOKEN_SSM',
  TELEGRAM_DEFAULT_CHAT_ID_SSM = 'TELEGRAM_DEFAULT_CHAT_ID_SSM',
  ISTORE_LT_PAGES_SSM = 'ISTORE_LT_PAGES_SSM',
  TELEGRAM_INCOMING_MESSAGE_QUEUE_URL = 'TELEGRAM_INCOMING_MESSAGE_QUEUE_URL',
  TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL = 'TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL',
  PRODUCTS_TABLE_NAME = 'PRODUCTS_TABLE_NAME',
  PHILATELY_PRODUCTS_TABLE_NAME = 'PHILATELY_PRODUCTS_TABLE_NAME',
}

export const getEnvVariable = (name: EnvVariable, isOptional = false): string | never => {
  const value = process.env[name];

  if (!isOptional && !value) {
    throw new Error(`Variable "${name}" is not defined in the environment`);
  }

  return value;
}
