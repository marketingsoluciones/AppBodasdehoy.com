'use client';

import { Button, Empty, Form, Input, message, Modal, Radio, Select, Skeleton } from 'antd';
import { createStyles } from 'antd-style';
import { Images, LogIn, Plus, Search, UserPlus } from 'lucide-react';

import { QRScanner } from '@/components/QRScanner';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { type Album, useMemoriesStore } from '@/store/memories';
import { useUserStore } from '@/store/user';
import { useChatStore } from '@/store/chat';
import { useDevelopment } from '@/utils/developmentDetector';

/**
 * Hook para verificar autenticación usando dev-login (localStorage)
 * ✅ Unificado con el sistema de autenticación del chat
 */
function useDevUserAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [devUserId, setDevUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    try {
      const rawConfig = localStorage.getItem('dev-user-config');
      console.log('🔍 Momentos: Verificando auth...', { hasConfig: !!rawConfig });

      if (!rawConfig) {
        setIsAuthenticated(false);
        setDevUserId(null);
        setIsChecking(false);
        return;
      }

      // ✅ FIX: Manejo robusto de parsing JSON
      let config;
      try {
        if (!rawConfig.trim().startsWith('{') && !rawConfig.trim().startsWith('[')) {
          throw new Error('Raw config is not valid JSON');
        }
        config = JSON.parse(rawConfig);
      } catch (parseError) {
        console.warn('⚠️ Error parseando rawConfig en memories:', parseError);
        config = null;
      }
      const userId = config?.userId || config?.user_id;

      // Verificar que no sea usuario invitado
      const isValidUser = !!(
        userId &&
        userId !== 'guest' &&
        userId !== 'anonymous' &&
        userId !== '' &&
        userId !== 'visitante@guest.local'
      );

      console.log('🔍 Momentos: Usuario válido:', isValidUser, userId?.slice(0, 20));
      setIsAuthenticated(isValidUser);
      setDevUserId(isValidUser ? userId : null);
    } catch (error) {
      console.error('❌ Momentos: Error verificando auth:', error);
      setIsAuthenticated(false);
      setDevUserId(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { devUserId, isAuthenticated, isChecking };
}

const useStyles = createStyles(({ css, token }) => ({
  albumCard: css`
    cursor: pointer;

    position: relative;

    overflow: hidden;

    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};

    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: ${token.colorPrimary};
      box-shadow: 0 4px 12px ${token.colorPrimaryBg};
    }
  `,
  albumCover: css`
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    height: 160px;

    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgLayout} 100%);
  `,
  albumCoverImage: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,
  albumInfo: css`
    padding-block: 12px;
padding-inline: 16px;
  `,
  albumMeta: css`
    display: flex;
    gap: 12px;

    margin-block-start: 8px;

    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  albumName: css`
    overflow: hidden;

    margin: 0;

    font-size: 16px;
    font-weight: 600;
    color: ${token.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  container: css`
    overflow-y: auto;

    width: 100%;
    max-width: 1400px;
    height: 100%;
    margin-block: 0;
    margin-inline: auto;
    padding: 24px;
  `,
  createButton: css`
    display: flex;
    gap: 8px;
    align-items: center;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-block-start: 24px;
  `,
  header: css`
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;

    margin-block-end: 24px;
  `,
  
loginCard: css`
    max-width: 420px;
    padding: 40px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 16px;

    text-align: center;

    background: ${token.colorBgContainer};
  `,
  
// Estilos para pantalla de login requerido
loginContainer: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;
    padding: 24px;
  `,
  
loginFeature: css`
    display: flex;
    gap: 10px;
    align-items: center;

    font-size: 14px;
    color: ${token.colorText};
  `,
  
  loginFeatures: css`
    display: flex;
    flex-direction: column;
    gap: 12px;

    margin-block-end: 32px;
    padding: 16px;
    border-radius: 12px;

    text-align: start;

    background: ${token.colorFillQuaternary};
  `,
  loginIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 80px;
    height: 80px;
    margin-block-end: 24px;
    margin-inline: auto;
    border-radius: 50%;

    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorPrimaryBgHover} 100%);
  `,
  loginSubtitle: css`
    margin: 0 0 32px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
    line-height: 1.6;
  `,
  loginTitle: css`
    margin: 0 0 12px;
    font-size: 24px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  searchInput: css`
    width: 300px;
  `,
  title: css`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  visibilityBadge: css`
    position: absolute;
    inset-block-start: 8px;
    inset-inline-end: 8px;

    padding-block: 2px;
    padding-inline: 8px;
    border-radius: 4px;

    font-size: 11px;
    color: ${token.colorTextLightSolid};

    background: ${token.colorPrimary};
  `,
}));

const AlbumCard = memo<{ album: Album; onClick: (album: Album) => void }>(({ album, onClick }) => {
  const { styles } = useStyles();

  const visibilityLabels = {
    members: 'Colaboradores',
    private: 'Privado',
    public: 'Público',
  };

  return (
    <div className={styles.albumCard} onClick={() => onClick(album)}>
      <div className={styles.albumCover}>
        {album.coverImageUrl ? (
          <img alt={album.name} className={styles.albumCoverImage} src={album.coverImageUrl} />
        ) : (
          <Images size={48} strokeWidth={1.5} style={{ opacity: 0.4 }} />
        )}
        <span className={styles.visibilityBadge}>{visibilityLabels[album.visibility]}</span>
      </div>
      <div className={styles.albumInfo}>
        <h3 className={styles.albumName}>{album.name}</h3>
        <div className={styles.albumMeta}>
          <span>{album.mediaCount} fotos</span>
          <span>{album.memberCount} miembros</span>
        </div>
      </div>
    </div>
  );
});

AlbumCard.displayName = 'AlbumCard';

// Componente para mostrar cuando el usuario no está autenticado
const LoginRequired = memo(() => {
  const { styles, theme } = useStyles();
  const openLogin = useUserStore((s) => s.openLogin);

  const features = [
    'Crea albums colaborativos para tus eventos',
    'Invita a familiares y amigos a compartir fotos',
    'Comparte tus recuerdos con un link o QR',
    'Descarga todas las fotos cuando quieras',
  ];

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginIcon}>
          <Images color={theme.colorPrimary} size={40} strokeWidth={1.5} />
        </div>
        <h2 className={styles.loginTitle}>Momentos</h2>
        <p className={styles.loginSubtitle}>
          Para crear y gestionar tus álbumes de momentos, necesitas iniciar sesión o crear una cuenta.
        </p>
        <div className={styles.loginFeatures}>
          {features.map((feature, index) => (
            <div className={styles.loginFeature} key={index}>
              <Images color={theme.colorPrimary} size={16} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <Flexbox gap={12}>
          <Button
            block
            icon={<LogIn size={18} />}
            onClick={() => openLogin()}
            size="large"
            type="primary"
          >
            Iniciar Sesion
          </Button>
          <Button
            block
            icon={<UserPlus size={18} />}
            onClick={() => openLogin()}
            size="large"
          >
            Crear Cuenta
          </Button>
        </Flexbox>
      </div>
    </div>
  );
});

LoginRequired.displayName = 'LoginRequired';

interface CreateAlbumFormValues {
  description?: string;
  eventId?: string;
  name: string;
  visibility: 'private' | 'members' | 'public';
}

const MemoriesPage = memo(() => {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('common');
  const router = useRouter();
  const [form] = Form.useForm<CreateAlbumFormValues>();
  const [createLoading, setCreateLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // ✅ CORREGIDO: Usar dev-login en lugar de LobeChat auth
  const { isAuthenticated, devUserId, isChecking } = useDevUserAuth();
  const userId = devUserId;
  const isSignedIn = isAuthenticated;
  const { development } = useDevelopment();
  
  // ✅ NUEVO: Obtener eventos del usuario desde el store
  const { userEvents, fetchUserEvents } = useChatStore((state) => ({
    fetchUserEvents: state.fetchUserEvents,
    userEvents: state.userEvents || [],
  }));

  const {
    albums,
    albumsLoading,
    searchTerm,
    isCreateAlbumModalOpen,
    fetchAlbums,
    setSearchTerm,
    toggleCreateAlbumModal,
    createAlbum,
    createEventAlbumStructure,
    getAlbumsByEvent,
  } = useMemoriesStore();

  // ✅ OPTIMIZACIÓN: Deferir carga de álbumes para no bloquear render inicial
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadAlbums = async () => {
      if (userId && isMounted) {
        try {
          // ✅ Deferir carga 100ms para permitir que la UI se renderice primero
          await new Promise(resolve => setTimeout(resolve, 100));
          if (isMounted) {
            await fetchAlbums(userId, development);
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error loading albums:', error);
          }
        }
      }
    };

    // ✅ Usar requestIdleCallback si está disponible, sino setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      timeoutId = setTimeout(() => {
        requestIdleCallback(() => {
          if (isMounted) loadAlbums();
        }, { timeout: 500 });
      }, 0);
    } else {
      timeoutId = setTimeout(loadAlbums, 100);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userId, development, fetchAlbums]);

  const handleAlbumClick = useCallback(
    (album: Album) => {
      // Usar album.id (que es album_id) o album._id como fallback
      const albumId = (album as any).id || album._id;
      router.push(`/memories/${albumId}`);
    },
    [router],
  );

  const handleCreateAlbum = useCallback(async () => {
    toggleCreateAlbumModal(true);
    
    // ✅ NUEVO: Cargar eventos del usuario cuando se abre el modal
    if (userId && fetchUserEvents) {
      setLoadingEvents(true);
      try {
        await fetchUserEvents();
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoadingEvents(false);
      }
    }
  }, [toggleCreateAlbumModal, userId, fetchUserEvents]);

  const handleCreateSubmit = useCallback(async () => {
    if (!userId) return;

    try {
      const values = await form.validateFields();
      setCreateLoading(true);

      const newAlbum = await createAlbum(
        {
          description: values.description,
          eventId: values.eventId || undefined,
          name: values.name,
          visibility: values.visibility,
        },
        userId,
        development,
      );

      if (newAlbum) {
        form.resetFields();
        toggleCreateAlbumModal(false);
        message.success('Álbum creado correctamente');
        // Usar album.id (que es album_id) o album._id como fallback
        const albumId = (newAlbum as any).id || newAlbum._id;
        router.push(`/memories/${albumId}`);
      } else {
        message.error('Error al crear el álbum');
      }
    } catch (error: any) {
      console.error('Error creating album:', error);
      message.error(error?.message || 'Error al crear el álbum. Por favor intenta de nuevo.');
    } finally {
      setCreateLoading(false);
    }
  }, [userId, form, createAlbum, toggleCreateAlbumModal, router]);

  const filteredAlbums = albums.filter(
    (album) =>
      album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Mostrar loading mientras verifica autenticación
  if (isChecking) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton.Input active style={{ width: 200 }} />
          <Skeleton.Button active />
        </div>
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton.Node
              active
              key={i}
              style={{ borderRadius: 12, height: 220, width: '100%' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Mostrar pantalla de login si el usuario no está autenticado
  if (!isSignedIn || !userId) {
    return <LoginRequired />;
  }

  if (albumsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('tab.memories' as any)}</h1>
          <Skeleton.Button active />
        </div>
        <Center style={{ marginTop: 80 }}>
          <Flexbox gap={16} style={{ alignItems: 'center', textAlign: 'center' }}>
            <Images
              color={theme.colorPrimary}
              size={48}
              strokeWidth={1.5}
              style={{ animation: 'pulse 2s ease-in-out infinite', opacity: 0.6 }}
            />
            <div>
              <div style={{ color: theme.colorText, fontSize: 16, fontWeight: 500 }}>
                Cargando tus álbumes...
              </div>
              <div style={{ color: theme.colorTextSecondary, fontSize: 13, marginTop: 8 }}>
                Primera carga puede tardar hasta 30 segundos
              </div>
              <div
                style={{
                  color: theme.colorTextTertiary,
                  fontSize: 12,
                  fontStyle: 'italic',
                  marginTop: 4,
                }}
              >
                Próximas cargas serán instantáneas (caché 5 min)
              </div>
            </div>
          </Flexbox>
        </Center>
        <div className={styles.grid} style={{ marginTop: 60 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton.Node
              active
              key={i}
              style={{ borderRadius: 12, height: 220, width: '100%' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('tab.memories' as any)}</h1>
        <Flexbox gap={12} horizontal>
          <Input
            allowClear
            className={styles.searchInput}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar álbumes..."
            prefix={<Search size={16} />}
            value={searchTerm}
          />
          <QRScanner
            onScan={(url) => {
              console.log('QR escaneado:', url);
              // La redirección se maneja automáticamente en QRScanner
            }}
          />
          <Button
            className={styles.createButton}
            icon={<Plus size={18} />}
            onClick={handleCreateAlbum}
            type="primary"
          >
            Crear Álbum
          </Button>
        </Flexbox>
      </div>

      {filteredAlbums.length === 0 ? (
        <Center style={{ marginTop: 100 }}>
          <Empty
            description={
              searchTerm
                ? 'No se encontraron álbumes'
                : 'No tienes álbumes. ¡Crea tu primer álbum de momentos!'
            }
            image={<Images size={64} strokeWidth={1} style={{ color: theme.colorTextSecondary }} />}
          >
            {!searchTerm && (
              <Button icon={<Plus size={16} />} onClick={handleCreateAlbum} type="primary">
                Crear mi primer álbum
              </Button>
            )}
          </Empty>
        </Center>
      ) : (
        <div className={styles.grid}>
          {filteredAlbums.map((album) => (
            <AlbumCard album={album} key={album._id} onClick={handleAlbumClick} />
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      <Modal
        cancelText="Cancelar"
        confirmLoading={createLoading}
        okText="Crear Álbum"
        onCancel={() => toggleCreateAlbumModal(false)}
        onOk={handleCreateSubmit}
        open={isCreateAlbumModalOpen}
        title="Crear Nuevo Álbum"
      >
        <Form
          form={form}
          initialValues={{ visibility: 'private' }}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nombre del Álbum"
            name="name"
            rules={[{ message: 'Por favor ingresa un nombre', required: true }]}
          >
            <Input placeholder="Ej: Boda de Ana y Carlos" />
          </Form.Item>

          <Form.Item label="Descripción" name="description">
            <Input.TextArea placeholder="Describe tu álbum..." rows={3} />
          </Form.Item>

          <Form.Item label="Vincular con Evento (Opcional)" name="eventId">
            <Select
              allowClear
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              loading={loadingEvents}
              notFoundContent={loadingEvents ? 'Cargando eventos...' : userEvents.length === 0 ? 'No tienes eventos. Crea uno primero en el chat.' : 'No se encontraron eventos'}
              options={userEvents.map((event: any) => ({
                label: `${event.nombre || event.name || 'Evento sin nombre'} - ${event.fecha ? new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}`,
                value: event.id || event._id,
              }))}
              placeholder="Buscar evento por nombre..."
              showSearch
            />
            <div style={{ color: theme.colorTextSecondary, fontSize: 12, marginTop: 4 }}>
              Si vinculas un evento, podrás invitar a los invitados del evento directamente. El ID del evento se guarda automáticamente.
            </div>
          </Form.Item>

          <Form.Item label="Visibilidad" name="visibility">
            <Radio.Group>
              <Radio value="private">
                <span style={{ fontWeight: 500 }}>Privado</span>
                <div style={{ color: theme.colorTextSecondary, fontSize: 12 }}>
                  Solo tú puedes ver este álbum
                </div>
              </Radio>
              <Radio value="members">
                <span style={{ fontWeight: 500 }}>Colaboradores</span>
                <div style={{ color: theme.colorTextSecondary, fontSize: 12 }}>
                  Solo los miembros invitados pueden ver
                </div>
              </Radio>
              <Radio value="public">
                <span style={{ fontWeight: 500 }}>Público</span>
                <div style={{ color: theme.colorTextSecondary, fontSize: 12 }}>
                  Cualquiera con el enlace puede ver
                </div>
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

MemoriesPage.displayName = 'MemoriesPage';

export default MemoriesPage;
