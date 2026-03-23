'use client';

import { useState } from 'react';

interface WebChatSetupProps {
  development: string;
  onConnected?: () => void;
}

export function WebChatSetup({ development, onConnected }: WebChatSetupProps) {
  const [copied, setCopied] = useState(false);

  const chatUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/widget/${development}`
    : `https://chat.bodasdehoy.com/widget/${development}`;

  const embedCode = `<!-- Chat Widget - ${development} -->
<script>
  window.BODAS_CHAT_CONFIG = {
    development: "${development}",
    position: "bottom-right"
  };
</script>
<script src="${chatUrl.replace(`/widget/${development}`, '')}/widget.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 text-6xl">🌐</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Chat Web</h3>
        <p className="mb-6 text-sm text-gray-500">
          Pega este snippet en tu sitio web para que los visitantes puedan chatear contigo.
          El chat detecta automáticamente la página desde la que escriben.
        </p>

        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-900 p-4 text-left">
          <pre className="overflow-x-auto text-xs leading-relaxed text-green-400">
            <code>{embedCode}</code>
          </pre>
        </div>

        <button
          className={`w-full rounded-xl px-6 py-3 font-semibold text-white shadow-md transition-all active:scale-95 ${
            copied
              ? 'bg-green-500'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
          onClick={handleCopy}
          type="button"
        >
          {copied ? 'Copiado!' : 'Copiar código'}
        </button>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
          <p className="mb-2 text-sm font-medium text-blue-900">El widget incluye:</p>
          <ul className="space-y-1 text-xs text-blue-700">
            <li>- Detección automática de la página del visitante</li>
            <li>- Sesión persistente por visitante</li>
            <li>- Los mensajes aparecen en tu bandeja bajo el canal "Web"</li>
            <li>- Responde desde aquí y el visitante lo ve en tiempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
