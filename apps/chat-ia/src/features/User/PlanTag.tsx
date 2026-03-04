import { memo } from 'react';

import { Plans } from '@/types/subscription';

export enum PlanType {
  Preview = 'preview',
}

export interface PlanTagProps {
  type?: PlanType | Plans;
}

const PlanTag = memo<PlanTagProps>(() => {
  // ✅ DESACTIVADO: No mostrar tags de planes premium
  return null;
});

export default PlanTag;
