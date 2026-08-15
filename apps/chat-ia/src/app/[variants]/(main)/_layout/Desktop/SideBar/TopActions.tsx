'use client';

import { ActionIcon, ActionIconProps, Hotkey } from '@lobehub/ui';
import { BookOpen, Bot, Compass, FolderOpen, Heart, ImagePlus, Images, Inbox, ListChecks, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useInboxUnreadCount } from '@/hooks/useInboxUnreadCount';
import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';
import { SidebarTabKey } from '@/store/global/initialState';
import { useSessionStore } from '@/store/session';
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
  const switchBackToChat = useGlobalStore((s) => s.switchBackToChat);
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.NavigateToChat));

  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';

  const isGuest = useDomainGuestUser();
  const isLoggedIn = !isGuest;

  const isAdmin = useChatStore((s) => s.userRole === 'admin');
  const { enableKnowledgeBase, showMarket, showAiImage } = useServerConfigStore(featureFlagsSelectors);

  const isChatActive = tab === SidebarTabKey.Chat && !isPinned;
  const isMemoriesActive = tab === SidebarTabKey.Memories;

  const pathname = usePathname();
  const isAgentsActive = pathname?.includes('/agentes') ?? false;

  const inboxUnread = useInboxUnreadCount();

  return (
    <Flexbox gap={8}>
      <Link
        aria-label="Asistente"
        href={'/asistente'}
        onClick={(e) => {
          // If Cmd key is pressed, let the default link behavior happen (open in new tab)
          if (e.metaKey || e.ctrlKey) {
            return;
          }

          // Otherwise, prevent default and switch session within the current tab
          e.preventDefault();
          switchBackToChat(useSessionStore.getState().activeId);
        }}
        suppressHydrationWarning
      >
        <ActionIcon
          active={isChatActive}
          icon={MessageSquare}
          size={ICON_SIZE}
          title={
            <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
              {/* R1 nomenclatura: "Chat IA" → "Asistente". */}
              <span>Asistente</span>
              <Hotkey inverseTheme keys={hotkey} />
            </Flexbox>
          }
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {/* Agentes IA (equipo de agentes coworker) — DISTINTO del Asistente (chats IA).
          Rediseño mensajería 13-ago: /agentes no estaba en el sidebar → los agentes no
          se distinguían del asistente. Icono Bot (vs MessageSquare) + gateado a logueados
          (requiere sesión api-ia). */}
      {isLoggedIn && (
        <Link aria-label="Agentes" href={'/agentes'} suppressHydrationWarning>
          <ActionIcon
            active={isAgentsActive}
            icon={Bot}
            size={ICON_SIZE}
            title="Agentes"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {/* Rediseño: "Memories" → "Momentos" (nombre del prototipo; ruta /memories intacta). */}
      <Link aria-label="Momentos" href={'/memories'} suppressHydrationWarning>
        <ActionIcon
          active={isMemoriesActive}
          icon={Images}
          size={ICON_SIZE}
          title="Momentos"
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {/* Generación de imágenes (/image standalone) — gateado por showAiImage.
          NOTA: NO afecta la tool DALL-E del chat (esa la controla `dalle`, intacta). */}
      {showAiImage && (
        <Link aria-label="Estudio" href={'/image'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Image}
            icon={ImagePlus}
            size={ICON_SIZE}
            title="Estudio"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {/* Resto de opciones — solo usuarios registrados */}
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
      {/* Rediseño Fase B (14-ago): "Pendientes" ya no es una segunda bandeja con
          store propio — apunta a la vista "Esperan respuesta" DENTRO de la Bandeja
          (?view=esperan). Misma superficie, filtro no-leídos. Evita la percepción
          de bandejas duplicadas. La ruta /pendientes redirige aquí. */}
      {isServerMode && isLoggedIn && (
        <Link aria-label="Pendientes" href={'/bandeja?view=esperan'} suppressHydrationWarning>
          <div style={{ position: 'relative' }}>
            <ActionIcon
              icon={ListChecks}
              size={ICON_SIZE}
              title="Pendientes"
              tooltipProps={{ placement: 'right' }}
            />
            {inboxUnread > 0 && (
              <span
                style={{
                  alignItems: 'center',
                  background: '#a855f7',
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
      {/* Rediseño: "Archivos" → "Biblioteca" (en Fase C absorberá Conocimiento). Ruta /files intacta. */}
      {isServerMode && isLoggedIn && (
        <Link aria-label="Biblioteca" href={'/files'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Files}
            icon={FolderOpen}
            size={ICON_SIZE}
            title="Biblioteca"
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
