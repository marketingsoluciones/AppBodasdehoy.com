'use client';

import { ActionIcon, Modal } from '@lobehub/ui';
import { Checkbox, Input, message } from 'antd';
import { Share2 } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

interface ShareChatButtonProps {
  currentUserId: string;
  development?: string;
  ownerId: string;
  sessionId: string;
}

/**
 * Botón para compartir sesión de chat con otros usuarios
 *
 * Características:
 * - Solo visible para el owner del chat
 * - Permite seleccionar permisos granulares (read, write, delete)
 * - Integrado con el middleware actualizado
 */
export const ShareChatButton = memo<ShareChatButtonProps>(
  ({ sessionId, ownerId, currentUserId, development = 'bodasdehoy' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [targetUser, setTargetUser] = useState('');
    const [canRead, setCanRead] = useState(true);
    const [canWrite, setCanWrite] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [loading, setLoading] = useState(false);

    // Solo mostrar si es el owner
    if (ownerId !== currentUserId) {
      return null;
    }

    const handleShare = async () => {
      if (!targetUser.trim()) {
        message.error('Por favor ingresa un email o ID de usuario');
        return;
      }

      if (!canRead && !canWrite && !canDelete) {
        message.error('Debes seleccionar al menos un permiso');
        return;
      }

      setLoading(true);

      try {
        const response = await fetch('/api/chat/share', {
          body: JSON.stringify({
            can_delete: canDelete,
            can_read: canRead,
            can_write: canWrite,
            session_id: sessionId,
            target_user_id: targetUser.trim(),
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-Development': development,
            'X-User-ID': currentUserId,
          },
          method: 'POST',
        });

        if (response.ok) {
          await response.json();
          message.success('Chat compartido exitosamente');
          setIsOpen(false);
          setTargetUser('');
          // Reset permisos
          setCanRead(true);
          setCanWrite(false);
          setCanDelete(false);
        } else {
          const error = await response.json();
          message.error(error.detail || 'Error al compartir chat');
        }
      } catch (error) {
        console.error('Error sharing chat:', error);
        message.error('Error de red al compartir chat');
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <ActionIcon
          icon={Share2}
          onClick={() => setIsOpen(true)}
          size="small"
          title="Compartir chat"
        />

        <Modal
          cancelText="Cancelar"
          okButtonProps={{ loading }}
          okText="Compartir"
          onCancel={() => setIsOpen(false)}
          onOk={handleShare}
          open={isOpen}
          title="Compartir Chat"
          width={480}
        >
          <Flexbox gap={16} padding={16}>
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                Usuario (Email o ID)
              </label>
              <Input
                onChange={(e) => setTargetUser(e.target.value)}
                placeholder="ejemplo@email.com o +34600000000"
                size="large"
                value={targetUser}
              />
              <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                Ingresa el email o teléfono del usuario con quien quieres compartir
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>Permisos</div>
              <Flexbox gap={12}>
                <Checkbox
                  checked={canRead}
                  onChange={(e) => setCanRead(e.target.checked)}
                >
                  <strong>Puede leer mensajes</strong>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    Ver todos los mensajes del chat
                  </div>
                </Checkbox>

                <Checkbox
                  checked={canWrite}
                  onChange={(e) => setCanWrite(e.target.checked)}
                >
                  <strong>Puede enviar mensajes</strong>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    Escribir y enviar nuevos mensajes
                  </div>
                </Checkbox>

                <Checkbox
                  checked={canDelete}
                  onChange={(e) => setCanDelete(e.target.checked)}
                >
                  <strong>Puede eliminar chat</strong>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    Eliminar completamente el chat (⚠️ irreversible)
                  </div>
                </Checkbox>
              </Flexbox>
            </div>

            <div
              style={{
                background: '#f0f9ff',
                borderRadius: 8,
                fontSize: 13,
                padding: 12,
              }}
            >
              <strong>ℹ️ Nota:</strong> El usuario recibirá acceso según los permisos
              seleccionados. Puedes cambiar o revocar los permisos en cualquier momento.
            </div>
          </Flexbox>
        </Modal>
      </>
    );
  },
);

ShareChatButton.displayName = 'ShareChatButton';

export default ShareChatButton;

