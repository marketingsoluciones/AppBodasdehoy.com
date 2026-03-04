'use client';

import { Button, FluentEmoji } from '@lobehub/ui';
import Link from 'next/link';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { MAX_WIDTH } from '@/const/layoutTokens';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';

export type ErrorType = Error & { digest?: string };

interface ErrorCaptureProps {
  error: ErrorType;
  reset: () => void;
}

const ErrorCapture = memo<ErrorCaptureProps>(({ reset }) => {
  // ✅ Usar hook seguro con fallbacks explícitos en español
  const { t } = useSafeTranslation('error');

  // Fallbacks en español si i18n no está disponible o las traducciones fallan
  const title = t('error.title', 'Se ha producido un problema en la página..');
  const desc = t('error.desc', 'Inténtalo de nuevo más tarde, o regresa al mundo conocido');
  const retryText = t('error.retry', 'Reintentar');
  const backHomeText = t('error.backHome', 'Volver a la página de inicio');

  return (
    <Flexbox align={'center'} justify={'center'} style={{ minHeight: '100%', width: '100%' }}>
      <h1
        style={{
          filter: 'blur(8px)',
          fontSize: `min(${MAX_WIDTH / 6}px, 25vw)`,
          fontWeight: 900,
          margin: 0,
          opacity: 0.12,
          position: 'absolute',
          zIndex: 0,
        }}
      >
        ERROR
      </h1>
      <FluentEmoji emoji={'🤧'} size={64} />
      <h2 style={{ fontWeight: 'bold', marginTop: '1em', textAlign: 'center' }}>
        {title}
      </h2>
      <p style={{ marginBottom: '2em' }}>{desc}</p>
      <Flexbox gap={12} horizontal style={{ marginBottom: '1em' }}>
        <Button onClick={() => reset()}>{retryText}</Button>
        <Link href="/">
          <Button type={'primary'}>{backHomeText}</Button>
        </Link>
      </Flexbox>
    </Flexbox>
  );
});

ErrorCapture.displayName = 'ErrorCapture';

export default ErrorCapture;
