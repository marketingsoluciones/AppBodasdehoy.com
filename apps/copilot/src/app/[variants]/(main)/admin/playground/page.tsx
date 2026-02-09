'use client';

import dynamic from 'next/dynamic';

const Playground = dynamic(() => import('@/features/DevPanel/Playground'), {
  loading: () => (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div>Cargando Playground...</div>
    </div>
  ),
  ssr: false,
});

export default function PlaygroundPage() {
  return <Playground />;
}
