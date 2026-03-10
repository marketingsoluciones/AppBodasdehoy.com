import NProgress from '@/components/NProgress';

const Layout = () => {
  return (
    <>
      <NProgress />
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '24px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)',
            borderRadius: 24,
            display: 'flex',
            height: 80,
            justifyContent: 'center',
            width: 80,
          }}
        >
          <span style={{ fontSize: 36 }}>🎨</span>
        </div>

        <h2 style={{ color: '#111827', fontSize: 20, fontWeight: 700, margin: 0 }}>
          Generador de Imágenes IA
        </h2>

        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: 300 }}>
          Crea imágenes personalizadas para tus eventos con inteligencia artificial.
          Disponible próximamente en móvil.
        </p>

        <div
          style={{
            background: '#f3f4f6',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 8,
            padding: '16px 20px',
            width: '100%',
            maxWidth: 300,
          }}
        >
          {[
            ['✨', 'Invitaciones personalizadas'],
            ['📸', 'Fondos para galería'],
            ['🎨', 'Diseños temáticos'],
            ['💒', 'Decoración virtual'],
          ].map(([icon, text]) => (
            <div
              key={text}
              style={{ alignItems: 'center', display: 'flex', gap: 10, fontSize: 13, color: '#374151' }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
          Usa un dispositivo de escritorio para acceder a esta función.
        </p>
      </div>
    </>
  );
};

Layout.displayName = 'MobileAiImageLayout';

export default Layout;
