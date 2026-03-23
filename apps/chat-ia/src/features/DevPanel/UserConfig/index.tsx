'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Typography, Space } from 'antd';

import { useChatStore } from '@/store/chat';

const { Title, Text } = Typography;

/**
 * Componente para configurar usuario y developer en DevPanel
 * Permite cambiar el usuario activo sin refrescar la página
 */
const UserConfig = () => {
  const setExternalChatConfig = useChatStore((s) => s.setExternalChatConfig);
  const fetchExternalChats = useChatStore((s) => s.fetchExternalChats);
  const currentUserId = useChatStore((s) => s.currentUserId);
  const development = useChatStore((s) => s.development);
  const userApiConfigs = useChatStore((s) => s.userApiConfigs);
  const userEvents = useChatStore((s) => s.userEvents);
  const userProfile = useChatStore((s) => s.userProfile);

  const [developer, setDeveloper] = useState(development || 'bodasdehoy');
  const [userId, setUserId] = useState(currentUserId || 'bodasdehoy.com@gmail.com');
  const [loading, setLoading] = useState(false);

  // Sincronizar con store cuando cambie
  useEffect(() => {
    setDeveloper(development || 'bodasdehoy');
    setUserId(currentUserId || 'bodasdehoy.com@gmail.com');
  }, [development, currentUserId]);

  const handleUpdate = async () => {
    if (!developer || !userId) return;

    setLoading(true);
    try {
      // 1. Configurar usuario y developer (ahora es async y sincroniza con middleware)
      await setExternalChatConfig(userId, developer);

      // 2. Cargar conversaciones (ya se hace automáticamente en setExternalChatConfig)
      await fetchExternalChats();

      // 3. Guardar en localStorage
      localStorage.setItem('dev-user-config', JSON.stringify({
        development: developer,
        timestamp: Date.now(),
        userId
      }));

      console.log('✅ Configuración de usuario actualizada y sincronizada');
    } catch (error) {
      console.error('Error actualizando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Title level={5}>🔧 Configuración de Usuario</Title>
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
          <label style={{ display: 'block', marginBottom: 8 }}>
            Developer:
          </label>
          <Input
            onChange={(e) => setDeveloper(e.target.value)}
            placeholder="bodasdehoy"
            value={developer}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Usuario (Email o Teléfono):
          </label>
          <Input
            onChange={(e) => setUserId(e.target.value)}
            placeholder="bodasdehoy.com@gmail.com"
            value={userId}
          />
        </div>

        <Button
          block
          loading={loading}
          onClick={handleUpdate}
          type="primary"
        >
          Actualizar Configuración
        </Button>

        {/* Mostrar datos cargados */}
        {userApiConfigs && userApiConfigs.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>✅ APIs Configuradas:</Text>
            <div style={{ marginTop: 8 }}>
              {userApiConfigs.map((config, index) => (
                <div key={index} style={{ fontSize: '12px', marginBottom: 4 }}>
                  <Text code>{config.provider}</Text> - {config.enabled ? '✅' : '❌'}
                </div>
              ))}
            </div>
          </div>
        )}

        {userEvents && userEvents.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>📅 Eventos ({userEvents.length}):</Text>
            <div style={{ marginTop: 8 }}>
              {userEvents.slice(0, 3).map((event, index) => (
                <div key={index} style={{ fontSize: '12px', marginBottom: 4 }}>
                  <Text code>{event.nombre}</Text> - {event.fecha}
                </div>
              ))}
              {userEvents.length > 3 && (
                <Text style={{ fontSize: '12px' }} type="secondary">
                  ... y {userEvents.length - 3} más
                </Text>
              )}
            </div>
          </div>
        )}

        {userProfile && (
          <div style={{ marginTop: 16 }}>
            <Text strong>👤 Perfil:</Text>
            <div style={{ fontSize: '12px', marginTop: 8 }}>
              <div>Nombre: {userProfile.name || 'N/A'}</div>
              <div>Roles: {userProfile.roles?.join(', ') || 'N/A'}</div>
              <div>Permisos: {userProfile.permissions ? Object.keys(userProfile.permissions).join(', ') : 'N/A'}</div>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default UserConfig;
