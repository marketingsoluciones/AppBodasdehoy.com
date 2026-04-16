'use client';

import dynamic from 'next/dynamic';

// ✅ CORRECCIÓN: Import dinámico para evitar problemas de SSR
// El TestSuite usa useChatStore que puede no estar disponible durante SSR
const TestSuite = dynamic(() => import('@/features/DevPanel/TestSuite'), {
  // Deshabilitar SSR para este componente
loading: () => (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div>Cargando Test Suite...</div>
    </div>
  ), 
  ssr: false,
});

export default function TestsPage() {
  return <TestSuite />;
}
