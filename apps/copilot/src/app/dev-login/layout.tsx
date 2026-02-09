import type { ReactNode } from 'react';

export default function DevLoginLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
