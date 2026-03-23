'use client';

import { Modal, Button, Typography } from 'antd';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import { usePendingIntent, generateConversationTitle } from '@/hooks/usePendingIntent';
import { useChatStore } from '@/store/chat';

const { Text, Paragraph } = Typography;

/**
 * Modal que aparece después del login si hay una intención pendiente
 * Pregunta al usuario si quiere continuar con su mensaje anterior
 */
function PendingIntentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const {
    pendingIntent,
    clearPendingIntent,
    isAuthenticated,
    hasPendingIntent,
  } = usePendingIntent();

  const activeExternalChatId = useChatStore((s) => s.activeExternalChatId);

  // Mostrar modal cuando hay intención pendiente después del login
  useEffect(() => {
    console.log('🔍 [PendingIntentModal] Verificando condiciones:', {
      hasPendingIntent,
      hasShown,
      isAuthenticated,
      pendingIntent: pendingIntent?.message?.slice(0, 30),
    });

    // Solo mostrar una vez por sesión
    if (hasShown) {
      console.log('ℹ️ [PendingIntentModal] Ya se mostró en esta sesión, no mostrar de nuevo');
      return;
    }

    // Si está autenticado y hay intención pendiente, mostrar modal
    if (isAuthenticated && hasPendingIntent && pendingIntent) {
      console.log('✅ [PendingIntentModal] Condiciones cumplidas, mostrando modal en 500ms');
      // Pequeño delay para que la UI se estabilice
      const timer = setTimeout(() => {
        console.log('🎯 [PendingIntentModal] Abriendo modal ahora');
        setIsOpen(true);
        setHasShown(true);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      console.log('ℹ️ [PendingIntentModal] Condiciones no cumplidas:', {
        hasPendingIntent,
        hasPendingIntentObject: !!pendingIntent,
        isAuthenticated,
      });
    }
  }, [isAuthenticated, hasPendingIntent, pendingIntent, hasShown]);

  const handleContinue = useCallback(() => {
    if (!pendingIntent) return;

    console.log('🚀 [PendingIntentModal] Enviando mensaje pendiente:', pendingIntent.message.slice(0, 50) + '...');

    // Obtener el título sugerido para la conversación
    const suggestedTitle = generateConversationTitle(pendingIntent.message);
    console.log('📝 [PendingIntentModal] Título sugerido:', suggestedTitle);

    // ✅ MEJORADO: Usar el store para enviar el mensaje directamente
    const store = useChatStore.getState();

    // Primero actualizar el input message
    store.updateInputMessage(pendingIntent.message);

    // Pequeño delay para que el store se actualice antes de enviar
    setTimeout(() => {
      const updatedStore = useChatStore.getState();

      // Enviar mensaje usando sendMessage del store
      updatedStore.sendMessage({
        isWelcomeQuestion: false,
        message: pendingIntent.message,
      });

      console.log('✅ [PendingIntentModal] Mensaje enviado exitosamente');
    }, 100);

    clearPendingIntent();
    setIsOpen(false);
  }, [pendingIntent, clearPendingIntent]);

  const handleDismiss = useCallback(() => {
    clearPendingIntent();
    setIsOpen(false);
  }, [clearPendingIntent]);

  if (!pendingIntent) return null;

  // Truncar mensaje si es muy largo
  const displayMessage = pendingIntent.message.length > 150
    ? pendingIntent.message.slice(0, 150) + '...'
    : pendingIntent.message;

  return (
    <Modal
      centered
      closable={false}
      footer={null}
      open={isOpen}
      title={
        <Flexbox align="center" gap={8} horizontal>
          <MessageOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span>Continuar conversación</span>
        </Flexbox>
      }
      width={450}
    >
      <Flexbox direction="vertical" gap={16}>
        <Text>
          Antes de iniciar sesión querías enviar este mensaje:
        </Text>

        <div
          style={{
            background: '#f5f5f5',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Paragraph
            ellipsis={{ expandable: true, rows: 4 }}
            style={{ margin: 0 }}
          >
            "{displayMessage}"
          </Paragraph>
        </div>

        <Text type="secondary">
          ¿Quieres continuar con esta solicitud?
        </Text>

        <Flexbox gap={12} horizontal style={{ marginTop: 8 }}>
          <Button
            block
            icon={<MessageOutlined />}
            onClick={handleContinue}
            size="large"
            type="primary"
          >
            Sí, continuar
          </Button>
          <Button
            block
            icon={<CloseOutlined />}
            onClick={handleDismiss}
            size="large"
          >
            Empezar de nuevo
          </Button>
        </Flexbox>
      </Flexbox>
    </Modal>
  );
}

export default memo(PendingIntentModal);
