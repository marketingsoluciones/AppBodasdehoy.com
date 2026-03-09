import { PropsWithChildren } from 'react';

export default function WeddingCreatorLayout({ children }: PropsWithChildren) {
  return (
    <div className="wedding-creator-layout h-screen w-full overflow-hidden bg-gray-100">
      {children}
    </div>
  );
}
