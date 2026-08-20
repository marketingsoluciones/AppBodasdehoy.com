'use client';

import { ActionIcon } from '@lobehub/ui';
import {
  Bot,
  Maximize2,
  Minimize2,
  PanelLeftRightDashedIcon,
  SquareChartGanttIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';

import SettingButton from '../../../features/SettingButton';

const ShareButton = dynamic(() => import('../../../features/ShareButton'), { ssr: false });

const HeaderAction = memo<{ className?: string }>(({ className }) => {
  const { t } = useTranslation('chat');
  const [wideScreen, isFullscreen, toggleWideScreen, toggleFullscreen] = useGlobalStore((s) => [
    systemStatusSelectors.wideScreen(s),
    systemStatusSelectors.isFullscreen(s),
    s.toggleWideScreen,
    s.toggleFullscreen,
  ]);

  const { isAgentEditable } = useServerConfigStore(featureFlagsSelectors);

  // Fusión Agentes↔Asistente (round-trip): el agente activo del chat y su ficha en
  // /agentes son la MISMA entidad (session type='agent'). Enlace de vuelta "Gestionar
  // agente" → /agentes?agent=<activeId> (deep-link que preselecciona ese agente). Junto
  // con "Abrir chat" de /agentes, cierra el círculo → se sienten como un solo espacio.
  // Solo en server-mode y si NO es el inbox (el inbox no es un agente gestionable).
  const activeId = useSessionStore((s) => s.activeId);
  const isInbox = useSessionStore(sessionSelectors.isInboxSession);
  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';

  return (
    <Flexbox className={className} gap={4} horizontal>
      {isServerMode && !isInbox && activeId && (
        <Link
          aria-label="Gestionar agente"
          href={`/agentes?agent=${encodeURIComponent(activeId)}`}
        >
          <ActionIcon
            icon={Bot}
            size={DESKTOP_HEADER_ICON_SIZE}
            title="Gestionar agente"
            tooltipProps={{ placement: 'bottom' }}
          />
        </Link>
      )}
      <ActionIcon
        icon={wideScreen ? SquareChartGanttIcon : PanelLeftRightDashedIcon}
        onClick={() => toggleWideScreen()}
        size={DESKTOP_HEADER_ICON_SIZE}
        title={t(wideScreen ? 'toggleWideScreen.off' : 'toggleWideScreen.on')}
        tooltipProps={{
          placement: 'bottom',
        }}
      />
      <ShareButton />
      <ActionIcon
        icon={isFullscreen ? Minimize2 : Maximize2}
        onClick={() => toggleFullscreen()}
        size={DESKTOP_HEADER_ICON_SIZE}
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        tooltipProps={{
          placement: 'bottom',
        }}
      />
      {isAgentEditable && <SettingButton />}
    </Flexbox>
  );
});

export default HeaderAction;
