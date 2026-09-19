'use client';

import { ChatHeader } from '@lobehub/ui/mobile';
import dynamic from 'next/dynamic';
import { memo, useState } from 'react';

import { INBOX_SESSION_ID } from '@/const/session';
import { useQueryRoute } from '@/hooks/useQueryRoute';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import SettingButton from '../../../features/SettingButton';
import ChatHeaderTitle from './ChatHeaderTitle';

const ShareButton = dynamic(() => import('../../../features/ShareButton'), { ssr: false });

const MobileHeader = memo(() => {
  const router = useQueryRoute();
  const [open, setOpen] = useState(false);

  const { isAgentEditable } = useServerConfigStore(featureFlagsSelectors);

  return (
    <ChatHeader
      center={<ChatHeaderTitle />}
      onBackClick={() =>
        // BUG MÓVIL (22-jul): la flecha "‹" no hacía nada → el usuario quedaba
        // ATRAPADO en el asistente sin barra inferior para llegar a Bandeja.
        // Causa: useShowMobileWorkspace default=true, y el back NO lo ponía a
        // false, así que se seguía viendo el workspace. Fix: showMobileWorkspace
        // false → muestra la LISTA de sesiones + la barra inferior (Chat/Bandeja/Me).
        router.push('/asistente', {
          query: { session: INBOX_SESSION_ID, showMobileWorkspace: false },
          replace: true,
        })
      }
      right={
        <>
          <ShareButton mobile open={open} setOpen={setOpen} />
          {isAgentEditable && <SettingButton mobile />}
        </>
      }
      showBackButton
      style={{ width: '100%' }}
    />
  );
});

export default MobileHeader;
