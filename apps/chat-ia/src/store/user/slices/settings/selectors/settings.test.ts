import { HotkeyId } from '@/types/hotkey';
import { GlobalLLMProviderKey } from '@/types/user/settings';

import { UserStore } from '../../../store';
import { settingsSelectors } from './settings';

describe('settingsSelectors', () => {
  describe('currentSettings', () => {
    it('should preserve user-provided values after merging with defaults', () => {
      const s = {
        settings: {
          avatar: 'avatar.jpg',
          fontSize: 14,
          language: 'en-US',
          neutralColor: 'sand',
          password: 'password123',
          primaryColor: 'blue',
          themeMode: 'light',
          defaultAgent: {
            config: {
              systemRole: '',
              model: 'gpt-3.5-turbo',
              params: {},
              tts: {
                showAllLocaleVoice: false,
                sttLocale: 'auto',
                ttsService: 'openai',
                voice: { openai: 'alloy' },
              },
            },
            meta: {
              avatar: 'Default Agent',
              description: 'Default agent for testing',
            },
          },
          tts: {
            openAI: { sttModel: 'whisper-1', ttsModel: 'tts-1' },
            sttAutoStop: true,
            sttServer: 'openai',
          },
          languageModel: {
            openAI: {
              OPENAI_API_KEY: 'openai-api-key',
              endpoint: 'https://openai-endpoint.com',
              models: ['gpt-3.5-turbo'],
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentSettings(s) as any;

      // User-provided values are preserved
      expect(result.avatar).toBe('avatar.jpg');
      expect(result.fontSize).toBe(14);
      expect(result.language).toBe('en-US');
      expect(result.themeMode).toBe('light');
      expect(result.primaryColor).toBe('blue');
      expect(result.neutralColor).toBe('sand');
      expect(result.password).toBe('password123');

      // Deep nested values are preserved
      expect(result.languageModel?.openAI?.OPENAI_API_KEY).toBe('openai-api-key');
      expect(result.tts?.sttAutoStop).toBe(true);
      expect(result.defaultAgent?.config?.model).toBe('gpt-3.5-turbo');
      expect(result.defaultAgent?.meta?.avatar).toBe('Default Agent');
    });
  });

  describe('defaultAgent', () => {
    it('should override defaults with user-provided agent config', () => {
      const s = {
        settings: {
          defaultAgent: {
            config: {
              systemRole: 'user',
              model: 'gpt-3.5-turbo',
            },
            meta: {
              avatar: 'agent-avatar.jpg',
              description: 'Test agent',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgent(s);

      // User overrides
      expect(result.config.systemRole).toBe('user');
      expect(result.config.model).toBe('gpt-3.5-turbo');
      expect(result.meta.avatar).toBe('agent-avatar.jpg');
      expect(result.meta.description).toBe('Test agent');

      // Defaults preserved (user didn't set these)
      expect(result.config.params).toBeDefined();
      expect(result.config.plugins).toEqual([]);
      expect(result.config.tts).toBeDefined();
      expect(result.config.provider).toBe('auto');
    });
  });

  describe('defaultAgentMeta', () => {
    it('should merge user meta overriding defaults', () => {
      const s = {
        settings: {
          defaultAgent: {
            meta: {
              avatar: 'agent-avatar.jpg',
              description: 'Test agent',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgentMeta(s);

      expect(result.avatar).toBe('agent-avatar.jpg');
      expect(result.description).toBe('Test agent');
    });
  });

  describe('currentTTS', () => {
    it('should override TTS defaults with user values', () => {
      const s = {
        settings: {
          tts: {
            sttAutoStop: false,
            openAI: {
              sttModel: 'whisper-2',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentTTS(s);

      // User override
      expect(result.sttAutoStop).toBe(false);
      expect(result.openAI.sttModel).toBe('whisper-2');

      // Defaults preserved
      expect(result.sttServer).toBe('openai');
      expect(result.openAI.ttsModel).toBe('tts-1');
    });
  });

  describe('dalleConfig', () => {
    it('should return the dalle configuration from tool settings', () => {
      const s = {
        settings: {
          tool: {
            dalle: {
              apiKey: 'dalle-api-key',
              autoGenerate: true,
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.dalleConfig(s);

      expect(result).toEqual({
        apiKey: 'dalle-api-key',
        autoGenerate: true,
      });
    });

    it('should return empty object when dalle not configured', () => {
      const s = { settings: {} } as unknown as UserStore;

      const result = settingsSelectors.dalleConfig(s);

      expect(result).toEqual({});
    });
  });

  describe('isDalleAutoGenerating', () => {
    it('should return true when autoGenerate is enabled', () => {
      const s = {
        settings: { tool: { dalle: { autoGenerate: true } } },
      } as unknown as UserStore;

      expect(settingsSelectors.isDalleAutoGenerating(s)).toBe(true);
    });

    it('should return undefined when dalle not configured', () => {
      const s = { settings: {} } as unknown as UserStore;

      expect(settingsSelectors.isDalleAutoGenerating(s)).toBeUndefined();
    });
  });

  describe('providerConfig', () => {
    it('should return the provider config for a given provider id', () => {
      const providerConfig = {
        OPENAI_API_KEY: 'test-key',
        endpoint: 'https://test-endpoint.com',
      };

      const s = {
        settings: { languageModel: { openAI: providerConfig } },
      } as unknown as UserStore;

      const result = settingsSelectors.providerConfig('openAI')(s);

      expect(result).toEqual(providerConfig);
    });

    it('should return undefined if provider does not exist', () => {
      const s = {
        settings: { languageModel: {} },
      } as unknown as UserStore;

      const result = settingsSelectors.providerConfig(
        'nonExistentProvider' as GlobalLLMProviderKey,
      )(s);

      expect(result).toBeUndefined();
    });
  });

  describe('defaultAgentConfig', () => {
    it('should override default config with user-provided values', () => {
      const s = {
        settings: {
          defaultAgent: {
            config: {
              systemRole: 'custom role',
              model: 'gpt-4',
              params: { temperature: 0.7 },
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgentConfig(s);

      // User overrides
      expect(result.systemRole).toBe('custom role');
      expect(result.model).toBe('gpt-4');
      expect(result.params.temperature).toBe(0.7);

      // Defaults preserved
      expect(result.params.frequency_penalty).toBe(0);
      expect(result.params.presence_penalty).toBe(0);
      expect(result.params.top_p).toBe(1);
      expect(result.plugins).toEqual([]);
      expect(result.provider).toBe('auto');
      expect(result.tts).toBeDefined();
      expect(result.chatConfig.enableStreaming).toBe(true);
    });
  });

  describe('exportSettings', () => {
    it('should return the current merged settings', () => {
      const s = {
        defaultSettings: { fontSize: 16 },
        settings: { fontSize: 14, language: 'en-US' },
      } as unknown as UserStore;

      const result = settingsSelectors.exportSettings(s);

      expect(result).toEqual({ fontSize: 14, language: 'en-US' });
    });
  });

  describe('currentSystemAgent', () => {
    it('should override system agent defaults with user values', () => {
      const s = {
        settings: {
          systemAgent: {
            enableAutoReply: true,
            replyMessage: 'Custom auto reply',
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentSystemAgent(s) as any;

      // User overrides
      expect(result.enableAutoReply).toBe(true);
      expect(result.replyMessage).toBe('Custom auto reply');

      // Defaults preserved (system agent sub-configs)
      expect(result.topic).toBeDefined();
      expect(result.translation).toBeDefined();
      expect(result.historyCompress).toBeDefined();
    });
  });

  describe('getHotkeyById', () => {
    it('should return user-defined hotkey config', () => {
      const s = {
        settings: {
          hotkey: {
            newChat: { hotkey: 'ctrl+shift+f', scope: 'global' },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.getHotkeyById('newChat' as HotkeyId)(s);

      expect(result).toEqual({ hotkey: 'ctrl+shift+f', scope: 'global' });
    });

    it('should return undefined for hotkey not defined in settings or defaults', () => {
      const s = { settings: { hotkey: {} } } as unknown as UserStore;

      const result = settingsSelectors.getHotkeyById('newChat' as HotkeyId)(s);

      expect(result).toBeUndefined();
    });
  });
});
