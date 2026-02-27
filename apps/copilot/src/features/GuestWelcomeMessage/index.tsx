'use client';

import { Button, Card, Form, Input, message } from 'antd';
import { UserAddOutlined, PhoneOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { memo, useMemo, useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { Markdown } from '@lobehub/ui';
import { Center, Flexbox } from 'react-layout-kit';
import { useVisitorData } from '@/hooks/useVisitorData';

// Extrae teléfono y email de un texto libre (mensajes de chat)
function extractContactFromText(text: string): { email?: string; phone?: string } {
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  // Soporta formatos: +34 666 123 456, 666123456, +34666123456, 666 123 456
  const phoneMatch = text.match(/(\+?\d[\d\s\-]{7,14}\d)/);
  return {
    email: emailMatch?.[0],
    phone: phoneMatch?.[0]?.replace(/\s/g, ''),
  };
}

/**
 * Componente que muestra mensaje mejorado para visitantes no registrados.
 * Incluye formulario de captura de contacto (lead capture) para CRM.
 */
function GuestWelcomeMessage() {
  const router = useRouter();
  const { saveVisitorData } = useVisitorData();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [form] = Form.useForm();

  const { currentUserId, userType, development, activeExternalChatId } = useChatStore((s) => ({
    activeExternalChatId: s.activeExternalChatId,
    currentUserId: s.currentUserId,
    development: s.development,
    userType: s.userType,
  }));

  // Mensajes del usuario en el chat activo
  const userMessages = useChatStore((s) =>
    chatSelectors.activeBaseChats(s)
      .filter((m) => m.role === 'user')
      .map((m) => (typeof m.content === 'string' ? m.content : '')),
  );
  const lastSeenMsgCountRef = useRef(0);

  const isGuest = useMemo(() => {
    if (!mounted) return false;
    return (
      !currentUserId ||
      currentUserId === 'visitante@guest.local' ||
      currentUserId === 'guest' ||
      currentUserId === 'anonymous' ||
      userType === 'guest'
    );
  }, [currentUserId, userType, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Monitorear mensajes del usuario para detectar teléfono/email automáticamente
  useEffect(() => {
    if (!isGuest || leadCaptured) return;
    if (userMessages.length <= lastSeenMsgCountRef.current) return;

    // Sólo analizar mensajes nuevos
    const newMessages = userMessages.slice(lastSeenMsgCountRef.current);
    lastSeenMsgCountRef.current = userMessages.length;

    for (const text of newMessages) {
      const { phone, email } = extractContactFromText(text);
      if (!phone && !email) continue;

      const sessionId = activeExternalChatId || `guest-${Date.now()}`;
      saveVisitorData({
        development: development || 'bodasdehoy',
        intent: 'lead_capture_chat',
        metadata: { source: 'chat_message', timestamp: new Date().toISOString() },
        session_id: sessionId,
        user_info: { email, phone },
      })
        .then(() => {
          setLeadCaptured(true);
          message.success('¡Gracias! Hemos guardado tu contacto.');
        })
        .catch(() => {/* silencioso */});
      break; // solo capturar una vez por sesión
    }
  }, [userMessages, isGuest, leadCaptured, activeExternalChatId, development, saveVisitorData]);

  if (!mounted || !isGuest) {
    return null;
  }

  const handleRegister = () => {
    router.prefetch('/dev-login');
    router.push('/dev-login?mode=register');
  };

  const handleLeadSubmit = async (values: { nombre?: string; phone?: string; email?: string }) => {
    const { nombre, phone, email } = values;
    if (!phone && !email) return;

    setSubmitting(true);
    const sessionId = activeExternalChatId || `guest-${Date.now()}`;

    try {
      await saveVisitorData({
        development: development || 'bodasdehoy',
        intent: 'lead_capture',
        metadata: {
          source: 'welcome_message_form',
          timestamp: new Date().toISOString(),
        },
        session_id: sessionId,
        user_info: {
          email: email || undefined,
          nombre: nombre || undefined,
          phone: phone || undefined,
        },
      });

      setLeadCaptured(true);
      message.success('¡Gracias! Te contactaremos pronto.');
    } catch (error) {
      console.warn('[GuestWelcomeMessage] Error guardando lead:', error);
      message.error('No se pudo guardar tu información. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const welcomeMessage = `¡Hola! 👋

Soy tu asistente para organizar eventos y bodas. Puedo ayudarte a:

📅 **Planificar tu evento** — bodas, cumpleaños, corporativos
👥 **Gestionar invitados** y sus preferencias
💰 **Controlar presupuesto** y proveedores

Cuéntame qué tienes en mente y te ayudo a organizarlo.`;

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
        <Flexbox direction="vertical" gap={20}>
          <Markdown variant="chat">{welcomeMessage}</Markdown>

          {leadCaptured ? (
            <div
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 8,
                color: '#52c41a',
                fontSize: 14,
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              ✅ ¡Gracias! Hemos guardado tu contacto y te contactaremos pronto.
              <br />
              <span style={{ color: '#666', fontSize: 12 }}>
                Mientras tanto, sigue explorando el chat — estoy aquí para ayudarte.
              </span>
            </div>
          ) : (
            <div
              style={{
                background: '#fafafa',
                border: '1px dashed #d9d9d9',
                borderRadius: 8,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#262626', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                📞 ¿Quieres que te contactemos?
              </div>
              <Form form={form} layout="vertical" onFinish={handleLeadSubmit}>
                <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
                  <Form.Item name="nombre" style={{ flex: '1 1 160px', marginBottom: 8 }}>
                    <Input placeholder="Tu nombre (opcional)" size="middle" />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    style={{ flex: '1 1 160px', marginBottom: 8 }}
                  >
                    <Input
                      placeholder="Teléfono o WhatsApp"
                      prefix={<PhoneOutlined />}
                      size="middle"
                    />
                  </Form.Item>
                  <Form.Item name="email" style={{ flex: '1 1 160px', marginBottom: 8 }}>
                    <Input placeholder="Email (opcional)" size="middle" type="email" />
                  </Form.Item>
                </Flexbox>
                <Button
                  block
                  htmlType="submit"
                  icon={<PhoneOutlined />}
                  loading={submitting}
                  size="middle"
                  type="primary"
                >
                  Dejar mis datos de contacto
                </Button>
              </Form>
            </div>
          )}

          <Flexbox gap={8} horizontal>
            <Button
              icon={<UserAddOutlined />}
              onClick={handleRegister}
              size="middle"
              style={{ flex: 1 }}
              type="default"
            >
              Crear cuenta gratis
            </Button>
          </Flexbox>

          <div style={{ color: '#8c8c8c', fontSize: 11, textAlign: 'center' }}>
            Tu información solo se usa para contactarte sobre tu evento. Sin spam.
          </div>
        </Flexbox>
      </Card>
    </Center>
  );
}

export default memo(GuestWelcomeMessage);
