'use client';

import { Alert, Button, Input, Segmented, Space, Spin, theme, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';

import { useWhatsAppSession } from '../hooks/useWhatsAppSession';

const { Title, Text, Paragraph } = Typography;

interface WhatsAppSetupProps {
  development: string;
}

type LinkMode = 'qr' | 'phone';

export function WhatsAppSetup({ development }: WhatsAppSetupProps) {
  const {
    connectedAt,
    disconnectSession,
    error,
    loading,
    phoneNumber,
    qrCode,
    startAndRequestPairingCode,
    startSession,
    status,
  } = useWhatsAppSession(development);

  const router = useRouter();
  const { token } = theme.useToken();

  const [mode, setMode] = useState<LinkMode>('qr');
  const [phone, setPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const handleRequestCode = async () => {
    if (!phone.trim()) return;
    setPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);
    try {
      // Usar el método atómico: desconecta, inicia y pide código antes de que MCP genere QR
      const code = await startAndRequestPairingCode(phone.trim());
      setPairingCode(code);
    } catch (err: any) {
      setPairingError(err?.message ?? 'Error solicitando código');
    } finally {
      setPairingLoading(false);
    }
  };

  const CENTER: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    padding: 32,
  };

  if (loading) {
    return (
      <div style={CENTER}>
        <Space direction="vertical" style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <Text type="secondary">Verificando sesión...</Text>
        </Space>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div style={CENTER}>
        <div
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowTertiary,
            maxWidth: 380,
            padding: '32px 28px',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {/* Insignia verde: círculo de fondo suave con el check, en vez del emoji suelto */}
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(37, 211, 102, 0.12)',
              borderRadius: '50%',
              display: 'inline-flex',
              height: 64,
              justifyContent: 'center',
              marginBottom: 12,
              width: 64,
            }}
          >
            <span style={{ fontSize: 32, lineHeight: 1 }}>✅</span>
          </div>

          {/* color explícito desde el token → legible en claro Y oscuro (antes heredaba blanco) */}
          <Title level={4} style={{ color: token.colorTextHeading, margin: '0 0 6px' }}>
            WhatsApp Conectado
          </Title>

          {/* pill de estado "En línea" */}
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(37, 211, 102, 0.14)',
              borderRadius: 999,
              color: '#1a7f45',
              display: 'inline-flex',
              fontSize: 12,
              fontWeight: 600,
              gap: 6,
              marginBottom: 18,
              padding: '3px 11px',
            }}
          >
            <span
              style={{ background: '#25D366', borderRadius: '50%', height: 7, width: 7 }}
            />
            En línea
          </div>

          {phoneNumber && (
            <div style={{ color: token.colorText, fontSize: 15, marginBottom: 4 }}>
              <span style={{ color: token.colorTextSecondary }}>Número: </span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>+{phoneNumber}</strong>
            </div>
          )}
          {connectedAt && (
            <div style={{ color: token.colorTextTertiary, fontSize: 12, marginBottom: 22 }}>
              Conectado desde {new Date(connectedAt).toLocaleString('es-ES')}
            </div>
          )}

          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Button
              block
              onClick={() => router.push('/bandeja')}
              style={{ background: '#25D366', borderColor: '#25D366' }}
              type="primary"
            >
              Ir a la bandeja
            </Button>
            <Button block danger onClick={disconnectSession} size="small" type="text">
              Desconectar
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  if (status === 'qr_ready' && qrCode && mode === 'qr') {
    return (
      <div style={CENTER}>
        <Space direction="vertical" size="middle" style={{ maxWidth: 360, textAlign: 'center', width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>Añadir número de WhatsApp</Title>
          <Segmented
            onChange={(v) => setMode(v as LinkMode)}
            options={[{ label: 'Código QR', value: 'qr' }, { label: 'Número de teléfono', value: 'phone' }]}
            value={mode}
          />
          <Paragraph style={{ margin: 0 }} type="secondary">
            Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo
          </Paragraph>
          <div style={{ border: '3px solid #25D366', borderRadius: 12, display: 'inline-block', padding: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="QR Code WhatsApp" src={qrCode} style={{ height: 224, width: 224 }} />
          </div>
          <Space size={6}>
            <span style={{ background: '#52c41a', borderRadius: '50%', display: 'inline-block', height: 8, width: 8 }} />
            <Text style={{ fontSize: 13 }} type="secondary">Esperando que escanees el código...</Text>
          </Space>
        </Space>
      </div>
    );
  }

  if (mode === 'phone') {
    return (
      <div style={CENTER}>
        <Space direction="vertical" size="middle" style={{ maxWidth: 360, textAlign: 'center', width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>Añadir número de WhatsApp</Title>
          <Segmented
            onChange={(v) => { setMode(v as LinkMode); setPairingCode(null); setPairingError(null); }}
            options={[{ label: 'Código QR', value: 'qr' }, { label: 'Número de teléfono', value: 'phone' }]}
            value={mode}
          />
          {!pairingCode ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph style={{ margin: 0 }} type="secondary">
                Introduce tu número con código de país. Recibirás un código en WhatsApp.
              </Paragraph>
              {pairingError && <Alert message={pairingError} showIcon type="error" />}
              <Input
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestCode()}
                placeholder="+34 622 440 213"
                size="large"
                type="tel"
                value={phone}
              />
              <Button
                block
                disabled={pairingLoading || !phone.trim()}
                loading={pairingLoading}
                onClick={handleRequestCode}
                size="large"
                style={{ background: '#25D366', borderColor: '#25D366' }}
                type="primary"
              >
                Obtener código
              </Button>
              <Text style={{ fontSize: 12 }} type="secondary">
                Se enviará un código de 8 dígitos a tu WhatsApp
              </Text>
            </Space>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Paragraph style={{ margin: 0 }} type="secondary">
                Abre WhatsApp → Dispositivos vinculados → Vincular con número → Introduce este código:
              </Paragraph>
              <div style={{ border: '2px solid #52c41a', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ color: '#52c41a', fontSize: 28, fontWeight: 700, letterSpacing: '0.3em' }}>{pairingCode}</div>
                <Text style={{ fontSize: 12 }} type="secondary">Válido por ~60 segundos</Text>
              </div>
              <Button onClick={() => { setPairingCode(null); setPhone(''); }} type="link">
                Solicitar nuevo código
              </Button>
            </Space>
          )}
        </Space>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div style={CENTER}>
        <Space direction="vertical" size="middle" style={{ maxWidth: 360, textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 48 }}>📱</div>
          <Title level={4} style={{ margin: 0 }}>Iniciando sesión...</Title>
          <Paragraph style={{ margin: 0 }} type="secondary">Generando código QR, espera un momento</Paragraph>
          <Spin />
          <Space>
            <Button onClick={startSession} size="small" style={{ borderColor: '#25D366', color: '#25D366' }}>
              Reintentar QR
            </Button>
            <Button onClick={() => setMode('phone')} size="small">Vincular por número</Button>
          </Space>
        </Space>
      </div>
    );
  }

  // disconnected / error
  return (
    <div style={CENTER}>
      <Space direction="vertical" size="large" style={{ maxWidth: 360, textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 56 }}>📱</div>
        <div>
          <Title level={4} style={{ margin: '0 0 8px' }}>Añadir número de WhatsApp</Title>
          <Paragraph style={{ margin: 0 }} type="secondary">
            Vincula tu número de WhatsApp para gestionar mensajes directamente desde aquí
          </Paragraph>
        </div>
        {error && <Alert message={error} showIcon type="error" />}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Button
            block
            onClick={startSession}
            size="large"
            style={{ background: '#25D366', borderColor: '#25D366' }}
            type="primary"
          >
            Escanear código QR
          </Button>
          <Button block onClick={() => setMode('phone')} size="large">
            Vincular con número de teléfono
          </Button>
        </Space>
      </Space>
    </div>
  );
}
