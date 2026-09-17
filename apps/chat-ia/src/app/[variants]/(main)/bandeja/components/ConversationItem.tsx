'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useTypingInConv } from '@/store/bandeja/selectors';
import { useAgentAssignmentOverrides } from '../hooks/useAgentAssignmentOverrides';
import { Conversation } from '../hooks/useConversations';
import { useBandejaBrand } from '../utils/brand';
import { stripMiniMarkdown } from './MiniMarkdown';
import { previewText } from '../utils/preview';
import { IaModeBadge, SharedBadge } from './RowIndicators';
import { useConversationActions } from '../hooks/useConversationActions';
import { ConversationStatus, useConversationMeta } from '../hooks/useConversationMeta';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected?: boolean;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

function TypingIndicator() {
  const brand = useBandejaBrand();
  return (
    <span className="inline-flex items-center gap-0.5 text-xs italic" style={{ color: brand.brand }}>
      <span>Escribiendo</span>
      <span className="flex gap-px">
        <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '0ms', backgroundColor: brand.brand }} />
        <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '150ms', backgroundColor: brand.brand }} />
        <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '300ms', backgroundColor: brand.brand }} />
      </span>
    </span>
  );
}

// Colores canal (rediseño 18-jul). Solo puntos indicadores, no fondos.
const CHANNEL_DOT: Record<string, string> = {
  email: '#84848F',
  facebook: '#1877F2',
  instagram: '#E1306C',
  sms: '#84848F',
  telegram: '#2AABEE',
  web: '#6B4EFF',
  whatsapp: '#25D366',
};

// Nombre legible del canal para el chip de la fila (antes solo había un punto de 12px,
// indistinguible de un vistazo — sobre todo WhatsApp vs el punto verde de "en línea").
const CHANNEL_NAME: Record<string, string> = {
  email: 'Email',
  facebook: 'Facebook',
  instagram: 'Instagram',
  sms: 'SMS',
  telegram: 'Telegram',
  web: 'Web',
  whatsapp: 'WhatsApp',
};

// Tipo de línea WhatsApp (api-ia channelType): distinguir de un vistazo QR vs Meta API,
// el nº1 de la auditoría 1-sep. WEB_QR = número personal vinculado por QR (sin ventana 24h);
// WAB = Meta Business API (ventana 24h + plantillas). Otros canales no aplican.
const CHANNEL_TYPE_LABEL: Record<string, string> = {
  WAB: 'Meta API',
  WEB_QR: 'QR',
};

