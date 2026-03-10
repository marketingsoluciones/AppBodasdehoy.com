import type { ReactNode } from 'react';

export const metadata = {
  title: 'Chat Widget',
};

export default function WidgetLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
