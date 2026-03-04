'use client';

import { LobeHub } from '@lobehub/ui/brand';
import { createStyles } from 'antd-style';
import Link from 'next/link';
import { memo } from 'react';
import { Flexbox, FlexboxProps } from 'react-layout-kit';

import { ORG_NAME } from '@/const/branding';
import { UTM_SOURCE } from '@/const/url';
import { isCustomORG } from '@/const/version';
import { useDeveloperBranding } from '@/hooks/useDeveloperBranding';

const useStyles = createStyles(({ token, css }) => ({
  developerLogo: css`
    width: auto;
    max-height: 20px;
    object-fit: contain;
  `,
  developerName: css`
    font-weight: 600;
    text-transform: capitalize;
  `,
  logoLink: css`
    line-height: 1;
    color: inherit;

    &:hover {
      color: ${token.colorLink};
    }
  `,
}));

const BrandWatermark = memo<Omit<FlexboxProps, 'children'>>(({ style, ...rest }) => {
  const { styles, theme } = useStyles();
  const { branding, loading } = useDeveloperBranding();

  // Si el developer tiene logo, mostrarlo
  if (!loading && branding?.logo) {
    return (
      <Flexbox
        align={'center'}
        dir={'ltr'}
        flex={'none'}
        gap={4}
        horizontal
        style={{ color: theme.colorTextDescription, fontSize: 12, ...style }}
        {...rest}
      >
        <span>Powered by</span>
        {branding.logo && (
          <img
            alt={branding.name}
            className={styles.developerLogo}
            src={branding.logo}
            style={{ maxHeight: 20 }}
          />
        )}
        {!branding.logo && <span className={styles.developerName}>{branding.name}</span>}
      </Flexbox>
    );
  }

  // Si el developer tiene nombre pero no logo
  if (!loading && branding?.name && branding.name !== 'Lobe Chat') {
    return (
      <Flexbox
        align={'center'}
        dir={'ltr'}
        flex={'none'}
        gap={4}
        horizontal
        style={{ color: theme.colorTextDescription, fontSize: 12, ...style }}
        {...rest}
      >
        <span>Powered by</span>
        <span className={styles.developerName}>{branding.name}</span>
      </Flexbox>
    );
  }

  // Fallback: mostrar LobeHub
  return (
    <Flexbox
      align={'center'}
      dir={'ltr'}
      flex={'none'}
      gap={4}
      horizontal
      style={{ color: theme.colorTextDescription, fontSize: 12, ...style }}
      {...rest}
    >
      <span>Powered by</span>
      {isCustomORG ? (
        <span>{ORG_NAME}</span>
      ) : (
        <Link
          className={styles.logoLink}
          href={`https://lobehub.com?utm_source=${UTM_SOURCE}&utm_content=brand_watermark`}
          target={'_blank'}
        >
          <LobeHub size={20} type={'text'} />
        </Link>
      )}
    </Flexbox>
  );
});

export default BrandWatermark;
