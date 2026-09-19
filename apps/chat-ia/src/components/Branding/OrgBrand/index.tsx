// SPRINT-AS: sub-path directo — evita barrel @lobehub/ui/brand (arrastra LogoSpline 3.7MB).
import LobeHub, { type LobeHubProps } from '@lobehub/ui/es/brand/LobeHub';
import { memo } from 'react';

import { ORG_NAME } from '@/const/branding';
import { isCustomORG } from '@/const/version';

export const OrgBrand = memo<LobeHubProps>((props) => {
  if (isCustomORG) {
    return <span>{ORG_NAME}</span>;
  }

  return <LobeHub {...props} />;
});
