import { PropsWithChildren } from 'react';

export default function WeddingPublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="wedding-public-layout min-h-screen">
      {children}
    </div>
  );
}
