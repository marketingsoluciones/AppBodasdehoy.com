'use client';

import { Alert, Badge, Button, Card, Form, Input, Modal, Skeleton, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import {
  createWhatsAppChannel,
  deleteWhatsAppChannel,
  getWhatsAppChannels,
  type WhatsAppChannel,
} from '@/services/api2/whatsapp';
import { useChatStore } from '@/store/chat';
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
  const sessionKey = channel?.id ?? development;
  const { connectedAt, disconnectSession, error, loading, phoneNumber, qrCode, startSession, status } =
    useWhatsAppSession(sessionKey);

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open
      title={channel ? `Conectar: ${channel.name}` : 'Conectar WhatsApp'}
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

      {!loading && status === 'qr_ready' && qrCode && (
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
        </Space>
      )}

      {!loading && status === 'connecting' && (
        <Space direction="vertical" size="middle" style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 40 }}>📱</div>
          <Text strong>Iniciando...</Text>
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
        </Space>
      )}

      {!loading && (status === 'disconnected' || status === 'error') && (
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
  development: _development,
  onConnect,
  onDelete,
}: {
  channel: WhatsAppChannel;
  development: string;
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
          rules={[{ required: true, message: 'Introduce un nombre para el canal' }]}
        >
          <Input placeholder="Ej: WhatsApp principal, Atención al cliente..." />
        </Form.Item>
      </Form>
      <Text type="secondary" style={{ fontSize: 12 }}>
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
}: {
  channelId: string;
  comingSoon?: boolean;
  description: string;
  icon: string;
  iconBg: string;
  name: string;
}) {
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
              {comingSoon && <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>Próximamente</Tag>}
            </Space>
            <div><Text style={{ fontSize: 12 }} type="secondary">{description}</Text></div>
          </div>
        </div>
        <Link href={`/messages/${channelId}`} style={{ display: 'block' }}>
          <Button block size="small" style={{ fontSize: 12 }}>
            Configurar →
          </Button>
        </Link>
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
  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');

  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [apiError, setApiError] = useState(false);

  const [qrTarget, setQrTarget] = useState<WhatsAppChannel | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingChannels(false);
      return;
    }
    getWhatsAppChannels()
      .then(setChannels)
      .catch(() => setApiError(true))
      .finally(() => setLoadingChannels(false));
  }, [development, isAuthenticated]);

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

  return (
    <div style={{ margin: '0 auto', maxWidth: 768, padding: '24px 16px' }}>
      {/* Móvil: breadcrumb */}
      <div className="md:hidden" style={{ marginBottom: 20 }}>
        <Link href="/messages">
          <Button size="small" type="link" style={{ paddingLeft: 0 }}>← Mensajes</Button>
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

          <SocialChannelCard channelId="instagram" description="DMs de Instagram Business" icon="📷" iconBg="linear-gradient(135deg, #f3e7ff, #ffe7f0)" name="Instagram" comingSoon />
          <SocialChannelCard channelId="telegram" description="Bot de Telegram" icon="✈️" iconBg="#e6f4ff" name="Telegram" comingSoon />
          <SocialChannelCard channelId="email" description="Gmail, Outlook o SMTP/IMAP" icon="📧" iconBg="#f9f0ff" name="Email" comingSoon />
          <SocialChannelCard channelId="facebook" description="Messenger de tu página FB" icon="📘" iconBg="#e6f4ff" name="Facebook" comingSoon />
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
            <Card styles={{ body: { padding: '24px', textAlign: 'center' } }} style={{ borderStyle: 'dashed' }}>
              <Text strong>Sin canales WhatsApp</Text>
              <div><Text type="secondary" style={{ fontSize: 13 }}>Conecta tu número para recibir mensajes en la bandeja</Text></div>
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
                  development={development}
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
        <QRModal channel={qrTarget} development={development} onClose={() => setQrTarget(undefined)} />
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
