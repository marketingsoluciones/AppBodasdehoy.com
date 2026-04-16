'use client';

import { ReactNode } from 'react';

import { EventosAutoAuth } from '@/features/EventosAutoAuth';

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EventosAutoAuth />
      {children}
    </>
  );
}
