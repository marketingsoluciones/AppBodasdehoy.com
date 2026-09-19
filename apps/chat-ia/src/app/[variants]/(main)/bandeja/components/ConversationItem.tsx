'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useTypingInConv } from '@/store/bandeja/selectors';
import { useAgentAssignmentOverrides } from '../hooks/useAgentAssignmentOverrides';
import { Conversation } from '../hooks/useConversations';
import { stripMiniMarkdown } from './MiniMarkdown';
import { FilaConversacion } from './FilaConversacion';
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


// Colores canal (rediseño 18-jul). Solo puntos indicadores, no fondos.
const CHANNEL_DOT: Record<string, string> = {
  email: 'var(--b-text-2)',
  facebook: '#1877F2',
  instagram: '#E1306C',
  sms: 'var(--b-text-2)',
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

  const channelDot = CHANNEL_DOT[conversation.channel] ?? 'var(--b-text-2)';
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
      {/* La MISMA fila que el índice (F4 del informe del owner): antes eran dos componentes
          distintos pintando lo mismo, cada arreglo había que hacerlo dos veces y el que se
          olvidaba producía la sensación de que "los arreglos solo llegan al índice". Lo que
          esta vista añade —menú contextual, presencia, "escribiendo…"— viaja como datos, no
          como otro componente. */}
      <FilaConversacion
        datos={{
          agente: agentName,
          avatar: conversation.contact.name.charAt(0).toUpperCase(),
          canalColor: channelDot,
          canalNombre:
            conversation.channel === 'whatsapp' && conversation.channelType
              ? `WhatsApp · ${CHANNEL_TYPE_LABEL[conversation.channelType] ?? conversation.channelType}`
              : (CHANNEL_NAME[conversation.channel] ?? conversation.channel),
          compartidaCon: conversation.sharedWith,
          conexion: conversation.channel === 'whatsapp' ? conversation.channelType : null,
          contacto,
          escribiendo: isTyping,
          estado: status === 'open' ? null : status,
          hora: formatTimestamp(conversation.lastMessage.timestamp),
          id: conversation.id,
          mensaje: stripMiniMarkdown(conversation.lastMessage.text),
          mensajeMio: !conversation.lastMessage.fromUser,
          nombre: conversation.contact.name,
          presente: isOnline,
          responsable: meta.assignedUserId,
          responsableSoyYo: assignedToMe,
          sinLeer: conversation.unreadCount,
        }}
        development={marca}
        onAbrir={handleClick}
        onCompartir={irACompartir}
        onContextMenu={handleContextMenu}
        seleccionada={isSelected}
      />
      {contextMenu && (
        <div
          className="fixed z-50 w-48 rounded-lg border border-[var(--b-border)] bg-[var(--b-surface)] py-1 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
          ref={menuRef}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            aria-label="Archivar conversación"
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--b-text-2)] hover:bg-[var(--b-surface-2)]"
            onClick={() => handleMenuAction('archive')}
            type="button"
          >
            📦 Archivar
          </button>
          <button
            aria-label={conversationMuted ? 'Activar sonido' : 'Silenciar conversación'}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--b-text-2)] hover:bg-[var(--b-surface-2)]"
            onClick={() => handleMenuAction('mute')}
            type="button"
          >
            {conversationMuted ? '🔔 Activar sonido' : '🔇 Silenciar'}
            <span className="ml-auto text-[10px]" style={{ color: 'var(--b-text-3)' }}>
              solo aquí
            </span>
          </button>
          <div className="my-1 h-px bg-[var(--b-surface-2)]" />
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
