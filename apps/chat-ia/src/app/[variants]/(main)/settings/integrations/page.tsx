'use client';

import { Alert, Badge, Button, Card, Form, Input, Modal, Skeleton, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { resolveMcpSmmOAuthCallbackUrl } from '@/const/mcpEndpoints';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import {
  disconnectSocialAccount,
  getSocialAccounts,
  initSocialConnect,
  type SMMSocialAccount,
} from '@/services/mcpApi/smm';
import {
  createWhatsAppChannel,
  deleteWhatsAppChannel,
  getWhatsAppChannels,
  type WhatsAppChannel,
} from '@/services/mcpApi/whatsapp';
import { useChatStore } from '@/store/chat';
import { getAuthToken } from '@/utils/authToken';
import { useWhatsAppSession } from '../../messages/hooks/useWhatsAppSession';

const { Title, Text, Paragraph } = Typography;

// ─── QR Modal (antd) ──────────────────────────────────────────────────────────

function QRModal({
  channel,
  development,
  onClose,
}: {
  channel: WhatsAppChannel | null;
  development: string;
  onClose: () => void;
}) {
  const sessionKey = channel?.sessionKey ?? channel?.id ?? development;
  const { connectedAt, disconnectSession, error, loading, phoneNumber, qrCode, startAndRequestPairingCode, startSession, status } =
    useWhatsAppSession(sessionKey);

  const [mode, setMode] = useState<'qr' | 'code'>('qr');
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (status !== 'connected') return;
    const t = window.setTimeout(() => {
      onClose();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [loading, onClose, status]);

  const handleRequestCode = async () => {
    const phone = pairingPhone.replaceAll(/\D/g, '');
    if (phone.length < 9) {
      setPairingError('Introduce un número de teléfono válido con código de país (ej: 34612345678)');
      return;
    }
    setPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);
    try {
      const code = await startAndRequestPairingCode(phone);
      setPairingCode(code);
    } catch (err: any) {
      setPairingError(err?.message ?? 'Error solicitando código. Inténtalo de nuevo.');
    } finally {
      setPairingLoading(false);
    }
  };

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open
      title={
        (() => {
          if (!channel) return 'Conectar WhatsApp';
          const n1 = channel.phoneNumber ? `+${channel.phoneNumber}` : null;
          const n2 = !n1 && phoneNumber ? `+${phoneNumber}` : null;
          const num = n1 || n2;
          const base = channel.name;
          if (!num) return `Conectar: ${base}`;
          if (base.includes(num)) return `Conectar: ${base}`;
          return `Conectar: ${base} · ${num}`;
        })()
      }
      width={440}
    >
      {loading && (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
          <Text type="secondary">Verificando sesión...</Text>
        </div>
      )}

      {!loading && status === 'connected' && (
        <Space direction="vertical" size="middle" style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <div>
            <Text strong>WhatsApp Conectado</Text>
            {phoneNumber && <div><Text type="secondary">+{phoneNumber}</Text></div>}
            {connectedAt && (
              <div><Text style={{ fontSize: 12 }} type="secondary">Desde {new Date(connectedAt).toLocaleString('es-ES')}</Text></div>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>Cerrar</Button>
            <Button danger onClick={async () => { await disconnectSession(); onClose(); }}>Desconectar</Button>
          </Space>
        </Space>
      )}

      {!loading && status === 'qr_ready' && qrCode && mode === 'qr' && (
        <Space direction="vertical" size="middle" style={{ textAlign: 'center', width: '100%' }}>
          <Text type="secondary">Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo</Text>
          <div style={{ border: '3px solid #25D366', borderRadius: 12, display: 'inline-block', padding: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="QR Code WhatsApp" src={qrCode} style={{ height: 208, width: 208 }} />
          </div>
          <Space size={6}>
            <span style={{ background: '#52c41a', borderRadius: '50%', display: 'inline-block', height: 8, width: 8 }} />
            <Text type="secondary">Esperando escaneo...</Text>
          </Space>
          <Space>
            <Button onClick={startSession} size="small">Regenerar QR</Button>
            <Button onClick={() => setMode('code')} size="small" type="link">Usar código en su lugar →</Button>
          </Space>
        </Space>
      )}

      {!loading && status === 'connecting' && (
        <Space direction="vertical" size="middle" style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 40 }}>📱</div>
          <Text strong>Iniciando...</Text>
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
        </Space>
      )}

      {!loading && (status === 'disconnected' || status === 'error') && mode === 'qr' && (
        <Space direction="vertical" size="middle" style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 40 }}>📱</div>
          <div>
            <Text strong>Conectar WhatsApp</Text>
            <div><Text type="secondary">Vincula tu número para gestionar mensajes desde la bandeja</Text></div>
          </div>
          {error && <Alert message={error} showIcon type="error" />}
          <Button
            block
            onClick={startSession}
            size="large"
            style={{ background: '#25D366', borderColor: '#25D366' }}
            type="primary"
          >
            Generar código QR
          </Button>
          <Button onClick={() => setMode('code')} size="small" type="link">
            Conectar con número de teléfono →
          </Button>
        </Space>
      )}

      {/* Modo código de vinculación (pairing code) */}
      {!loading && mode === 'code' && status !== 'connected' && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Vincular por número de teléfono</Text>
            <div><Text style={{ fontSize: 13 }} type="secondary">
              Introduce tu número con código de país. Recibirás un código de 8 dígitos para introducir en WhatsApp → Dispositivos vinculados → Vincular con número de teléfono.
            </Text></div>
          </div>

          {pairingError && <Alert message={pairingError} showIcon type="error" />}

          {pairingCode ? (
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
              <Text style={{ display: 'block', fontSize: 12, marginBottom: 4 }} type="secondary">Tu código de vinculación</Text>
              <Text strong style={{ fontSize: 28, letterSpacing: 6 }}>{pairingCode}</Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12 }} type="secondary">Introdúcelo en WhatsApp antes de que expire (~60s)</Text>
              </div>
            </div>
          ) : (
            <Space.Compact style={{ width: '100%' }}>
              <Input
                onChange={(e) => setPairingPhone(e.target.value)}
                onPressEnter={handleRequestCode}
                placeholder="34612345678 (con código de país, sin +)"
                value={pairingPhone}
              />
              <Button
                loading={pairingLoading}
                onClick={handleRequestCode}
                style={{ background: '#25D366', borderColor: '#25D366' }}
                type="primary"
              >
                Obtener código
              </Button>
            </Space.Compact>
          )}

          <Button onClick={() => { setMode('qr'); setPairingCode(null); setPairingError(null); }} size="small" type="link">
            ← Volver al QR
          </Button>
        </Space>
      )}
    </Modal>
  );
}

