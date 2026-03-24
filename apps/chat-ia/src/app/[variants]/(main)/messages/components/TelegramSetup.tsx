'use client';

import { Alert, Button, Input, Result, Space, Typography } from 'antd';
import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

const { Text, Paragraph } = Typography;

interface TelegramSetupProps {
  development: string;
  onConnected?: () => void;
}

export function TelegramSetup({ development, onConnected }: TelegramSetupProps) {
  const [botToken, setBotToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [botName, setBotName] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!botToken.trim()) return;
    setStatus('connecting');
    setError(null);
    try {
      const res = await fetch('/api/messages/telegram/connect', {
        body: JSON.stringify({ botToken: botToken.trim(), development }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      setBotName(data.botName || data.username || 'Bot conectado');
      setStatus('connected');
      onConnected?.();
    } catch (err: any) {
      setError(err?.message ?? 'Error conectando el bot');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/telegram/disconnect', {
        body: JSON.stringify({ development }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
    } catch { /* ignore */ }
    setStatus('idle');
    setBotToken('');
    setBotName(null);
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
          subTitle={botName ? <Text type="secondary">Bot: <Text strong>@{botName}</Text></Text> : undefined}
          title="Telegram Conectado"
        />
      </div>
    );
  }

  return (
    <div style={CENTER}>
      <Space direction="vertical" size="large" style={{ maxWidth: 380, textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 56 }}>✈️</div>
        <div>
          <Text strong style={{ display: 'block', fontSize: 18, marginBottom: 8 }}>Conectar Telegram</Text>
          <Paragraph style={{ margin: 0 }} type="secondary">
            Crea un bot en{' '}
            <a href="https://t.me/BotFather" rel="noopener noreferrer" target="_blank">@BotFather</a>
            {' '}y pega aquí el token
          </Paragraph>
        </div>
        {error && <Alert message={error} showIcon type="error" />}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            onChange={(e) => setBotToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            size="large"
            value={botToken}
          />
          <Button
            block
            disabled={status === 'connecting' || !botToken.trim()}
            loading={status === 'connecting'}
            onClick={handleConnect}
            size="large"
            style={{ background: '#0088cc', borderColor: '#0088cc' }}
            type="primary"
          >
            Conectar Bot
          </Button>
          <Text style={{ fontSize: 12 }} type="secondary">
            Los mensajes que reciba el bot aparecerán en tu bandeja de entrada
          </Text>
        </Space>
      </Space>
    </div>
  );
}
