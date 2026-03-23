'use client';

import { useCallback, useEffect, useState } from 'react';

interface StorageInfo {
  chatDrafts: number;
  conversationActions: number;
  emojiRecents: number;
  totalKeys: number;
  userConfig: boolean;
}

function getStorageInfo(): StorageInfo {
  const info: StorageInfo = {
    chatDrafts: 0,
    conversationActions: 0,
    emojiRecents: 0,
    totalKeys: 0,
    userConfig: false,
  };
  try {
    info.totalKeys = localStorage.length;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('msg-draft-')) info.chatDrafts++;
      if (key === 'inbox_conversation_actions') info.conversationActions++;
      if (key === 'msg-recent-emojis') info.emojiRecents = 1;
      if (key === 'dev-user-config') info.userConfig = true;
    }
  } catch { /* localStorage unavailable */ }
  return info;
}

function SettingCard({ title, description, children }: { children: React.ReactNode, description: string; title: string; }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function AdvancedSettingsPage() {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [confirmClear, setConfirmClear] = useState<string | null>(null);

  useEffect(() => {
    setStorage(getStorageInfo());
    try {
      setDebugMode(localStorage.getItem('debug-mode') === 'true');
    } catch { /* ignore */ }
  }, []);

  const toggleDebug = useCallback(() => {
    const next = !debugMode;
    setDebugMode(next);
    try {
      if (next) {
        localStorage.setItem('debug-mode', 'true');
      } else {
        localStorage.removeItem('debug-mode');
      }
    } catch { /* ignore */ }
  }, [debugMode]);

  const clearDrafts = useCallback(() => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('msg-draft-')) keys.push(key);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      setStorage(getStorageInfo());
      setConfirmClear(null);
    } catch { /* ignore */ }
  }, []);

  const clearConversationActions = useCallback(() => {
    try {
      localStorage.removeItem('inbox_conversation_actions');
      setStorage(getStorageInfo());
      setConfirmClear(null);
    } catch { /* ignore */ }
  }, []);

  const clearEmojiRecents = useCallback(() => {
    try {
      localStorage.removeItem('msg-recent-emojis');
      setStorage(getStorageInfo());
      setConfirmClear(null);
    } catch { /* ignore */ }
  }, []);

  const clearAllLocalData = useCallback(() => {
    try {
      const preserve = ['dev-user-config', 'jwt_token', 'api2_jwt_token'];
      const saved: Record<string, string> = {};
      preserve.forEach((k) => {
        const v = localStorage.getItem(k);
        if (v) saved[k] = v;
      });
      localStorage.clear();
      Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
      setStorage(getStorageInfo());
      setConfirmClear(null);
    } catch { /* ignore */ }
  }, []);

  const exportData = useCallback(() => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) data[key] = localStorage.getItem(key) || '';
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-ia-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, []);

  const importData = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener('load', (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (typeof data === 'object' && data !== null) {
            Object.entries(data).forEach(([k, v]) => {
              if (typeof v === 'string') localStorage.setItem(k, v);
            });
            setStorage(getStorageInfo());
          }
        } catch { /* invalid JSON */ }
      });
      reader.readAsText(file);
    });
    input.click();
  }, []);

  return (
    <div style={{ maxWidth: 640, padding: 24 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Configuración Avanzada</h1>
      <p className="text-sm text-gray-500 mb-6">Gestión de datos locales, depuración y herramientas avanzadas.</p>

      <div className="space-y-4">
        {/* Debug Mode */}
        <SettingCard
          description="Muestra información adicional en consola para diagnóstico de problemas."
          title="Modo Depuración"
        >
          <button
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              debugMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            onClick={toggleDebug}
            type="button"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                debugMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-3 text-sm text-gray-600">{debugMode ? 'Activado' : 'Desactivado'}</span>
        </SettingCard>

        {/* Storage Info */}
        <SettingCard
          description="Datos guardados en este navegador para mejorar tu experiencia."
          title="Almacenamiento Local"
        >
          {storage ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Total claves</div>
                  <div className="text-lg font-bold text-gray-900">{storage.totalKeys}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Borradores</div>
                  <div className="text-lg font-bold text-gray-900">{storage.chatDrafts}</div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { count: storage.chatDrafts, key: 'drafts', label: 'Borradores de mensajes', onClear: clearDrafts },
                  { count: storage.conversationActions, key: 'actions', label: 'Acciones de conversación', onClear: clearConversationActions },
                  { count: storage.emojiRecents, key: 'emojis', label: 'Emojis recientes', onClear: clearEmojiRecents },
                ].map((item) => (
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2" key={item.key}>
                    <div className="text-sm text-gray-700">{item.label}</div>
                    {confirmClear === item.key ? (
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                          onClick={item.onClear}
                          type="button"
                        >
                          Confirmar
                        </button>
                        <button
                          className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
                          onClick={() => setConfirmClear(null)}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                        disabled={item.count === 0}
                        onClick={() => setConfirmClear(item.key)}
                        type="button"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Cargando...</div>
          )}
        </SettingCard>

        {/* Export/Import */}
        <SettingCard
          description="Respalda o restaura tu configuración local."
          title="Exportar / Importar Datos"
        >
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={exportData}
              type="button"
            >
              Exportar JSON
            </button>
            <button
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={importData}
              type="button"
            >
              Importar JSON
            </button>
          </div>
        </SettingCard>

        {/* Danger Zone */}
        <SettingCard
          description="Acciones que eliminan datos permanentemente."
          title="Zona de Peligro"
        >
          {confirmClear === 'all' ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600">Se borrarán todos los datos locales (sesión preservada).</span>
              <button
                className="rounded bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                onClick={clearAllLocalData}
                type="button"
              >
                Confirmar
              </button>
              <button
                className="rounded bg-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-300"
                onClick={() => setConfirmClear(null)}
                type="button"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              onClick={() => setConfirmClear('all')}
              type="button"
            >
              Borrar todos los datos locales
            </button>
          )}
        </SettingCard>
      </div>
    </div>
  );
}
