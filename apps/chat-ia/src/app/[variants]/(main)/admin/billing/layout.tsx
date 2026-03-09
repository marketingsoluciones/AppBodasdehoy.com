import { ReactNode } from 'react';

interface BillingLayoutProps {
  children: ReactNode;
}

export default function BillingLayout({ children }: BillingLayoutProps) {
  return <div className="h-full">{children}</div>;
}

