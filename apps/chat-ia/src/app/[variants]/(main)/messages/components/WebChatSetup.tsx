'use client';

import { Alert, Button, Space, Typography } from 'antd';
import { useState } from 'react';

const { Text, Paragraph } = Typography;

interface WebChatSetupProps {
  development: string;
  onConnected?: () => void;
}

export function WebChatSetup({ development, onConnected: _onConnected }: WebChatSetupProps) {
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
    <div style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', padding: 32 }}>
      <Space direction="vertical" size="large" style={{ maxWidth: 440, textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 56 }}>🌐</div>
        <div>
          <Text strong style={{ display: 'block', fontSize: 18, marginBottom: 8 }}>Chat Web</Text>
          <Paragraph style={{ margin: 0 }} type="secondary">
            Pega este snippet en tu sitio web para que los visitantes puedan chatear contigo.
            El chat detecta automáticamente la página desde la que escriben.
          </Paragraph>
        </div>

        <div
          style={{
            borderRadius: 12,
            fontFamily: 'monospace',
            overflow: 'hidden',
            position: 'relative',
            textAlign: 'left',
          }}
        >
          <pre
            style={{
              background: '#1a1a2e',
              borderRadius: 12,
              color: '#4ade80',
              fontSize: 12,
              lineHeight: 1.6,
              margin: 0,
              overflowX: 'auto',
              padding: '16px 20px',
            }}
          >
            <code>{embedCode}</code>
          </pre>
        </div>

        <Button
          block
          onClick={handleCopy}
          size="large"
          style={copied ? { background: '#52c41a', borderColor: '#52c41a' } : {}}
          type={copied ? 'primary' : 'default'}
        >
          {copied ? '¡Copiado!' : 'Copiar código'}
        </Button>

        <Alert
          description={
            <ul style={{ margin: 0, paddingLeft: 16, textAlign: 'left' }}>
              <li>Detección automática de la página del visitante</li>
              <li>Sesión persistente por visitante</li>
              <li>Los mensajes aparecen en tu bandeja bajo el canal &quot;Web&quot;</li>
              <li>Responde desde aquí y el visitante lo ve en tiempo real</li>
            </ul>
          }
          message="El widget incluye:"
          type="info"
        />
      </Space>
    </div>
  );
}
