import type { ReactNode } from 'react';

export const metadata = {
  title: 'Chat Widget',
};

export default function WidgetLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ height: '100vh', margin: 0, overflow: 'hidden', padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
