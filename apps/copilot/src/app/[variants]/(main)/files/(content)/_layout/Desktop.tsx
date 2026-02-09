'use client';

import { PropsWithChildren } from 'react';
import { Flexbox } from 'react-layout-kit';

const Desktop = ({ children }: PropsWithChildren) => {
  return <Flexbox style={{ height: '100%', width: '100%' }}>{children}</Flexbox>;
};

export default Desktop;
