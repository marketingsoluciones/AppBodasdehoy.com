import { LobeAgentConfig } from '@/types/agent';

/**
 * Configuración por defecto del agente
 * ====================================
 *
 * Esta configuración establece el comportamiento predeterminado para todos los agentes/sesiones.
 *
 * ✅ enableAutoCreateTopic: TRUE - Auto-genera títulos significativos para las conversaciones
 * ✅ autoCreateTopicThreshold: 2 - Crea título después de 2 mensajes
 */
export const DEFAULT_AGENT_CONFIG: LobeAgentConfig = {
  // 📝 Chat Configuration
  chatConfig: {
    autoCreateTopicThreshold: 2,

    // 📄 Modo de visualización
    displayMode: 'chat' as const,

    // ✨ Auto-generación de títulos de conversación (ACTIVADO)
    enableAutoCreateTopic: true,

    // 📊 Historia de mensajes
    enableHistoryCount: true,

    // 🎛️ Límite de tokens (opcional)
    enableMaxTokens: false,

    historyCount: 8,

    // 'chat' | 'docs'
    // 🔤 Template de input (opcional)
    inputTemplate: '',
  },

  // 🤖 Model Configuration
  // ✅ AUTO por defecto (como Cursor)
  model: 'auto',
  // 🎨 Model Parameters
  params: {
    frequency_penalty: 0,
    presence_penalty: 0,
    temperature: 0.6,
    top_p: 1,
  },

  // 🛠️ Plugins (opcional)
  plugins: [],

  // ✅ AUTO por defecto (como Cursor)
  provider: 'auto',

  // 🎭 System Role
  systemRole: '',

  // 🗣️ TTS Configuration
  tts: {
    showAllLocaleVoice: false,
    sttLocale: 'auto',
    ttsService: 'openai',
    voice: {
      openai: 'alloy',
    },
  },
};

/**
 * Configuración de chat por defecto
 * (Separada para reutilización)
 */
export const DEFAULT_AGENT_CHAT_CONFIG = DEFAULT_AGENT_CONFIG.chatConfig;

/**
 * Configuración de TTS por defecto
 * (Separada para reutilización)
 */
export const DEFAUTT_AGENT_TTS_CONFIG = DEFAULT_AGENT_CONFIG.tts;
