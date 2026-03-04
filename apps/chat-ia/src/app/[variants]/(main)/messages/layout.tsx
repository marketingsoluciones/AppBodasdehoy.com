import { ReactNode } from 'react';

interface MessagesLayoutProps {
  children: ReactNode;
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  return <div className="flex h-full overflow-hidden">{children}</div>;
}

