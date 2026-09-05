// SPRINT-AS: sub-paths directos — evitan arrastrar LogoSpline (3.7MB) via barrel.
import BrandLoading from '@lobehub/ui/es/brand/BrandLoading';
import LobeHubText from '@lobehub/ui/es/brand/LobeHubText';
import { Center } from 'react-layout-kit';

import { isCustomBranding } from '@/const/version';

import CircleLoading from '../CircleLoading';

export default () => {
  if (isCustomBranding) return <CircleLoading />;

  return (
    <Center height={'100%'} width={'100%'}>
      <BrandLoading size={40} style={{ opacity: 0.6 }} text={LobeHubText} />
    </Center>
  );
};
