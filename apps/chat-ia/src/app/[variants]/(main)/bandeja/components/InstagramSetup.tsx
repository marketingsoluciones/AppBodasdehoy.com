'use client';

import { Alert, Button, Result, Space, Typography } from 'antd';
import { useState } from 'react';

import { disconnectSocial, getSocialOauthUrl } from '../data/channelSetup';

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
      const oauthUrlFromApi = await getSocialOauthUrl('instagram', development);
      // api-ia devuelve oauth_url (snake_case); toleramos oauthUrl por compatibilidad.
      const oauthUrl = oauthUrlFromApi;
      if (oauthUrl) {
        const popup = window.open(oauthUrl, 'instagram-oauth', 'width=600,height=700');
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
    setError(null);
    try {
      await disconnectSocial('instagram', development);
      // El control de 4xx/5xx vive ahora en data/channelSetup, que lanza con el mensaje
      // que devuelve api-ia. Sin ese control, un 404 dejaba la interfaz en "desconectado"
      // mientras el backend seguía conectado (auditoría 27-ago).
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo desconectar');
      setStatus('error');
      return;
    }
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
