/**
 * Agent Runtime errors — fuente de verdad MOVIDA a @lobechat/types/agentRuntimeError
 * (2026-05-19) para romper la dep cruzada types ↔ model-runtime.
 *
 * Este archivo re-exporta los símbolos para backward compat con código que
 * importa `from '@lobechat/model-runtime'`. Nuevos consumidores deben importar
 * directamente desde @lobechat/types.
 */
export {
  AgentRuntimeErrorType,
  AGENT_RUNTIME_ERROR_SET,
  type ILobeAgentRuntimeErrorType,
} from '@lobechat/types';

/* eslint-disable sort-keys-fix/sort-keys-fix */
export const StandardErrorType = {
  // ******* Client Error ******* //
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  ContentNotFound: 404,
  MethodNotAllowed: 405,
  TooManyRequests: 429,

  // ******* Server Error ******* //
  InternalServerError: 500,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
} as const;
/* eslint-enable */

export type ErrorType = (typeof StandardErrorType)[keyof typeof StandardErrorType];

import type { ILobeAgentRuntimeErrorType } from '@lobechat/types';

/**
 * 聊天消息错误对象
 */
export interface ChatMessageError {
  body?: any;
  message: string;
  type: ErrorType | ILobeAgentRuntimeErrorType;
}
