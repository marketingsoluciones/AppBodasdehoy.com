import { PropsWithChildren, memo } from 'react';

const UpgradeBadge = memo(({ children }: PropsWithChildren<{ showBadge?: boolean }>) => {
  // ✅ DESACTIVADO: No mostrar badges de upgrade/premium
  return children;
});

export default UpgradeBadge;
