'use client';

import { Button, Card } from 'antd';
import { UserAddOutlined, CalendarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { memo, useMemo, useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat';
import { Markdown } from '@lobehub/ui';
import { Center, Flexbox } from 'react-layout-kit';
import { useVisitorData } from '@/hooks/useVisitorData';

/**
 * Componente que muestra mensaje mejorado para visitantes no registrados
 * Con CTA para registro y guía para crear su primer evento
 */
function GuestWelcomeMessage() {
  const router = useRouter();
  const { saveVisitorData } = useVisitorData();
  const [mounted, setMounted] = useState(false);
  const { currentUserId, userType, development, activeExternalChatId } = useChatStore((s) => ({
    activeExternalChatId: s.activeExternalChatId,
    currentUserId: s.currentUserId,
    development: s.development,
    userType: s.userType,
  }));

  // Asegurar que solo renderice después de la hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificar si es visitante
  const isGuest = useMemo(() => {
    if (!mounted) return false; // Durante SSR, no renderizar
    return (
      !currentUserId ||
      currentUserId === 'visitante@guest.local' ||
      currentUserId === 'guest' ||
      currentUserId === 'anonymous' ||
      userType === 'guest'
    );
  }, [currentUserId, userType, mounted]);

  // Si no es visitante o no está montado, no mostrar nada
  if (!mounted || !isGuest) {
    return null;
  }

  const handleRegister = () => {
    // ✅ OPTIMIZACIÓN: Usar router.push para navegación rápida (sin recargar página)
    // Prefetch la página para que cargue más rápido
    router.prefetch('/dev-login');
    router.push('/dev-login?mode=register');
  };

  const handleCreateEvent = async () => {
    // Guardar intención de crear evento en el backend
    const sessionId = activeExternalChatId || `guest-${Date.now()}`;
    
    try {
      await saveVisitorData({
        development: development || 'bodasdehoy',
        intent: 'crear_evento',
        metadata: {
          source: 'welcome_message',
          timestamp: new Date().toISOString(),
        },
        session_id: sessionId,
      });
      console.log('✅ Intención de crear evento guardada');
    } catch (error) {
      console.warn('⚠️ Error guardando intención:', error);
      // Continuar aunque falle el guardado
    }

    // Redirigir a registro
    handleRegister();
  };

  const welcomeMessage = `¡Hola! 👋

Soy tu asistente inteligente para organizar eventos. Puedo ayudarte a:

📅 **Crear y gestionar eventos** (bodas, cumpleaños, corporativos)
👥 **Organizar invitados** y sus preferencias
💰 **Controlar presupuestos** y gastos
📋 **Gestionar proveedores** y servicios

**Para empezar a crear eventos, necesitas registrarte primero.** Es rápido y gratuito.`;

  return (
    <Center padding={16} width={'100%'}>
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: 600,
          width: '100%',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Flexbox direction="column" gap={16}>
          <Markdown variant="chat">{welcomeMessage}</Markdown>

          <Flexbox gap={12} horizontal style={{ marginTop: 8 }}>
            <Button
              icon={<UserAddOutlined />}
              onClick={handleRegister}
              size="large"
              style={{ flex: 1 }}
              type="primary"
            >
              Registrarse Gratis
            </Button>
            <Button
              icon={<CalendarOutlined />}
              onClick={handleCreateEvent}
              size="large"
              style={{ flex: 1 }}
            >
              Crear mi Primer Evento
            </Button>
          </Flexbox>

          <div style={{ color: '#666', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
            💡 <strong>Tip:</strong> Al registrarte, podrás guardar todos tus eventos y acceder a ellos desde cualquier dispositivo
          </div>
        </Flexbox>
      </Card>
    </Center>
  );
}

export default memo(GuestWelcomeMessage);

