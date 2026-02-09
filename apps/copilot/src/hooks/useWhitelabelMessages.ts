/**
 * Hook para obtener mensajes y features personalizados por marca blanca
 * Consulta el endpoint /api/config/{developer} y extrae messages/features
 */
import { useEffect, useState } from 'react';

import { useChatStore } from '@/store/chat';

// ========================================
// TYPES
// ========================================

export interface WhitelabelMessages {
  assistant_name: string;
  chat_initial: string;
  empty_state: string;
  input_placeholder: string;
  welcome_subtitle: string;
  welcome_title: string;
}

export interface WhitelabelFeatures {
  ai_suggestions: boolean;
  budget_module: boolean;
  calendar_sync: boolean;
  guest_management: boolean;
  photo_gallery: boolean;
  voice_messages: boolean;
  whatsapp_integration: boolean;
}

interface UseWhitelabelResult {
  assistantName: string;
  chatInitial: string;
  emptyState: string;
  error: Error | null;
  features: WhitelabelFeatures;
  inputPlaceholder: string;
  loading: boolean;
  messages: WhitelabelMessages;
  refetch: () => Promise<void>;
  welcomeSubtitle: string;
  welcomeTitle: string;
}

// ========================================
// DEFAULTS
// ========================================

const DEFAULT_MESSAGES: WhitelabelMessages = {
  assistant_name: 'Asistente',
  chat_initial: '¡Hola! ¿En qué puedo ayudarte hoy?',
  empty_state: 'Aún no tienes conversaciones. ¡Empieza a chatear!',
  input_placeholder: 'Escribe tu mensaje...',
  welcome_subtitle: 'Tu asistente inteligente',
  welcome_title: '¡Bienvenido!',
};

const DEFAULT_FEATURES: WhitelabelFeatures = {
  ai_suggestions: true,
  budget_module: true,
  calendar_sync: false,
  guest_management: true,
  photo_gallery: true,
  voice_messages: false,
  whatsapp_integration: true,
};

// ========================================
// CACHE
// ========================================

interface CachedConfig {
  features: WhitelabelFeatures;
  messages: WhitelabelMessages;
}

const configCache = new Map<string, CachedConfig>();

// ========================================
// HOOK PRINCIPAL
// ========================================

/**
 * Hook para obtener mensajes y features personalizados por marca blanca
 *
 * @example
 * ```tsx
 * const { messages, features, assistantName } = useWhitelabelMessages();
 *
 * return (
 *   <div>
 *     <h1>{messages.welcome_title}</h1>
 *     <p>{messages.chat_initial}</p>
 *     {features.whatsapp_integration && <WhatsAppButton />}
 *   </div>
 * );
 * ```
 */
export const useWhitelabelMessages = (): UseWhitelabelResult => {
  const { development } = useChatStore((s) => ({
    development: s.development,
  }));

  const [messages, setMessages] = useState<WhitelabelMessages>(DEFAULT_MESSAGES);
  const [features, setFeatures] = useState<WhitelabelFeatures>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = async () => {
    const developer = development || 'bodasdehoy';

    // Verificar cache
    if (configCache.has(developer)) {
      const cached = configCache.get(developer)!;
      setMessages(cached.messages);
      setFeatures(cached.features);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Usar URL del backend desde env o fallback
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const url = backendUrl ? `${backendUrl}/api/config/${developer}` : `/api/config/${developer}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error fetching config: ${response.statusText}`);
      }

      const data = await response.json();

      // Extraer messages y features con defaults
      const newMessages: WhitelabelMessages = {
        assistant_name: data.messages?.assistant_name || DEFAULT_MESSAGES.assistant_name,
        chat_initial: data.messages?.chat_initial || DEFAULT_MESSAGES.chat_initial,
        empty_state: data.messages?.empty_state || DEFAULT_MESSAGES.empty_state,
        input_placeholder: data.messages?.input_placeholder || DEFAULT_MESSAGES.input_placeholder,
        welcome_subtitle: data.messages?.welcome_subtitle || DEFAULT_MESSAGES.welcome_subtitle,
        welcome_title: data.messages?.welcome_title || DEFAULT_MESSAGES.welcome_title,
      };

      const newFeatures: WhitelabelFeatures = {
        ai_suggestions: data.features?.ai_suggestions ?? DEFAULT_FEATURES.ai_suggestions,
        budget_module: data.features?.budget_module ?? DEFAULT_FEATURES.budget_module,
        calendar_sync: data.features?.calendar_sync ?? DEFAULT_FEATURES.calendar_sync,
        guest_management: data.features?.guest_management ?? DEFAULT_FEATURES.guest_management,
        photo_gallery: data.features?.photo_gallery ?? DEFAULT_FEATURES.photo_gallery,
        voice_messages: data.features?.voice_messages ?? DEFAULT_FEATURES.voice_messages,
        whatsapp_integration:
          data.features?.whatsapp_integration ?? DEFAULT_FEATURES.whatsapp_integration,
      };

      // Guardar en cache
      configCache.set(developer, { features: newFeatures, messages: newMessages });

      setMessages(newMessages);
      setFeatures(newFeatures);
    } catch (err) {
      console.error('Error fetching whitelabel config:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));

      // Usar defaults en caso de error
      setMessages(DEFAULT_MESSAGES);
      setFeatures(DEFAULT_FEATURES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [development]);

  return {
    // Acceso directo a campos comunes
    assistantName: messages.assistant_name,
    chatInitial: messages.chat_initial,
    emptyState: messages.empty_state,
    error,
    features,
    inputPlaceholder: messages.input_placeholder,
    loading,
    messages,
    refetch: fetchConfig,
    welcomeSubtitle: messages.welcome_subtitle,
    welcomeTitle: messages.welcome_title,
  };
};

// ========================================
// HOOKS SIMPLIFICADOS
// ========================================

/**
 * Hook para obtener solo el nombre del asistente
 */
export const useAssistantName = (): string => {
  const { assistantName } = useWhitelabelMessages();
  return assistantName;
};

/**
 * Hook para obtener el mensaje inicial del chat
 */
export const useChatInitialMessage = (): string => {
  const { chatInitial } = useWhitelabelMessages();
  return chatInitial;
};

/**
 * Hook para obtener el mensaje de bienvenida
 */
export const useWelcomeMessage = (): { subtitle: string; title: string } => {
  const { welcomeSubtitle, welcomeTitle } = useWhitelabelMessages();
  return { subtitle: welcomeSubtitle, title: welcomeTitle };
};

/**
 * Hook para verificar si una feature está habilitada
 */
export const useFeatureEnabled = (feature: keyof WhitelabelFeatures): boolean => {
  const { features } = useWhitelabelMessages();
  return features[feature] ?? false;
};

/**
 * Hook para obtener todas las features
 */
export const useWhitelabelFeatures = (): WhitelabelFeatures => {
  const { features } = useWhitelabelMessages();
  return features;
};

/**
 * Limpiar cache de configuración
 */
export const clearWhitelabelCache = () => {
  configCache.clear();
};
