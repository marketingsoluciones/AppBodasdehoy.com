'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Typography, Space, Modal } from 'antd';
import { UserCog } from 'lucide-react';

import { useChatStore } from '@/store/chat';

const { Text } = Typography;

/**
 * Componente para configurar usuario y developer
 * Permite cambiar el usuario activo sin refrescar la página
 */
export const UserConfig = () => {
  const { setExternalChatConfig, fetchExternalChats, currentUserId, development } = useChatStore((s) => ({
    currentUserId: s.currentUserId,
    development: s.development,
    fetchExternalChats: s.fetchExternalChats,
    setExternalChatConfig: s.setExternalChatConfig,
  }));

  const [developer, setDeveloper] = useState(development || 'bodasdehoy');
  const [userId, setUserId] = useState(currentUserId || 'visitante@guest.local');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Sincronizar con store cuando cambie
  useEffect(() => {
    setDeveloper(development || 'bodasdehoy');
    setUserId(currentUserId || 'visitante@guest.local');
  }, [development, currentUserId]);

  const handleUpdate = async () => {
    if (!developer || !userId) return;

    setLoading(true);
    try {
      // 1. Configurar usuario y developer
      await setExternalChatConfig(userId, developer);

      // 2. Cargar conversaciones
      await fetchExternalChats();

      // 3. Guardar en localStorage
      localStorage.setItem('dev-user-config', JSON.stringify({
        development: developer,
        timestamp: Date.now(),
        userId
      }));

      console.log('✅ Configuración de usuario actualizada');
      setOpen(false);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        icon={<UserCog size={16} />}
        onClick={() => setOpen(true)}
        style={{ textAlign: 'left', width: '100%' }}
        type="text"
      >
        🔧 Cambiar Usuario
      </Button>
      
      <Modal
        footer={null}
        onCancel={() => setOpen(false)}
        open={open}
        title="🔧 Cambiar Usuario"
        width={500}
      >
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">
                Cambia el usuario activo sin recargar la página
              </Text>
            </div>

            <div>
              <Text strong>Developer Actual:</Text>
              <br />
              <Text code>{development || 'No configurado'}</Text>
            </div>

            <div>
              <Text strong>Usuario Actual:</Text>
              <br />
              <Text code>{currentUserId || 'No configurado'}</Text>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                Developer:
              </label>
              <Input
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="bodasdehoy"
                value={developer}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                Usuario (Email o Teléfono):
              </label>
              <Input
                onChange={(e) => setUserId(e.target.value)}
                placeholder="visitante@guest.local"
                value={userId}
              />
            </div>

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                disabled={!developer || !userId}
                loading={loading}
                onClick={handleUpdate}
                type="primary"
              >
                Actualizar
              </Button>
            </Space>

            <div style={{ color: '#666', fontSize: '12px', marginTop: 16 }}>
              <Text type="secondary">
                <strong>Ejemplos:</strong><br />
                Visitante: <Text code>visitante@guest.local</Text><br />
                Creador: <Text code>bodasdehoy.com@gmail.com</Text><br />
                Invitado: <Text code>+34600000000</Text>
              </Text>
            </div>
          </Space>
        </Card>
      </Modal>
    </>
  );
};


