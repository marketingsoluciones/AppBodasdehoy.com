'use client';

import { Alert, Button, Result, Space, Typography } from 'antd';
import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

const { Text, Paragraph } = Typography;

interface FacebookSetupProps {
  development: string;
  onConnected?: () => void;
}

export function FacebookSetup({ development, onConnected }: FacebookSetupProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pageName, setPageName] = useState<string | null>(null);

  const handleConnect = async () => {
    setStatus('connecting');
    setError(null);
    try {
      const res = await fetch('/api/messages/facebook/oauth-url', {
        body: JSON.stringify({ development }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      if (data.oauthUrl) {
        const popup = window.open(data.oauthUrl, 'facebook-oauth', 'width=600,height=700');
        if (!popup) throw new Error('No se pudo abrir la ventana de autorización. Desactiva el bloqueador de popups.');
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'FACEBOOK_OAUTH_SUCCESS') {
            setPageName(event.data.pageName || 'Página conectada');
            setStatus('connected');
            onConnected?.();
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'FACEBOOK_OAUTH_ERROR') {
            setError(event.data.error || 'Error en la autorización');
            setStatus('error');
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      } else {
        throw new Error('No se recibió URL de autorización');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error conectando Facebook');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/facebook/disconnect', {
        body: JSON.stringify({ development }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
    } catch { /* ignore */ }
    setStatus('idle');
    setPageName(null);
  };

  const CENTER: React.CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    padding: 32,
  };

  if (status === 'connected') {
    return (
      <div style={CENTER}>
        <Result
          extra={<Button danger onClick={handleDisconnect} size="small">Desconectar</Button>}
          status="success"
          subTitle={pageName ? <Text type="secondary">Página: <Text strong>{pageName}</Text></Text> : undefined}
          title="Facebook Conectado"
        />
      </div>
    );
  }

  return (
    <div style={CENTER}>
      <Space direction="vertical" size="large" style={{ maxWidth: 380, textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 56 }}>📘</div>
        <div>
          <Text strong style={{ display: 'block', fontSize: 18, marginBottom: 8 }}>Conectar Facebook Messenger</Text>
          <Paragraph style={{ margin: 0 }} type="secondary">
            Vincula tu página de Facebook para recibir y responder mensajes de Messenger
          </Paragraph>
        </div>
        {error && <Alert message={error} showIcon type="error" />}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Button
            block
            disabled={status === 'connecting'}
            loading={status === 'connecting'}
            onClick={handleConnect}
            size="large"
            style={{ background: '#1877f2', borderColor: '#1877f2' }}
            type="primary"
          >
            Conectar con Facebook
          </Button>
          <Text style={{ fontSize: 12 }} type="secondary">
            Necesitas ser administrador de la página de Facebook que deseas conectar
          </Text>
        </Space>
      </Space>
    </div>
  );
}