// ─── WhatsApp Channel Card ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string; status: 'default' | 'success' | 'processing' | 'error' | 'warning' }> = {
  ACTIVE: { color: 'success', label: 'Conectado', status: 'success' },
  CONNECTING: { color: 'processing', label: 'Conectando', status: 'processing' },
  DISCONNECTED: { color: 'default', label: 'Desconectado', status: 'default' },
  ERROR: { color: 'error', label: 'Error', status: 'error' },
};

const TYPE_LABELS: Record<string, string> = {
  QR_USER: 'QR Personal',
  QR_WHITELABEL: 'QR Whitelabel',
  WAB: 'Meta Business API',
};

function ChannelCard({
  channel,
  onConnect,
  onDelete,
}: {
  channel: WhatsAppChannel;
  onConnect: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CONFIG[channel.status] ?? STATUS_CONFIG.DISCONNECTED;

  return (
    <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <div style={{ alignItems: 'center', background: '#f6ffed', borderRadius: '50%', display: 'flex', fontSize: 20, height: 40, justifyContent: 'center', width: 40 }}>
            📱
          </div>
          <div>
            <Text strong>{channel.name}</Text>
            <div>
              <Badge status={cfg.status} text={cfg.label} />
              <Text style={{ fontSize: 12, marginLeft: 8 }} type="secondary">{TYPE_LABELS[channel.type] ?? channel.type}</Text>
            </div>
            {channel.phoneNumber && <div><Text style={{ fontSize: 12 }} type="secondary">+{channel.phoneNumber}</Text></div>}
          </div>
        </Space>
        <Space>
          {channel.type !== 'WAB' && (
            <Button onClick={onConnect} size="small" style={{ borderColor: '#52c41a', color: '#52c41a' }}>
              {channel.status === 'ACTIVE' ? 'Gestionar' : 'Conectar'}
            </Button>
          )}
          <Button danger onClick={onDelete} size="small">Eliminar</Button>
        </Space>
      </div>
    </Card>
  );
}

// ─── Create Channel Modal ──────────────────────────────────────────────────────

function CreateChannelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (ch: WhatsAppChannel) => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const { name } = await form.validateFields();
      setLoading(true);
      setError(null);
      const ch = await createWhatsAppChannel(name.trim(), 'QR_USER');
      if (ch) {
        onCreate(ch);
        onClose();
      } else {
        setError('No se pudo crear el canal. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      if (err?.errorFields) return; // validation error, handled by form
      setError(err?.message ?? 'Error al crear canal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      confirmLoading={loading}
      okButtonProps={{ style: { background: '#25D366', borderColor: '#25D366' } }}
      okText="Crear canal"
      onCancel={onClose}
      onOk={handleCreate}
      open
      title="Añadir canal WhatsApp"
    >
      {error && <Alert message={error} showIcon style={{ marginBottom: 16 }} type="error" />}
      <Form form={form} layout="vertical">
        <Form.Item
          label="Nombre del canal"
          name="name"
          rules={[{ message: 'Introduce un nombre para el canal', required: true }]}
        >
          <Input placeholder="Ej: WhatsApp principal, Atención al cliente..." />
        </Form.Item>
      </Form>
      <Text style={{ fontSize: 12 }} type="secondary">
        Se creará un canal de tipo QR Personal. Podrás vincular un número escaneando el código QR.
      </Text>
    </Modal>
  );
}

// ─── Social Channel Card (Instagram, Telegram, etc.) ─────────────────────────

function SocialChannelCard({
  channelId,
  description,
  icon,
  name,
  iconBg,
  comingSoon,
  connectedAccount,
  onConnect,
  onDisconnect,
  connectLoading,
}: {
  channelId: string;
  comingSoon?: boolean;
  connectLoading?: boolean;
  connectedAccount?: SMMSocialAccount;
  description: string;
  icon: string;
  iconBg: string;
  name: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const isConnected = !!connectedAccount;

  return (
    <Card size="small" styles={{ body: { padding: '16px' } }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
          <div style={{ alignItems: 'center', background: iconBg, borderRadius: '50%', display: 'flex', fontSize: 18, height: 40, justifyContent: 'center', width: 40 }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space align="center" size={6}>
              <Text strong>{name}</Text>
              {comingSoon && !onConnect && <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>Próximamente</Tag>}
              {isConnected && <Badge color="green" />}
            </Space>
            <div>
              {isConnected
                ? <Text style={{ fontSize: 12 }} type="secondary">@{connectedAccount.username}</Text>
                : <Text style={{ fontSize: 12 }} type="secondary">{description}</Text>
              }
            </div>
          </div>
        </div>
        {onConnect && !isConnected && (
          <Button block loading={connectLoading} onClick={onConnect} size="small" style={{ fontSize: 12 }}>
            Conectar {name} →
          </Button>
        )}
        {isConnected && (
          <Button block danger onClick={onDisconnect} size="small" style={{ fontSize: 12 }}>
            Desconectar
          </Button>
        )}
        {comingSoon && !onConnect && (
          <Link href={`/messages/${channelId}`} style={{ display: 'block' }}>
            <Button block size="small" style={{ fontSize: 12 }}>
              Configurar →
            </Button>
          </Link>
        )}
      </Space>
    </Card>
  );
}

// ─── WhatsApp Direct Session (fallback) ───────────────────────────────────────

function WhatsAppDirectSession({ development }: { development: string }) {
  const { connectedAt, disconnectSession, error, loading, phoneNumber, qrCode, startSession, status } =
    useWhatsAppSession(development);

  if (loading) return <Skeleton active paragraph={{ rows: 2 }} title={false} />;

  if (status === 'connected') {
    return (
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Badge status="success" text="Conectado" />
          {phoneNumber && <Text type="secondary">+{phoneNumber}</Text>}
          {connectedAt && (
            <Text style={{ fontSize: 12 }} type="secondary">
              desde {new Date(connectedAt).toLocaleDateString('es-ES')}
            </Text>
          )}
        </Space>
        <Button danger onClick={disconnectSession} size="small">Desconectar</Button>
      </div>
    );
  }

  if (status === 'qr_ready' && qrCode) {
    return (
      <Space direction="vertical" size="middle" style={{ textAlign: 'center', width: '100%' }}>
        <Text type="secondary">Escanea con WhatsApp → Dispositivos vinculados</Text>
        <div style={{ border: '3px solid #25D366', borderRadius: 12, display: 'inline-block', padding: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="QR WhatsApp" src={qrCode} style={{ height: 192, width: 192 }} />
        </div>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="small" style={{ textAlign: 'center', width: '100%' }}>
      {error && <Alert message={error} showIcon type="error" />}
      <Button
        onClick={startSession}
        size="large"
        style={{ background: '#25D366', borderColor: '#25D366' }}
        type="primary"
      >
        Conectar WhatsApp
      </Button>
    </Space>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function IntegrationsPageInner() {
  const currentUserId = useChatStore((s) => s.currentUserId);
  const development = useChatStore((s) => s.development) || 'bodasdehoy';
  const hasValidJwt = !!getAuthToken();
  const isAuthenticated = !!(hasValidJwt && currentUserId && currentUserId !== 'visitante@guest.local');
  const hasUserButNoJwt = !!(!hasValidJwt && currentUserId && currentUserId !== 'visitante@guest.local');

  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [apiError, setApiError] = useState(false);

  const [qrTarget, setQrTarget] = useState<WhatsAppChannel | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Social accounts (Instagram / Facebook OAuth)
  const [socialAccounts, setSocialAccounts] = useState<SMMSocialAccount[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [smmAlert, setSmmAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);


  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingChannels(false);
      return;
    }
    setLoadingChannels(true);
    getWhatsAppChannels(development)
      .then(setChannels)
      .catch(() => setApiError(true))
      .finally(() => setLoadingChannels(false));
  }, [development, isAuthenticated]);

  const refreshChannels = useCallback(() => {
    if (!isAuthenticated) return;
    getWhatsAppChannels(development)
      .then(setChannels)
      .catch(() => {});
  }, [development, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!channels.some((c) => c.status === 'CONNECTING')) return;
    const id = window.setInterval(() => {
      getWhatsAppChannels(development).then(setChannels).catch(() => {});
    }, 3000);
    return () => window.clearInterval(id);
  }, [channels, development, isAuthenticated]);

  const handleCloseQr = useCallback(() => {
    setQrTarget(undefined);
    refreshChannels();
  }, [refreshChannels]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getSocialAccounts(development).then(setSocialAccounts).catch(() => {});
  }, [development, isAuthenticated]);

  const handleSmmConnect = async (platform: 'INSTAGRAM' | 'FACEBOOK') => {
    setConnectingPlatform(platform);
    // The OAuth callback is handled by API MCP directly — it completes token exchange
    // and sends postMessage back to this window before closing the popup.
    const MCP_OAUTH_CALLBACK = resolveMcpSmmOAuthCallbackUrl();

    try {
      const result = await initSocialConnect(platform, development, MCP_OAUTH_CALLBACK);
      if (!result?.authorization_url) {
        setSmmAlert({ message: 'No se pudo iniciar la conexión. Verifica las credenciales de la app Meta.', type: 'error' });
        setConnectingPlatform(null);
        return;
      }

      // Open OAuth in a popup — MCP callback will postMessage the result back
      const popup = window.open(
        result.authorization_url,
        'smm_oauth',
        'width=600,height=700,left=200,top=100,resizable=yes,scrollbars=yes',
      );

      const onMessage = (event: MessageEvent) => {
        // MCP sends postMessage from any origin (*) — validate type
        if (!event.data || typeof event.data !== 'object') return;
        const { type, platform: plt, username } = event.data as {
          platform?: string;
          type: string;
          username?: string;
        };

        if (type === 'SMM_OAUTH_SUCCESS') {
          window.removeEventListener('message', onMessage);
          popup?.close();
          setSmmAlert({ message: `✅ ${plt ?? platform} conectado: @${username}`, type: 'success' });
          // Reload social accounts to reflect new connection
          getSocialAccounts(development).then(setSocialAccounts).catch(() => {});
          setConnectingPlatform(null);
        } else if (type === 'SMM_OAUTH_ERROR') {
          window.removeEventListener('message', onMessage);
          const errMsg = (event.data as { error?: string }).error ?? 'oauth_error';
          if (errMsg !== 'cancelled') {
            setSmmAlert({ message: `Error al conectar ${platform}: ${errMsg}`, type: 'error' });
          }
          setConnectingPlatform(null);
        }
      };

      window.addEventListener('message', onMessage);

      // Fallback: poll for popup close without receiving a message
      const pollClose = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollClose);
          window.removeEventListener('message', onMessage);
          setConnectingPlatform(null);
        }
      }, 500);
    } catch {
      setSmmAlert({ message: 'Error iniciando OAuth. Inténtalo de nuevo.', type: 'error' });
      setConnectingPlatform(null);
    }
  };

  const handleSmmDisconnect = async (accountId: string) => {
    if (!confirm('¿Desconectar esta cuenta? Perderás acceso a los mensajes de esa cuenta.')) return;
    const ok = await disconnectSocialAccount(accountId);
    if (ok) {
      setSocialAccounts((prev) => prev.filter((a) => a._id !== accountId));
    }
  };

  const handleDelete = async (channelId: string) => {
    if (!confirm('¿Eliminar este canal? Las conversaciones asociadas se mantendrán en el historial.')) return;
    setDeleting(channelId);
    try {
      await deleteWhatsAppChannel(channelId);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
    } finally {
      setDeleting(null);
    }
  };

  const waConnectedCount = channels.filter((c) => c.status === 'ACTIVE').length;
  const instagramAccount = socialAccounts.find((a) => a.platform === 'INSTAGRAM');
  const facebookAccount = socialAccounts.find((a) => a.platform === 'FACEBOOK');

  return (
    <div style={{ margin: '0 auto', maxWidth: 768, padding: '24px 16px' }}>
      {/* Móvil: breadcrumb */}
      <div className="md:hidden" style={{ marginBottom: 20 }}>
        <Link href="/messages">
          <Button size="small" style={{ paddingLeft: 0 }} type="link">← Mensajes</Button>
        </Link>
        <Text type="secondary"> / Integraciones</Text>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: '0 0 4px' }}>Canales de comunicación</Title>
        <Paragraph style={{ margin: 0 }} type="secondary">
          Conecta tus redes sociales y gestiona todos los mensajes desde un único lugar.
        </Paragraph>
      </div>

      {/* Sesión requerida */}
      {!isAuthenticated && (
        <Alert
          action={
            <Link href="/login">
              <Button size="small" type="primary">Iniciar sesión</Button>
            </Link>
          }
          message="Inicia sesión para conectar tus canales."
          showIcon
          style={{ marginBottom: 24 }}
          type="warning"
        />
      )}

      {hasUserButNoJwt && (
        <Alert
          message="Sesión incompleta: hay usuario cargado pero falta el JWT. Vuelve a iniciar sesión para habilitar WhatsApp/SMM y evitar estados mezclados."
          showIcon
          style={{ marginBottom: 16 }}
          type="warning"
        />
      )}

      {/* SMM OAuth feedback */}
      {smmAlert && (
        <Alert
          closable
          message={smmAlert.message}
          onClose={() => setSmmAlert(null)}
          showIcon
          style={{ marginBottom: 16 }}
          type={smmAlert.type}
        />
      )}

      {/* ── Grid unificado de todos los canales ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>

          {/* WhatsApp — gestión completa */}
          <Card size="small" styles={{ body: { padding: 16 } }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
                <div style={{ alignItems: 'center', background: '#f6ffed', borderRadius: '50%', display: 'flex', fontSize: 18, height: 40, justifyContent: 'center', width: 40 }}>
                  📱
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong>WhatsApp</Text>
                  <div>
                    <Text style={{ fontSize: 12 }} type="secondary">
                      {loadingChannels
                        ? 'Cargando...'
                        : waConnectedCount > 0
                          ? `${waConnectedCount} canal${waConnectedCount > 1 ? 'es' : ''} activo${waConnectedCount > 1 ? 's' : ''}`
                          : 'Sin conectar'}
                    </Text>
                    {waConnectedCount > 0 && (
                      <Badge color="green" style={{ marginLeft: 6 }} />
                    )}
                  </div>
                </div>
              </div>
              {isAuthenticated && (
                <Button
                  block
                  onClick={() => setShowCreateModal(true)}
                  size="small"
                  style={waConnectedCount > 0 ? undefined : { borderColor: '#52c41a', color: '#52c41a' }}
                >
                  {waConnectedCount > 0 ? 'Gestionar canales' : '+ Conectar WhatsApp'}
                </Button>
              )}
            </Space>
          </Card>

          <SocialChannelCard
            channelId="instagram"
            connectLoading={connectingPlatform === 'INSTAGRAM'}
            connectedAccount={instagramAccount}
            description="DMs de Instagram Business"
            icon="📷"
            iconBg="linear-gradient(135deg, #f3e7ff, #ffe7f0)"
            name="Instagram"
            onConnect={isAuthenticated ? () => handleSmmConnect('INSTAGRAM') : undefined}
            onDisconnect={instagramAccount ? () => handleSmmDisconnect(instagramAccount._id) : undefined}
          />
          <SocialChannelCard channelId="telegram" comingSoon description="Bot de Telegram" icon="✈️" iconBg="#e6f4ff" name="Telegram" />
          <SocialChannelCard channelId="email" comingSoon description="Gmail, Outlook o SMTP/IMAP" icon="📧" iconBg="#f9f0ff" name="Email" />
          <SocialChannelCard
            channelId="facebook"
            connectLoading={connectingPlatform === 'FACEBOOK'}
            connectedAccount={facebookAccount}
            description="Messenger de tu página FB"
            icon="📘"
            iconBg="#e6f4ff"
            name="Facebook"
            onConnect={isAuthenticated ? () => handleSmmConnect('FACEBOOK') : undefined}
            onDisconnect={facebookAccount ? () => handleSmmDisconnect(facebookAccount._id) : undefined}
          />
          <SocialChannelCard channelId="web" description="Widget embebible en tu web" icon="🌐" iconBg="#fff7e6" name="Chat Web" />
        </div>
      </section>

      {/* ── Gestión detallada de canales WhatsApp ── */}
      {isAuthenticated && (
        <section>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text strong>Canales WhatsApp</Text>
            {!apiError && (
              <Button onClick={() => setShowCreateModal(true)} size="small" style={{ borderColor: '#52c41a', color: '#52c41a' }}>
                + Añadir número
              </Button>
            )}
          </div>

          {loadingChannels && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
            </Space>
          )}

          {!loadingChannels && channels.length === 0 && !apiError && (
            <Card style={{ borderStyle: 'dashed' }} styles={{ body: { padding: '24px', textAlign: 'center' } }}>
              <Text strong>Sin canales WhatsApp</Text>
              <div><Text style={{ fontSize: 13 }} type="secondary">Conecta tu número para recibir mensajes en la bandeja</Text></div>
              <Button
                onClick={() => setShowCreateModal(true)}
                size="small"
                style={{ background: '#25D366', borderColor: '#25D366', marginTop: 12 }}
                type="primary"
              >
                Conectar WhatsApp
              </Button>
            </Card>
          )}

          {!loadingChannels && apiError && (
            <Card>
              <WhatsAppDirectSession development={development} />
            </Card>
          )}

          {!loadingChannels && channels.length > 0 && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {channels.map((ch) => (
                <ChannelCard
                  channel={ch}
                  key={ch.id}
                  onConnect={() => setQrTarget(ch)}
                  onDelete={() => !deleting && handleDelete(ch.id)}
                />
              ))}
            </Space>
          )}
        </section>
      )}

      {qrTarget !== undefined && (
        <QRModal channel={qrTarget} development={development} onClose={handleCloseQr} />
      )}

      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(ch) => setChannels((prev) => [...prev, ch])}
        />
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <>
      <EventosAutoAuth />
      <IntegrationsPageInner />
    </>
  );
}