export function ConversationItem({
  conversation,
  isSelected,
}: ConversationItemProps) {
  const brand = useBandejaBrand();
  const router = useRouter();
  const { checkAuth } = useAuthCheck();
  const { development: marca, userId } = checkAuth();
  const { meta } = useConversationMeta(conversation.id);
  const status: ConversationStatus = meta.status ?? 'open';
  const assignedToMe = !!(userId && meta.assignedUserId && meta.assignedUserId === userId);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isMuted, toggleArchive, toggleMute, deleteConversation } = useConversationActions();

  // Simulate presence based on recent activity
  const lastMsgTime = new Date(conversation.lastMessage.timestamp).getTime();
  const minutesAgo = (Date.now() - lastMsgTime) / 60_000;
  const isOnline = minutesAgo < 5;

  // SPRINT 2 iMessage (30-jun): cablear typing real desde el store bandeja.
  // Backend api-ia YA emite `typing` en SSE; el store lo reduce en
  // typingByConv[convId] con expiresAt. Filtramos por currentUserId para
  // NO mostrar "escribiendo…" cuando SOMOS nosotros los que escribimos.
  const typers = useTypingInConv(conversation.id);
  const isTyping = typers.some((t) => !userId || t.userId !== userId);

  // Close context menu on outside click, scroll, or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  const handleClick = () => {
    router.push(
      `/bandeja/${encodeURIComponent(conversation.channel)}/${encodeURIComponent(conversation.id)}`,
    );
  };

  const handleContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const conversationMuted = isMuted(conversation.id);

  const handleMenuAction = (action: string) => {
    setContextMenu(null);
    switch (action) {
      case 'archive': {
        toggleArchive(conversation.id);
        break;
      }
      case 'mute': {
        toggleMute(conversation.id);
        break;
      }
      case 'delete': {
        deleteConversation(conversation.id);
        break;
      }
    }
  };

  const channelDot = CHANNEL_DOT[conversation.channel] ?? '#84848F';
  // Responsable (agente IA) visible EN LA FILA — hallazgo QA 31-ago: "no se ve quién lleva
  // cada conversación". El dato ya llega (api-ia lo espeja); el override optimista cubre los
  // ~120s de caché tras asignar. Suscripción por id → re-render al asignar desde la cabecera.
  const agentOverride = useAgentAssignmentOverrides((st) => st.overrides[conversation.id]);
  const agentName = agentOverride !== undefined
    ? agentOverride.name
    : (conversation.assignedAgentName ?? null);
  // El ✦ que marcaba "hay IA aquí" se retiró el 17-09: decía que la IA operaba, pero no en
  // qué modo, que es lo que hay que saber antes de abrir. Lo sustituye el indicador de modo.

  // El nombre suele SER el teléfono; cuando no, el dato sigue accesible en el tooltip en vez
  // de gastar una tercera línea en cada fila.
  const contacto =
    [conversation.contact.phone, conversation.contact.username]
      .filter(Boolean)
      .filter((v) => v !== conversation.contact.name)
      .join(' · ') || conversation.contact.name;

  const irACompartir = () =>
    router.push(
      `/bandeja/${encodeURIComponent(conversation.channel)}/${encodeURIComponent(conversation.id)}?compartir=1`,
    );

  return (
    <>
      {/* Misma fila que la bandeja principal: dos líneas y 64px. Antes esta lista iba a 95px
          con una tercera línea de chips (canal, tipo de línea, teléfono) que dentro de un
          canal repetía en las noventa filas lo que ya dice la cabecera. El canal lo sigue
          diciendo el punto del avatar; el teléfono, el tooltip del nombre.
          El botón de la fila va DEBAJO del contenido, no envolviéndolo: los indicadores son
          botones y no pueden anidarse dentro de otro. */}
      <div
        className="group relative"
        onContextMenu={handleContextMenu}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = '#FCFCFD';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
        style={{ backgroundColor: isSelected ? '#F2F1F6' : 'transparent' }}
      >
        <button
          aria-label={`Abrir conversación con ${conversation.contact.name}`}
          className="absolute inset-0 h-full w-full"
          onClick={handleClick}
          type="button"
        />
        <div className="pointer-events-none relative flex items-center gap-2.5 px-3 py-1.5 text-left">
          {/* Avatar con punto de canal y presencia */}
          <div className="relative flex-shrink-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
              style={{ backgroundColor: '#F2F1F6', color: '#1C1C22' }}
            >
              {conversation.contact.name.charAt(0).toUpperCase()}
            </div>
            <span
              aria-label={`Canal ${CHANNEL_NAME[conversation.channel] ?? conversation.channel}`}
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
              style={{ backgroundColor: channelDot, boxShadow: '0 0 0 2px #FFFFFF' }}
              title={
                conversation.channel === 'whatsapp' && conversation.channelType
                  ? `WhatsApp · ${CHANNEL_TYPE_LABEL[conversation.channelType] ?? conversation.channelType}`
                  : (CHANNEL_NAME[conversation.channel] ?? conversation.channel)
              }
            />
            {isOnline && (
              <span
                aria-label="En línea"
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#22C55E', boxShadow: '0 0 0 2px #FFFFFF' }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Nombre + estado + hora */}
            <div className="flex items-baseline justify-between gap-2">
              <h3
                className="truncate text-[13px] font-bold"
                style={{ color: '#262131' }}
                title={contacto}
              >
                {conversation.contact.name}
              </h3>
              {status === 'pending' && (
                <span
                  className="flex-none rounded-full px-1.5 text-[10px] font-medium"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                >
                  En espera
                </span>
              )}
              {status === 'closed' && (
                <span
                  className="flex-none rounded-full px-1.5 text-[10px] font-medium"
                  style={{ backgroundColor: '#F2F1F6', color: '#84848F' }}
                >
                  Cerrada
                </span>
              )}
              {assignedToMe && (
                <span
                  className="flex-none rounded-full px-1.5 text-[10px] font-medium"
                  style={{ backgroundColor: brand.brandBg, color: brand.brand }}
                  title="Esta conversación está asignada a ti"
                >
                  Tuya
                </span>
              )}
              <span className="flex-shrink-0 text-[10px]" style={{ color: '#A8A3B5' }}>
                {formatTimestamp(conversation.lastMessage.timestamp)}
              </span>
            </div>

            {/* Mensaje + indicadores (acceso, modo de IA) + no leídos */}
            <div className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                {isTyping ? (
                  <TypingIndicator />
                ) : (
                  <p
                    className="truncate text-[11.5px]"
                    style={{
                      color: conversation.unreadCount > 0 ? '#1C1C22' : '#8B8698',
                      fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                    }}
                  >
                    {!conversation.lastMessage.fromUser && (
                      <span style={{ color: '#9A9AA6' }}>Tú: </span>
                    )}
                    {previewText(stripMiniMarkdown(conversation.lastMessage.text))}
                  </p>
                )}
              </div>
              {agentName && (
                <span
                  aria-label={`Responsable: ${agentName}`}
                  className="inline-flex max-w-[80px] flex-none items-center gap-0.5 truncate rounded-full px-1 text-[10px] font-medium"
                  style={{ backgroundColor: brand.brandBg, color: brand.brand }}
                  title={`Responsable: ${agentName}`}
                >
                  <span aria-hidden>🤖</span>
                  <span className="truncate">{agentName}</span>
                </span>
              )}
              <SharedBadge onManage={irACompartir} sharedWith={conversation.sharedWith} />
              {marca && <IaModeBadge conversationId={conversation.id} development={marca} />}
              {conversation.unreadCount > 0 && (
                <span
                  aria-label={`${conversation.unreadCount} sin leer`}
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: brand.brand, minWidth: 20 }}
                >
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
          ref={menuRef}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            aria-label="Archivar conversación"
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleMenuAction('archive')}
            type="button"
          >
            📦 Archivar
          </button>
          <button
            aria-label={conversationMuted ? 'Activar sonido' : 'Silenciar conversación'}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleMenuAction('mute')}
            type="button"
          >
            {conversationMuted ? '🔔 Activar sonido' : '🔇 Silenciar'}
          </button>
          <div className="my-1 h-px bg-gray-100" />
          <button
            aria-label="Eliminar conversación"
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => handleMenuAction('delete')}
            type="button"
          >
            🗑️ Eliminar
          </button>
        </div>
      )}
    </>
  );
}
