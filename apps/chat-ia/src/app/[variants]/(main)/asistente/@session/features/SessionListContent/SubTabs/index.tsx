'use client';

import { createStyles } from 'antd-style';
import Link from 'next/link';
import { memo } from 'react';

import DefaultMode from '../DefaultMode';

const useStyles = createStyles(({ css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  content: css`
    overflow-y: auto;
    flex: 1;
  `,
}));

// Rediseño mensajería (13-ago): el sidebar del asistente tenía sub-pestañas
// "Conversaciones" (sesiones IA) | "Historial" (conversaciones backend WA/IG). Esa
// segunda pestaña DUPLICABA la bandeja de /bandeja, pero pidiéndola a OTRA API
// (useConversationHistory) → conteos incoherentes y sensación de "bandejas duplicadas".
// Se retira: el asistente muestra SOLO las sesiones de IA; los mensajes de canales
// viven en /bandeja (una sola bandeja, una sola fuente). Link debajo para ir allí.
const SubTabs = memo(() => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      {/* Acceso a la bandeja única de mensajes (WA/IG/Web) — no se duplica aquí. */}
      <Link
        href="/bandeja"
        style={{
          alignItems: 'center',
          color: '#7C3AED',
          display: 'flex',
          fontSize: 11,
          fontWeight: 600,
          gap: 6,
          justifyContent: 'center',
          padding: '8px 12px',
          textDecoration: 'none',
        }}
      >
        📥 Ver bandeja de mensajes →
      </Link>

      {/* Solo sesiones de IA. */}
      <div className={styles.content}>
        <DefaultMode />
      </div>
    </div>
  );
});

SubTabs.displayName = 'SubTabs';

export default SubTabs;
