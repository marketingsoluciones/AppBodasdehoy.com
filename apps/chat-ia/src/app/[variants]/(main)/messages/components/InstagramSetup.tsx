'use client';

import { Alert, Button, Result, Space, Typography } from 'antd';
import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

const { Text, Paragraph } = Typography;

interface InstagramSetupProps {
  development: string;
  onConnected?: () => void;
}

export function InstagramSetup({ development, onConnected }: InstagramSetupProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  const handleConnect = async () => {
    setStatus('connecting');
    setError(null);
    try {
      const res = await fetch('/api/messages/instagram/oauth-url', {
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
        const popup = window.open(data.oauthUrl, 'instagram-oauth', 'width=600,height=700');
        if (!popup) throw new Error('No se pudo abrir la ventana de autorización. Desactiva el bloqueador de popups.');
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'INSTAGRAM_OAUTH_SUCCESS') {
            setAccountName(event.data.accountName || 'Cuenta conectada');
            setStatus('connected');
            onConnected?.();
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'INSTAGRAM_OAUTH_ERROR') {
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
      setError(err?.message ?? 'Error conectando Instagram');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/instagram/disconnect', {
        body: JSON.stringify({ development }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
    } catch { /* ignore */ }
    setStatus('idle');
    setAccountName(null);
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
          subTitle={accountName ? <Text type="secondary">Cuenta: <Text strong>@{accountName}</Text></Text> : undefined}
          title="Instagram Conectado"
        />
      </div>
    );
  }

  return (
    <div style={CENTER}>
      <Space direction="vertical" size="large" style={{ maxWidth: 380, textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 56 }}>📷</div>
        <div>
          <Text strong style={{ display: 'block', fontSize: 18, marginBottom: 8 }}>Conectar Instagram</Text>
          <Paragraph style={{ margin: 0 }} type="secondary">
            Vincula tu cuenta de Instagram Business para recibir y responder mensajes directos
          </Paragraph>
        </div>
        {error && (
          <Alert
            description="Asegúrate de tener una cuenta de Instagram Business vinculada a una página de Facebook."
            message={error}
            showIcon
            type="error"
          />
        )}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Button
            block
            disabled={status === 'connecting'}
            loading={status === 'connecting'}
            onClick={handleConnect}
            size="large"
            style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', border: 'none', color: '#fff' }}
          >
            Conectar con Instagram
          </Button>
          <Text style={{ fontSize: 12 }} type="secondary">
            Necesitas una cuenta de Instagram Business vinculada a una página de Facebook
          </Text>
        </Space>
      </Space>
    </div>
  );
}
