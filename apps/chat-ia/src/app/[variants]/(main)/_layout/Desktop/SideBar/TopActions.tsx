'use client';

import { ActionIcon, ActionIconProps, Hotkey } from '@lobehub/ui';
import { BookOpen, Compass, FolderOpen, Heart, Images, Inbox, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useInboxUnreadCount } from '@/hooks/useInboxUnreadCount';
import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useChatStore } from '@/store/chat';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

// BUG-CW-N16 (informe QA 23-jun 5ª ronda): blockSize 40 estaba por debajo del
// mínimo 44x44px de Apple HIG y 48dp de Material → 18/19 iconos de sidebar
// chat-dev fallaban tap targets en mobile. Subido a 44.
const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 44,
  size: 24,
  strokeWidth: 2,
};

// Rediseño de navegación (informe 14-ago): Discover y Conocimiento son features de LobeChat
// que Bodas NO usa y sólo llenan el rail de opciones. Se ocultan del sidebar (la ruta sigue
// accesible por URL). Reversible poniendo esto a true. Ver plan de rediseño chat-ia.
const SHOW_LOBECHAT_EXTRAS = false;

export interface TopActionProps {
  isPinned?: boolean | null;
  tab?: SidebarTabKey;
}

//  TODO Change icons
const TopActions = memo<TopActionProps>(({ tab, isPinned }) => {
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.NavigateToChat));

  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';

  const isGuest = useDomainGuestUser();
  // Suavizado del "pop-in" del rail (QA 17-ago): los items solo-logueado dependen de
  // useDomainGuestUser, que se resuelve post-mount → en SSR/primer render el rail salía
  // parcial y "completaba" al hidratar. Render OPTIMISTA: hasta montar asumimos logueado
  // (la mayoría de usuarios de chat-dev lo están) → rail completo desde el 1er render, sin
  // pop-in. Un invitado REAL ve los iconos un instante y desaparecen al confirmar. NO es
  // el shell de "Visitante" (eso son UserAvatar/BottomActions, con su propio mounted-gate).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLoggedIn = !mounted || !isGuest;

  const isAdmin = useChatStore((s) => s.userRole === 'admin');
  const { enableKnowledgeBase, showMarket } = useServerConfigStore(featureFlagsSelectors);

  const isChatActive = tab === SidebarTabKey.Chat && !isPinned;
  const isMemoriesActive = tab === SidebarTabKey.Memories;

  const pathname = usePathname();
  const isAgentsActive = pathname?.includes('/agentes') ?? false;

  const inboxUnread = useInboxUnreadCount();

  return (
    <Flexbox gap={8}>
      {/* UNIFICACIÓN Asistente↔Agentes (2-sep, owner): una sola entrada de IA. /agentes ES el
          superconjunto (lista de agentes + chat COMPLETO embebido + Permisos/Ámbito/Sala de control),
          estilo Claude. Logueado → /agentes; invitado → /asistente (el chat, que /agentes requiere
          login). El chat general/inbox sigue alcanzable desde /agentes ("Abrir chat" → /asistente full).
          Antes había DOS entradas (Asistente + Agentes) para la misma entidad → se sentían separadas. */}
      <Link
        aria-label="Asistente"
        href={isLoggedIn ? '/agentes' : '/asistente'}
        suppressHydrationWarning
      >
        <ActionIcon
          active={isChatActive || isAgentsActive}
          icon={MessageSquare}
          size={ICON_SIZE}
          title={
            <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
              <span>Asistente</span>
              <Hotkey inverseTheme keys={hotkey} />
            </Flexbox>
          }
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {/* ORDEN (auditoría nav 16-ago): IA → Mensajes → Automatización → Biblioteca →
          grupo "Boda" → Admin. Bandeja sube al 2º puesto porque el trabajo diario de
          chat-dev es "IA + gestión de mensajes". */}

      {/* 2) Bandeja (Mensajes) */}
      {isServerMode && isLoggedIn && (
        <Link aria-label="Bandeja" href={'/bandeja'} suppressHydrationWarning>
          <div style={{ position: 'relative' }}>
            <ActionIcon
              active={tab === SidebarTabKey.Messages}
              icon={Inbox}
              size={ICON_SIZE}
              title="Bandeja"
              tooltipProps={{ placement: 'right' }}
            />
            {inboxUnread > 0 && (
              <span
                style={{
                  alignItems: 'center',
                  background: '#ef4444',
                  borderRadius: '50%',
                  color: '#fff',
                  display: 'flex',
                  fontSize: 9,
                  fontWeight: 700,
                  height: 14,
                  justifyContent: 'center',
                  lineHeight: 1,
                  minWidth: 14,
                  paddingInline: 2,
                  position: 'absolute',
                  right: 2,
                  top: 2,
                }}
              >
                {inboxUnread > 99 ? '99+' : inboxUnread}
              </span>
            )}
          </div>
        </Link>
      )}
      {/* 3) "Pendientes" del rail RETIRADO (owner 20-ago, opción A): era una vista FILTRADA
          de la Bandeja (?view=esperan) con un badge de no-leídos DUPLICADO del de Bandeja
          (el "99+ en Bandeja Y Pendientes" que marcó QA). El contador de no-leídos vive en
          Bandeja (arriba); "Esperan respuesta" sigue accesible desde dentro de la Bandeja y
          por /bandeja?view=esperan (la ruta /pendientes sigue redirigiendo ahí). REGLA 0: no
          se pierde nada (el badge de no-leídos ya estaba en Bandeja). */}
      {/* 4) Agentes IA — FUSIONADO con "Asistente" (2-sep): eran la MISMA entidad (sesiones
          type='agent'). La entrada "Asistente" de arriba ya lleva a /agentes cuando estás
          logueado (superconjunto: lista + chat + gestión). Se retira esta entrada duplicada.
          /agentes sigue como ruta (deep-links ?agent= y "Gestionar agente" intactos). REGLA 0:
          no se pierde nada — todo alcanzable desde la entrada unificada. */}
      {/* 5) Documentos (Archivos + Conocimiento/RAG en tabs). Ruta /files intacta.
          Renombrado de "Biblioteca"→"Documentos" (1-sep): el rediseño 14-ago escondió
          "Conocimiento" del rail (SHOW_LOBECHAT_EXTRAS=false) y "Biblioteca" no se reconocía
          como el sitio de subir documentos + RAG → el usuario creía que se había perdido. */}
      {isServerMode && isLoggedIn && (
        <Link aria-label="Documentos" href={'/files'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Files}
            icon={FolderOpen}
            size={ICON_SIZE}
            title="Documentos"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}

      {/* ─── Grupo "Boda" (superficies de evento) ─── */}
      {/* 6) Momentos (antes "Memories"; ruta /memories intacta). */}
      <Link aria-label="Momentos" href={'/memories'} suppressHydrationWarning>
        <ActionIcon
          active={isMemoriesActive}
          icon={Images}
          size={ICON_SIZE}
          title="Momentos"
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {/* 7) "Estudio" (/image standalone, DALL-E de LobeChat) RETIRADO del rail (owner 20-ago,
          mejor práctica): Bodas genera imágenes por la TOOL venue-visualizer dentro del chat,
          no por un módulo standalone → entrada redundante. La ruta /image queda (comparte
          componentes con /files, no se borra); solo se quita del rail. */}
      {/* 8) Web de boda (creador) — solo registrados. */}
      {isLoggedIn && isServerMode && (
        <Link aria-label="Web de boda" href={'/wedding-creator'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.WeddingCreator}
            icon={Heart}
            size={ICON_SIZE}
            title="Web de boda"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {SHOW_LOBECHAT_EXTRAS && isLoggedIn && showMarket && (
        <Link aria-label="Discover" href={'/discover'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Discover}
            icon={Compass}
            size={ICON_SIZE}
            title="Discover"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {SHOW_LOBECHAT_EXTRAS && isLoggedIn && enableKnowledgeBase && (
        <Link aria-label="Conocimiento" href={'/knowledge'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Knowledge}
            icon={BookOpen}
            size={ICON_SIZE}
            title="Base de conocimiento"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {isServerMode && isAdmin && (
        <Link aria-label="Admin" href={'/admin'} suppressHydrationWarning>
          <ActionIcon
            icon={ShieldCheck}
            size={ICON_SIZE}
            style={{ color: '#f59e0b' }}
            title="Panel de administración"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
    </Flexbox>
  );
});

export default TopActions;
