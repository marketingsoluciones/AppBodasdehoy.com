'use client';

import { Alert, Button, Form, Input, Result, Space, Typography } from 'antd';
import { useState } from 'react';

import { buildHeaders } from '../utils/auth';

const { Text, Paragraph } = Typography;

interface EmailSetupProps {
  development: string;
  onConnected?: () => void;
}

type Provider = 'gmail' | 'outlook' | 'smtp';

export function EmailSetup({ development, onConnected }: EmailSetupProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [smtpForm] = Form.useForm();

  const handleOAuth = async (prov: 'gmail' | 'outlook') => {
    setProvider(prov);
    setStatus('connecting');
    setError(null);
    try {
      const res = await fetch('/api/messages/email/oauth-url', {
        body: JSON.stringify({ development, provider: prov }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      if (data.oauthUrl) {
        const popup = window.open(data.oauthUrl, 'email-oauth', 'width=600,height=700');
        if (!popup) throw new Error('Desactiva el bloqueador de popups');
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'EMAIL_OAUTH_SUCCESS') {
            setConnectedEmail(event.data.email || 'Email conectado');
            setStatus('connected');
            onConnected?.();
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'EMAIL_OAUTH_ERROR') {
            setError(event.data.error || 'Error en la autorización');
            setStatus('error');
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error conectando email');
      setStatus('error');
    }
  };

  const handleSmtpConnect = async () => {
    try {
      const values = await smtpForm.validateFields();
      setStatus('connecting');
      setError(null);
      const res = await fetch('/api/messages/email/connect', {
        body: JSON.stringify({
          development,
          imap: { host: values.imapHost || values.smtpHost.replace('smtp', 'imap'), port: Number(values.imapPort || 993) },
          provider: 'smtp',
          smtp: { host: values.smtpHost, pass: values.smtpPass, port: Number(values.smtpPort || 587), user: values.smtpUser },
        }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || `Error ${res.status}`);
      }
      setConnectedEmail(values.smtpUser);
      setStatus('connected');
      onConnected?.();
    } catch (err: any) {
      if (err?.errorFields) return;
      setError(err?.message ?? 'Error conectando SMTP');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/messages/email/disconnect', {
        body: JSON.stringify({ development }),
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        method: 'POST',
      });
    } catch { /* ignore */ }
    setStatus('idle');
    setProvider(null);
    setConnectedEmail(null);
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
          subTitle={connectedEmail ? <Text type="secondary">Cuenta: <Text strong>{connectedEmail}</Text></Text> : undefined}
          title="Email Conectado"
        />
      </div>
    );
  }

  if (provider === 'smtp') {
    return (
      <div style={CENTER}>
        <Space direction="vertical" size="middle" style={{ maxWidth: 380, width: '100%' }}>
          <Text strong style={{ display: 'block', fontSize: 16 }}>Configurar SMTP / IMAP</Text>
          {error && <Alert message={error} showIcon type="error" />}
          <Form form={smtpForm} layout="vertical" size="middle">
            <Form.Item label="SMTP Host" name="smtpHost" rules={[{ required: true }]}>
              <Input placeholder="smtp.ejemplo.com" />
            </Form.Item>
            <Form.Item initialValue="587" label="Puerto SMTP" name="smtpPort">
              <Input placeholder="587" />
            </Form.Item>
            <Form.Item label="Usuario" name="smtpUser" rules={[{ required: true }]}>
              <Input placeholder="email@ejemplo.com" />
            </Form.Item>
            <Form.Item label="Contraseña" name="smtpPass" rules={[{ required: true }]}>
              <Input.Password placeholder="Contraseña" />
            </Form.Item>
            <Form.Item label="IMAP Host (opcional)" name="imapHost">
              <Input placeholder="imap.ejemplo.com" />
            </Form.Item>
            <Form.Item initialValue="993" label="Puerto IMAP" name="imapPort">
              <Input placeholder="993" />
            </Form.Item>
          </Form>
          <Space style={{ width: '100%' }}>
            <Button onClick={() => { setProvider(null); setError(null); }}>Volver</Button>
            <Button
              disabled={status === 'connecting'}
              loading={status === 'connecting'}
              onClick={handleSmtpConnect}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
              type="primary"
            >
              Conectar
            </Button>
          </Space>
        </Space>
      </div>
    );
  }

  return (
    <div style={CENTER}>
      <Space direction="vertical" size="large" style={{ maxWidth: 380, textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 56 }}>📧</div>
        <div>
          <Text strong style={{ display: 'block', fontSize: 18, marginBottom: 8 }}>Conectar Email</Text>
          <Paragraph style={{ margin: 0 }} type="secondary">
            Recibe y responde emails desde tu bandeja de mensajes
          </Paragraph>
        </div>
        {error && <Alert message={error} showIcon type="error" />}
        <Space direction="vertical" size="small" style={{ textAlign: 'left', width: '100%' }}>
          {[
            { icon: '📨', label: 'Gmail', loading: provider === 'gmail' && status === 'connecting', onClick: () => handleOAuth('gmail'), sub: 'Conectar con Google OAuth' },
            { icon: '📬', label: 'Outlook / Office 365', loading: provider === 'outlook' && status === 'connecting', onClick: () => handleOAuth('outlook'), sub: 'Conectar con Microsoft OAuth' },
            { icon: '⚙️', label: 'SMTP / IMAP', loading: false, onClick: () => setProvider('smtp'), sub: 'Configurar servidor manualmente' },
          ].map((opt) => (
            <Button
              block
              disabled={status === 'connecting'}
              key={opt.label}
              loading={opt.loading}
              onClick={opt.onClick}
              style={{ height: 'auto', padding: '10px 16px', textAlign: 'left' }}
            >
              <Space>
                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                <span>
                  <div style={{ fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 400 }}>{opt.sub}</div>
                </span>
              </Space>
            </Button>
          ))}
        </Space>
      </Space>
    </div>
  );
}
