'use client';

import { Button, Empty, Skeleton, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Download, LogIn, Upload as UploadIcon, UserPlus, Video } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { useUserStore } from '@/store/user';
import { getCurrentDevelopment } from '@/utils/developmentDetector';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    overflow-y: auto;

    width: 100%;
    max-width: 1400px;
    height: 100%;
    margin-block: 0;
    margin-inline: auto;
    padding: 24px;
  `,
  emptyUpload: css`
    cursor: pointer;

    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;

    height: 300px;
    padding: 40px;
    border: 2px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    color: ${token.colorTextSecondary};

    background: ${token.colorBgContainer};

    transition: all 0.2s;

    &:hover {
      border-color: ${token.colorPrimary};
      background: ${token.colorPrimaryBg};
    }
  `,
  gallery: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-block-start: 20px;
  `,
  header: css`
    display: flex;
    gap: 16px;
    align-items: flex-start;
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
  loginContainer: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;
    padding: 24px;
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
  mediaItem: css`
    cursor: pointer;

    position: relative;

    overflow: hidden;

    aspect-ratio: 1;
    border-radius: ${token.borderRadius}px;

    background: ${token.colorBgContainer};

    transition: all 0.2s;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px ${token.colorPrimaryBg};
    }
  `,
  mediaThumbnail: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,
  subtitle: css`
    margin-block: 4px 0;
    margin-inline: 0;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  title: css`
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  videoIndicator: css`
    position: absolute;
    inset-block-end: 8px;
    inset-inline-end: 8px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 4px;
    border-radius: 4px;

    color: white;

    background: rgb(0 0 0 / 60%);
  `,
}));

/**
 * Hook para verificar autenticación usando dev-login (localStorage)
 */
function useDevUserAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [devUserId, setDevUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    try {
      const rawConfig = localStorage.getItem('dev-user-config');

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

      setIsAuthenticated(isValidUser);
      setDevUserId(isValidUser ? userId : null);
    } catch (error) {
      console.error('Error verificando auth:', error);
      setIsAuthenticated(false);
      setDevUserId(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { devUserId, isAuthenticated, isChecking };
}

const PublicAlbumPage = memo(() => {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const params = useParams();
  const shareToken = params.token as string;
  const openLogin = useUserStore((s) => s.openLogin);

  // Verificar autenticación
  const { devUserId, isAuthenticated, isChecking } = useDevUserAuth();
  const userId = devUserId;

  const [album, setAlbum] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPublicAlbum = async () => {
      if (!shareToken || !isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const development = typeof window !== 'undefined'
          ? getCurrentDevelopment()
          : 'bodasdehoy';

        // Llamar directamente al endpoint
        const response = await fetch(
          `${backendUrl}/api/memories/shared/${shareToken}?development=${development}`
        );

        if (!isMounted) return;

        const result = await response.json();

        if (!isMounted) return;

        if (result.success) {
          setAlbum(result.album);
          setMedia(result.media || []);
        } else {
          setError(result.error || 'Álbum no encontrado o enlace expirado');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading public album:', err);
          setError('Error al cargar el álbum');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPublicAlbum();

    return () => {
      isMounted = false;
    };
  }, [shareToken]);

  const handleMediaClick = useCallback((mediaId: string) => {
    setSelectedMedia(mediaId);
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!userId || !album) {
        message.warning('Debes iniciar sesión para subir fotos');
        return;
      }

      setUploading(true);
      message.loading({ content: 'Subiendo archivo...', key: 'upload' });

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const development = getCurrentDevelopment();

        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams({
          development,
          user_id: userId,
        });

        const response = await fetch(
          `${backendUrl}/api/memories/albums/${album.album_id || album._id}/upload?${params.toString()}`,
          {
            body: formData,
            method: 'POST',
          },
        );

        const result = await response.json();

        if (result.success && result.media) {
          message.success({ content: 'Archivo subido correctamente', key: 'upload' });
          // Recargar media
          const reloadResponse = await fetch(
            `${backendUrl}/api/memories/shared/${shareToken}?development=${development}`
          );
          const reloadResult = await reloadResponse.json();
          if (reloadResult.success) {
            setMedia(reloadResult.media || []);
          }
        } else {
          message.error({ content: result.error || 'Error al subir el archivo', key: 'upload' });
        }
      } catch (error) {
        console.error('Upload error:', error);
        message.error({ content: 'Error al subir el archivo', key: 'upload' });
      } finally {
        setUploading(false);
      }
    },
    [userId, album, shareToken],
  );

  const uploadProps: UploadProps = {
    accept: 'image/*,video/*',
    beforeUpload: (file) => {
      handleUpload(file);
      return false;
    },
    disabled: uploading,
    multiple: true,
    showUploadList: false,
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 4 }} />
        <div className={styles.gallery}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton.Image
              active
              key={i}
              style={{ aspectRatio: '1', height: 'auto', width: '100%' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className={styles.container}>
        <Center style={{ height: 400 }}>
          <Empty description={error || 'Álbum no encontrado'}>
            <Button onClick={() => router.push('/memories')}>Volver a Recuerdos</Button>
          </Empty>
        </Center>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div style={{ flex: 1 }}>
          <h1 className={styles.title}>{album.name}</h1>
          {album.description && <p className={styles.subtitle}>{album.description}</p>}
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 8 }}>
            <span>{media.length} fotos</span>
          </div>
        </div>
        <Flexbox gap={8} horizontal>
          {isAuthenticated ? (
            <Upload {...uploadProps}>
              <Button icon={<UploadIcon size={16} />} loading={uploading} type="primary">
                Subir Fotos
              </Button>
            </Upload>
          ) : (
            <Button
              icon={<LogIn size={16} />}
              onClick={() => {
                const development = getCurrentDevelopment();
                window.location.href = `/login?developer=${development}&redirect=${encodeURIComponent(window.location.pathname)}`;
              }}
              type="primary"
            >
              Iniciar Sesión para Subir
            </Button>
          )}
          <Button icon={<ArrowLeft size={16} />} onClick={() => router.push('/memories')}>
            Volver
          </Button>
        </Flexbox>
      </div>

      {/* Gallery */}
      {media.length === 0 ? (
        <Center style={{ height: 300 }}>
          {isAuthenticated ? (
            <Upload {...uploadProps}>
              <div className={styles.emptyUpload}>
                <UploadIcon size={48} strokeWidth={1.5} />
                <div style={{ fontSize: 16 }}>Arrastra fotos aquí o haz clic para subir</div>
                <div style={{ fontSize: 12 }}>Soporta imágenes y videos</div>
              </div>
            </Upload>
          ) : (
            <div className={styles.loginCard}>
              <div className={styles.loginIcon}>
                <UploadIcon color={theme.colorPrimary} size={40} strokeWidth={1.5} />
              </div>
              <h2 className={styles.loginTitle}>¡Sé el primero en compartir!</h2>
              <p className={styles.loginSubtitle}>
                Inicia sesión o regístrate para subir tus fotos y videos a este álbum compartido.
              </p>
              <Flexbox gap={12}>
                <Button
                  block
                  icon={<LogIn size={18} />}
                  onClick={() => {
                    const development = getCurrentDevelopment();
                    window.location.href = `/login?developer=${development}&redirect=${encodeURIComponent(window.location.pathname)}`;
                  }}
                  size="large"
                  type="primary"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  block
                  icon={<UserPlus size={18} />}
                  onClick={() => {
                    const development = getCurrentDevelopment();
                    window.location.href = `/login?developer=${development}&redirect=${encodeURIComponent(window.location.pathname)}&signup=true`;
                  }}
                  size="large"
                >
                  Registrarse
                </Button>
              </Flexbox>
            </div>
          )}
        </Center>
      ) : (
        <div className={styles.gallery}>
          {media.map((item) => (
            <div
              className={styles.mediaItem}
              key={item._id}
              onClick={() => handleMediaClick(item._id)}
            >
              <img
                alt={item.caption || ''}
                className={styles.mediaThumbnail}
                src={item.thumbnailUrl || item.originalUrl}
              />
              {item.mediaType === 'video' && (
                <div className={styles.videoIndicator}>
                  <Video size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          style={{
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            position: 'fixed',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '90%',
              maxWidth: '90%',
              position: 'relative',
            }}
          >
            {(() => {
              const item = media.find((m) => m._id === selectedMedia);
              if (!item) return null;

              if (item.mediaType === 'video') {
                return (
                  <video
                    controls
                    src={item.originalUrl}
                    style={{ maxHeight: '90vh', maxWidth: '100%' }}
                  />
                );
              }

              return (
                <img
                  alt={item.caption || ''}
                  src={item.originalUrl}
                  style={{ maxHeight: '90vh', maxWidth: '100%', objectFit: 'contain' }}
                />
              );
            })()}
            <Button
              danger
              icon={<ArrowLeft size={16} />}
              onClick={() => setSelectedMedia(null)}
              style={{ position: 'absolute', right: 16, top: 16 }}
            >
              Cerrar
            </Button>
            {(() => {
              const item = media.find((m) => m._id === selectedMedia);
              return album.settings?.allow_downloads && item ? (
                <Button
                  icon={<Download size={16} />}
                  onClick={() => window.open(item.originalUrl, '_blank')}
                  style={{ bottom: 16, position: 'absolute', right: 16 }}
                  type="primary"
                >
                  Descargar
                </Button>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
});

PublicAlbumPage.displayName = 'PublicAlbumPage';

export default PublicAlbumPage;




































