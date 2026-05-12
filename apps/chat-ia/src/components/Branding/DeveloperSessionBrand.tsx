'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { BrandLogo } from '@bodasdehoy/shared/components';

import { useDeveloperBranding } from '@/hooks/useDeveloperBranding';
import { useChatStore } from '@/store/chat';
import { resolveDisplayBrandName } from '@/utils/brandingDisplay';
import { resolveActiveDeveloperForBranding } from '@/utils/developmentDetector';

const useStyles = createStyles(({ css }) => ({
  root: css`
    min-width: 0;
    flex: 1;
    max-width: 100%;
  `,
  subtitle: css`
    font-size: 10px;
    font-weight: 500;
    line-height: 1.15;
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  title: css`
    font-size: 13px;
    font-weight: 600;
    line-height: 1.15;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

export interface DeveloperSessionBrandProps {
  className?: string;
  /** Alto orientativo de la fila (px) */
  size?: number;
}

/**
 * Marca en el panel de sesiones: nombre del developer (API/config) + subtítulo "IA · {slug}".
 * Evita el logotipo genérico upstream y encaja en anchos estrechos con ellipsis.
 */
export const DeveloperSessionBrand = memo<DeveloperSessionBrandProps>(({ className, size = 36 }) => {
  const { styles, cx } = useStyles();
  const { branding, loading } = useDeveloperBranding();
  const storeDevelopment = useChatStore((s) => s.development);
  const slug = resolveActiveDeveloperForBranding(storeDevelopment);

  const title = resolveDisplayBrandName(branding?.name, branding?.developer || slug);
  const subtitle = `IA · ${slug}`;

  if (loading && !branding) {
    return (
      <Flexbox
        className={cx(styles.root, className)}
        justify={'center'}
        style={{ height: size }}
      >
        <div
          className={styles.title}
          style={{
            background: 'currentColor',
            borderRadius: 4,
            height: 12,
            opacity: 0.2,
            width: 80,
          }}
        />
      </Flexbox>
    );
  }

  const logoUrl = branding?.logo?.trim();

  return (
    <Flexbox
      align={'center'}
      className={cx(styles.root, className)}
      gap={8}
      horizontal
      style={{ minHeight: size }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="h-7 w-7 shrink-0 rounded-md object-contain"
          height={28}
          src={logoUrl}
          width={28}
        />
      ) : (
        <BrandLogo development={slug} size={28} />
      )}
      <Flexbox gap={2} justify={'center'} style={{ flex: 1, minWidth: 0 }}>
        <div className={styles.title} title={`${title} — ${subtitle}`}>
          {title}
        </div>
        <div className={styles.subtitle} title={subtitle}>
          {subtitle}
        </div>
      </Flexbox>
    </Flexbox>
  );
});

DeveloperSessionBrand.displayName = 'DeveloperSessionBrand';
