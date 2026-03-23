'use client';

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

// ─── QR Modal ────────────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {channel ? `Conectar: ${channel.name}` : 'Conectar WhatsApp'}
          </h3>
          <button
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="py-8 text-center">
              <div className="mb-2 text-4xl">⏳</div>
              <p className="text-sm text-gray-500">Verificando sesión...</p>
            </div>
          )}

          {!loading && status === 'connected' && (
            <div className="text-center">
              <div className="mb-3 text-5xl">✅</div>
              <p className="mb-1 text-base font-semibold text-gray-900">WhatsApp Conectado</p>
              {phoneNumber && <p className="text-sm text-gray-600">+{phoneNumber}</p>}
              {connectedAt && (
                <p className="mt-1 text-xs text-gray-400">
                  Desde {new Date(connectedAt).toLocaleString('es-ES')}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  onClick={onClose}
                  type="button"
                >
                  Cerrar
                </button>
                <button
                  className="flex-1 rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    await disconnectSession();
                    onClose();
                  }}
                  type="button"
                >
                  Desconectar
                </button>
              </div>
            </div>
          )}

          {!loading && status === 'qr_ready' && qrCode && (
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-500">
                Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo
              </p>
              <div className="mb-4 inline-block rounded-2xl border-4 border-green-500 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="QR Code WhatsApp" className="h-52 w-52" src={qrCode} />
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
                Esperando escaneo...
              </div>
            </div>
          )}

          {!loading && status === 'connecting' && (
            <div className="py-8 text-center">
              <div className="mb-4 text-5xl">📱</div>
              <p className="mb-1 text-base font-semibold text-gray-900">Iniciando...</p>
              <div className="mt-3 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    className="inline-block h-2 w-2 animate-bounce rounded-full bg-green-400"
                    key={i}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && (status === 'disconnected' || status === 'error') && (
            <div className="text-center">
              <div className="mb-4 text-5xl">📱</div>
              <p className="mb-2 text-base font-semibold text-gray-900">Conectar WhatsApp</p>
              <p className="mb-6 text-sm text-gray-500">
                Vincula tu número para gestionar mensajes desde la bandeja de entrada
              </p>
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <button
                className="w-full rounded-xl bg-green-500 py-3 font-semibold text-white hover:bg-green-600"
                onClick={startSession}
                type="button"
              >
                Generar código QR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Channel Card ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; dot: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Conectado' },
  CONNECTING: { bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500 animate-pulse', label: 'Conectando' },
  DISCONNECTED: { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: 'Desconectado' },
  ERROR: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Error' },
};

const TYPE_LABELS: Record<string, string> = {
  QR_USER: 'QR Personal',
  QR_WHITELABEL: 'QR Whitelabel',
  WAB: 'Meta Business API',
};

function ChannelCard({
  channel,
  development,
  onConnect,
  onDelete,
}: {
  channel: WhatsAppChannel;
  development: string;
  onConnect: () => void;
  onDelete: () => void;
}) {
  const badge = STATUS_BADGE[channel.status] ?? STATUS_BADGE.disconnected;

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">
          📱
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{channel.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
            <span className="text-xs text-gray-400">{TYPE_LABELS[channel.type] ?? channel.type}</span>
          </div>
          {channel.phoneNumber && (
            <p className="mt-0.5 text-xs text-gray-500">+{channel.phoneNumber}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {channel.type !== 'WAB' && (
          <button
            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
            onClick={onConnect}
            type="button"
          >
            {channel.status === 'ACTIVE' ? 'Gestionar' : 'Conectar'}
          </button>
        )}
        <button
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          onClick={onDelete}
          type="button"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ─── Create Channel Modal ─────────────────────────────────────────────────────

function CreateChannelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (ch: WhatsAppChannel) => void;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const ch = await createWhatsAppChannel(name.trim(), 'QR_USER');
      if (ch) {
        onCreate(ch);
        onClose();
      } else {
        setError('No se pudo crear el canal. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear canal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Añadir canal WhatsApp</h3>
          <button
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre del canal
          </label>
          <input
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Ej: WhatsApp principal, Atención al cliente..."
            type="text"
            value={name}
          />
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Se creará un canal de tipo QR Personal. Podrás vincular un número escaneando el código QR.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex-1 rounded-lg bg-green-500 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
              disabled={loading || !name.trim()}
              onClick={handleCreate}
              type="button"
            >
              {loading ? 'Creando...' : 'Crear canal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Canal card genérico (Instagram, Telegram, Email, Facebook, Web) ──────────

function SocialChannelCard({
  channelId,
  description,
  icon,
  name,
  accent,
}: {
  accent: string;
  channelId: string;
  description: string;
  icon: string;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${accent}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <a
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
        href={`/messages/${channelId}`}
      >
        Configurar →
      </a>
    </div>
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

  const [qrTarget, setQrTarget] = useState<WhatsAppChannel | 'new' | undefined>(undefined);
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
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      {/* Móvil: breadcrumb */}
      <div className="mb-5 flex items-center gap-3 text-sm text-gray-500 md:hidden">
        <Link className="font-medium text-pink-600 hover:underline" href="/messages">
          ← Mensajes
        </Link>
        <span>/</span>
        <span>Integraciones</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Canales de comunicación</h1>
        <p className="mt-1 text-sm text-gray-500">
          Conecta tus redes sociales y gestiona todos los mensajes desde un único lugar.
        </p>
      </div>

      {/* Sesión requerida */}
      {!isAuthenticated && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-6 text-center">
          <p className="mb-2 text-sm font-medium text-gray-800">Sesión requerida</p>
          <p className="mb-4 text-sm text-gray-600">
            Inicia sesión para conectar tus canales.
          </p>
          <Link
            className="inline-flex rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            href="/login"
          >
            Iniciar sesión
          </Link>
        </div>
      )}

      {/* ── Grid unificado de todos los canales ── */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {/* WhatsApp — gestión completa inline */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">
                📱
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                <p className="text-xs text-gray-500">
                  {loadingChannels
                    ? 'Cargando...'
                    : waConnectedCount > 0
                      ? `${waConnectedCount} canal${waConnectedCount > 1 ? 'es' : ''} activo${waConnectedCount > 1 ? 's' : ''}`
                      : 'Sin conectar'}
                </p>
              </div>
              {waConnectedCount > 0 && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
              )}
            </div>
            {isAuthenticated && (
              <button
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                {waConnectedCount > 0 ? 'Gestionar canales' : '+ Conectar WhatsApp'}
              </button>
            )}
          </div>

          {/* Otros canales */}
          <SocialChannelCard accent="bg-gradient-to-br from-purple-100 to-pink-100" channelId="instagram" description="DMs de Instagram Business" icon="📷" name="Instagram" />
          <SocialChannelCard accent="bg-blue-100" channelId="telegram" description="Bot de Telegram" icon="✈️" name="Telegram" />
          <SocialChannelCard accent="bg-purple-100" channelId="email" description="Gmail, Outlook o SMTP/IMAP" icon="📧" name="Email" />
          <SocialChannelCard accent="bg-blue-100" channelId="facebook" description="Messenger de tu página FB" icon="📘" name="Facebook" />
          <SocialChannelCard accent="bg-orange-100" channelId="web" description="Widget embebible en tu web" icon="🌐" name="Chat Web" />
        </div>
      </section>

      {/* ── Gestión detallada de canales WhatsApp ── */}
      {isAuthenticated && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Canales WhatsApp</h2>
            {!apiError && (
              <button
                className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                + Añadir número
              </button>
            )}
          </div>

          {loadingChannels && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div className="h-16 animate-pulse rounded-xl bg-gray-100" key={i} />
              ))}
            </div>
          )}

          {!loadingChannels && channels.length === 0 && !apiError && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="mb-1 text-sm font-medium text-gray-600">Sin canales WhatsApp</p>
              <p className="mb-3 text-xs text-gray-400">
                Conecta tu número para recibir mensajes en la bandeja
              </p>
              <button
                className="rounded-xl bg-green-500 px-4 py-2 text-xs font-semibold text-white hover:bg-green-600"
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                Conectar WhatsApp
              </button>
            </div>
          )}

          {!loadingChannels && apiError && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <WhatsAppDirectSession development={development} />
            </div>
          )}

          {!loadingChannels && channels.length > 0 && (
            <div className="space-y-2">
              {channels.map((ch) => (
                <ChannelCard
                  channel={ch}
                  development={development}
                  key={ch.id}
                  onConnect={() => setQrTarget(ch)}
                  onDelete={() => !deleting && handleDelete(ch.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* QR Modal */}
      {qrTarget !== undefined && qrTarget !== 'new' && (
        <QRModal
          channel={qrTarget}
          development={development}
          onClose={() => setQrTarget(undefined)}
        />
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(ch) => setChannels((prev) => [...prev, ch])}
        />
      )}
    </div>
  );
}

// WhatsApp direct session (fallback when GraphQL not available)
function WhatsAppDirectSession({ development }: { development: string }) {
  const { connectedAt, disconnectSession, error, loading, phoneNumber, qrCode, startSession, status } =
    useWhatsAppSession(development);

  if (loading) return <p className="text-sm text-gray-400">Verificando...</p>;

  if (status === 'connected') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Conectado
          </span>
          {phoneNumber && <span className="text-sm text-gray-600">+{phoneNumber}</span>}
          {connectedAt && (
            <span className="text-xs text-gray-400">
              desde {new Date(connectedAt).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>
        <button
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          onClick={disconnectSession}
          type="button"
        >
          Desconectar
        </button>
      </div>
    );
  }

  if (status === 'qr_ready' && qrCode) {
    return (
      <div className="text-center">
        <p className="mb-3 text-sm text-gray-500">Escanea con WhatsApp → Dispositivos vinculados</p>
        <div className="inline-block rounded-xl border-4 border-green-500 p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="QR WhatsApp" className="h-48 w-48" src={qrCode} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
      <button
        className="rounded-xl bg-green-500 px-6 py-2.5 font-semibold text-white hover:bg-green-600"
        onClick={startSession}
        type="button"
      >
        Conectar WhatsApp
      </button>
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
