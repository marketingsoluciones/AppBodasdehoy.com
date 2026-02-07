/**
 * PostMessageBridge - Comunicacion bidireccional via postMessage
 *
 * Permite comunicacion segura entre:
 * - Pagina /copilot (parent)
 * - Lobe-Chat iframe (copilot-chat)
 * - Preview iframe (copilot-preview)
 */

export type MessageType =
  | 'AUTH_CONFIG'
  | 'AUTH_REQUEST'
  | 'LOBE_CHAT_READY'
  | 'MCP_NAVIGATION'
  | 'MCP_TOOL_CALL'
  | 'MCP_TOOL_RESULT'
  | 'EVENT_CONTEXT'
  | 'REFRESH_PREVIEW'
  | 'NAVIGATE'
  | 'VIEW_MODE_CHANGE';

export type MessageSource = 'copilot-chat' | 'copilot-preview' | 'copilot-parent';

export interface BridgeMessage<T = any> {
  type: MessageType;
  payload: T;
  timestamp: number;
  source: MessageSource;
}

export interface NavigationPayload {
  url: string;
  replace?: boolean;
  eventId?: string;
  toolName?: string;
}

export interface AuthConfigPayload {
  userId: string;
  development: string;
  token: string | null;
  userData: {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  };
  eventId?: string;
  eventName?: string;
}

export interface EventContextPayload {
  eventId: string;
  eventName: string;
  eventType?: string;
}

export interface MCPToolCallPayload {
  toolName: string;
  arguments: Record<string, any>;
  resultUrl?: string;
}

export interface ViewModePayload {
  mode: 'split' | 'chat-full' | 'preview-full';
}

export class PostMessageBridge {
  private listeners: Map<MessageType, Set<(payload: any) => void>> = new Map();
  private targetWindow: Window | null = null;
  private targetOrigin: string = '*';
  private source: MessageSource;
  private boundHandleMessage: (event: MessageEvent) => void;

  constructor(options: {
    source: MessageSource;
    targetWindow?: Window;
    targetOrigin?: string;
  }) {
    this.source = options.source;
    this.targetWindow = options.targetWindow || null;
    this.targetOrigin = options.targetOrigin || '*';
    this.boundHandleMessage = this.handleMessage.bind(this);

    // Escuchar mensajes entrantes
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.boundHandleMessage);
    }
  }

  private handleMessage(event: MessageEvent): void {
    const message = event.data as BridgeMessage;

    // Ignorar mensajes propios
    if (message?.source === this.source) return;

    // Validar estructura basica
    if (!message?.type) return;

    // Validar origen si esta configurado
    if (this.targetOrigin !== '*') {
      if (event.origin !== this.targetOrigin && event.origin !== window.location.origin) {
        console.warn('[PostMessageBridge] Origen no autorizado:', event.origin);
        return;
      }
    }

    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message.payload);
        } catch (error) {
          console.error('[PostMessageBridge] Error en listener:', error);
        }
      });
    }
  }

  /**
   * Enviar mensaje al target window
   */
  send<T>(type: MessageType, payload: T): void {
    const message: BridgeMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source: this.source,
    };

    if (this.targetWindow) {
      this.targetWindow.postMessage(message, this.targetOrigin);
    } else if (typeof window !== 'undefined' && window.parent !== window) {
      // Si estamos en un iframe, enviar al parent
      window.parent.postMessage(message, this.targetOrigin);
    }
  }

  /**
   * Suscribirse a un tipo de mensaje
   */
  on<T>(type: MessageType, callback: (payload: T) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Suscribirse a un tipo de mensaje una sola vez
   */
  once<T>(type: MessageType, callback: (payload: T) => void): () => void {
    const wrappedCallback = (payload: T) => {
      callback(payload);
      this.listeners.get(type)?.delete(wrappedCallback);
    };

    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(wrappedCallback);

    return () => {
      this.listeners.get(type)?.delete(wrappedCallback);
    };
  }

  /**
   * Establecer target window (para enviar mensajes a un iframe)
   */
  setTargetWindow(window: Window, origin?: string): void {
    this.targetWindow = window;
    if (origin) {
      this.targetOrigin = origin;
    }
  }

  /**
   * Verificar si estamos dentro de un iframe
   */
  isInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    return window.parent !== window;
  }

  /**
   * Limpiar listeners y desuscribirse
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.boundHandleMessage);
    }
    this.listeners.clear();
    this.targetWindow = null;
  }
}

// Factory functions para crear bridges preconfigurados

/**
 * Crear bridge para el chat de Lobe-Chat (dentro del iframe)
 */
export const createCopilotChatBridge = (): PostMessageBridge => {
  return new PostMessageBridge({ source: 'copilot-chat' });
};

/**
 * Crear bridge para el preview (dentro del iframe)
 */
export const createCopilotPreviewBridge = (): PostMessageBridge => {
  return new PostMessageBridge({ source: 'copilot-preview' });
};

/**
 * Crear bridge para la pagina parent /copilot
 */
export const createCopilotParentBridge = (): PostMessageBridge => {
  return new PostMessageBridge({ source: 'copilot-parent' });
};

export default PostMessageBridge;
