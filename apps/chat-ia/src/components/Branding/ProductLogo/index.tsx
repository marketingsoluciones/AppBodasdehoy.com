// SPRINT-AS: sub-path directo (no barrel) — evita arrastrar LogoSpline + @splinetool/runtime (3.7MB).
import LobeHub, { type LobeHubProps } from '@lobehub/ui/es/brand/LobeHub';
import { memo } from 'react';

import { isCustomBranding } from '@/const/version';

import CustomLogo from './Custom';

interface ProductLogoProps extends LobeHubProps {
  height?: number;
  width?: number;
}

export const ProductLogo = memo<ProductLogoProps>((props) => {
  if (isCustomBranding) {
    return <CustomLogo {...props} />;
  }

  return <LobeHub {...props} />;
});
