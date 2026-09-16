'use client';

import { Alert, Button, Result, Space, Typography } from 'antd';
import { useState } from 'react';

import { disconnectSocial, getSocialOauthUrl } from '../data/channelSetup';

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
      const oauthUrlFromApi = await getSocialOauthUrl('facebook', development);
      // api-ia devuelve oauth_url (snake_case); toleramos oauthUrl por compatibilidad.
      const oauthUrl = oauthUrlFromApi;
      if (oauthUrl) {
        const popup = window.open(oauthUrl, 'facebook-oauth', 'width=600,height=700');
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
    setError(null);
    try {
      await disconnectSocial('facebook', development);
      // El control de 4xx/5xx vive ahora en data/channelSetup, que lanza con el mensaje
      // que devuelve api-ia. Sin ese control, un 404 dejaba la interfaz en "desconectado"
      // mientras el backend seguía conectado (auditoría 27-ago).
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo desconectar');
      setStatus('error');
      return;
    }
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
