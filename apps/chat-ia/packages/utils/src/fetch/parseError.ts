import { ChatMessageError, ErrorResponse, ErrorType } from '@lobechat/types';
import { t } from 'i18next';

export const getMessageError = async (response: Response) => {
  let chatMessageError: ChatMessageError;

  // try to get the biz error
  try {
    const data = (await response.json()) as ErrorResponse & { body?: { message?: string; screen_type?: string } };
    const bodyMessage = data.body?.message;
    chatMessageError = {
      body: data.body,
      message: typeof bodyMessage === 'string' && bodyMessage ? bodyMessage : t(`response.${data.errorType}` as any, { ns: 'error' }),
      type: data.errorType,
    };
  } catch {
    // if not return, then it's a common error
    chatMessageError = {
      message: t(`response.${response.status}` as any, { ns: 'error' }),
      type: response.status as ErrorType,
    };
  }

  return chatMessageError;
};
