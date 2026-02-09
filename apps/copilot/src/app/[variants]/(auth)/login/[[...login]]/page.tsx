'use client';

import { Card, Typography } from 'antd';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { FirebaseAuth } from '@/features/FirebaseAuth';

const { Title, Paragraph } = Typography;

function LoginContent() {
  const searchParams = useSearchParams();
  const development = searchParams.get('developer') || 'bodasdehoy';

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Iniciar Sesión
          </Title>
          <Paragraph style={{ color: '#666', marginBottom: 0 }}>
            Accede a tu cuenta para continuar
          </Paragraph>
        </div>

        <FirebaseAuth
          development={development}
          onError={(error) => {
            console.error('Error de autenticación:', error);
          }}
          onSuccess={(data) => {
            console.log('Autenticación exitosa:', data);
          }}
        />
      </Card>
    </div>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
};

Page.displayName = 'Login';

export default Page;
