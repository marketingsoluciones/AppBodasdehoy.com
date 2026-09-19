'use client';

import { type ReactNode, createContext, memo, use } from 'react';

import { DiscoverProviderDetail } from '@/types/discover';

export type DetailContextConfig = Partial<DiscoverProviderDetail>;

export const DetailContext = createContext<DetailContextConfig>({});

export const DetailProvider = memo<{ children: ReactNode; config?: DetailContextConfig }>(
  ({ children, config = {} }) => {
    return <DetailContext.Provider value={config}>{children}</DetailContext.Provider>;
  },
);

export const useDetailContext = () => {
  return use(DetailContext);
};
