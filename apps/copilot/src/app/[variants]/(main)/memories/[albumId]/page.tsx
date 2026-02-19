'use client';

import {
  Avatar,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Radio,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import type { MenuProps, UploadProps } from 'antd';
import { createStyles } from 'antd-style';
import {
  ArrowLeft,
  CheckSquare,
  Download,
  Image as ImageIcon,
  Images,
  LogIn,
  MoreVertical,
  QrCode,
  Settings,
  Share2,
  Trash2,
  Upload as UploadIcon,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { memo, useCallback, useEffect, useState, useRef } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { useMemoriesStore } from '@/store/memories';
import { useUserStore } from '@/store/user';
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
        console.warn('⚠️ Error parseando rawConfig en memories/[albumId]:', parseError);
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

const useStyles = createStyles(({ css, token }) => ({
  backButton: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 8px;
    padding-inline: 12px;
    border-radius: ${token.borderRadius}px;

    color: ${token.colorTextSecondary};

    transition: all 0.2s;

    &:hover {
      color: ${token.colorText};
      background: ${token.colorBgTextHover};
    }
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
  headerInfo: css`
    flex: 1;
  `,

loginCard: css`
    max-width: 420px;
    padding: 40px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 16px;

    text-align: center;

    background: ${token.colorBgContainer};
  `,

// Estilos para login requerido
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

    &:hover .media-overlay {
      opacity: 1;
    }
  `,

mediaItemSelected: css`
    border: 3px solid ${token.colorPrimary} !important;
    box-shadow: 0 0 0 2px ${token.colorPrimaryBg};
  `,

mediaOverlay: css`
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    opacity: 0;
    background: rgb(0 0 0 / 40%);

    transition: opacity 0.2s;
  `,

mediaThumbnail: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,

memberItem: css`
    display: flex;
    gap: 12px;
    align-items: center;

    padding: 12px;
    border-radius: ${token.borderRadius}px;

    background: ${token.colorBgContainer};
  `,

memberRole: css`
    padding-block: 2px;
    padding-inline: 8px;
    border-radius: 4px;

    font-size: 12px;
    color: ${token.colorTextSecondary};

    background: ${token.colorBgTextHover};
  `,

membersList: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-block-start: 16px;
  `,

  stats: css`
    display: flex;
    gap: 16px;

    margin-block-start: 8px;

    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  subtitle: css`
    margin-block: 4px 0;
    margin-inline: 0;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  tabContent: css`
    padding-block: 16px;
padding-inline: 0;
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

const AlbumDetailPage = memo(() => {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const params = useParams();
  const albumId = params.albumId as string;

  // ✅ CORREGIDO: Usar dev-login en lugar de LobeChat auth
  const { isAuthenticated, devUserId, isChecking } = useDevUserAuth();
  const userId = devUserId;
  const isSignedIn = isAuthenticated;
  const openLogin = useUserStore((s) => s.openLogin);
  const { development } = useDevelopment();

  const {
    currentAlbum,
    currentAlbumLoading,
    currentAlbumMedia,
    mediaLoading,
    currentAlbumMembers,
    membersLoading,
    isInviteModalOpen,
    selectedMediaIds,
    currentAlbumError,
    mediaError,
    membersError,
    fetchAlbum,
    fetchAlbumMedia,
    fetchAlbumMembers,
    deleteMedia,
    clearCurrentAlbum,
    toggleInviteModal,
    generateShareLink,
    uploadMedia,
    inviteMember,
    updateAlbum,
    deleteAlbum,
    getEventGuests,
    sendQrToGuests,
    setSelectedMediaIds,
  } = useMemoriesStore();

  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [inviteForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [inviteLoading, setInviteLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState<'manual' | 'event'>('manual');
  const [eventGuests, setEventGuests] = useState<any[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [sendQrModalOpen, setSendQrModalOpen] = useState(false);
  const [sendQrLoading, setSendQrLoading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const isMountedRef = useRef(true);

  // Load album data
  useEffect(() => {
    // Reset flag al montar
    isMountedRef.current = true;

    // Solo cargar si tenemos los datos necesarios
    if (!albumId || !userId) {
      return;
    }

    // AbortController para cancelar requests
    const abortController = new AbortController();

    // Función para cargar datos de forma segura
    const loadData = async () => {
      // Verificar montaje antes de cada operación
      if (!isMountedRef.current || !albumId || !userId || abortController.signal.aborted) {
        return;
      }

      try {
        // Cargar en paralelo pero con verificación de montaje
        const [albumResult, mediaResult, membersResult] = await Promise.allSettled([
          fetchAlbum(albumId, userId, development),
          fetchAlbumMedia(albumId, userId, development),
          fetchAlbumMembers(albumId, userId, development),
        ]);

        // Verificar montaje después de las llamadas
        if (!isMountedRef.current || abortController.signal.aborted) {
          return;
        }

        // Log errores si hay pero no romper el flujo
        if (albumResult.status === 'rejected') {
          console.error('Error loading album:', albumResult.reason);
        }
        if (mediaResult.status === 'rejected') {
          console.error('Error loading media:', mediaResult.reason);
        }
        if (membersResult.status === 'rejected') {
          console.error('Error loading members:', membersResult.reason);
        }
      } catch (error) {
        // Solo loguear si el componente sigue montado y no fue cancelado
        if (isMountedRef.current && !abortController.signal.aborted) {
          console.error('Error loading album data:', error);
        }
      }
    };

    // Ejecutar carga
    loadData();

    // Cleanup
    return () => {
      isMountedRef.current = false;
      abortController.abort();
      // Limpiar solo si realmente se desmonta
      clearCurrentAlbum();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId, userId, development]);

  const loadEventGuests = useCallback(async () => {
    if (!currentAlbum?.eventId) return;

    setLoadingGuests(true);
    try {
      const guests = await getEventGuests(currentAlbum.eventId, development);
      if (guests && Array.isArray(guests)) {
        setEventGuests(guests);
        if (guests.length === 0) {
          message.info('No se encontraron invitados para este evento');
        }
      } else {
        setEventGuests([]);
        message.warning('No se pudieron cargar los invitados del evento');
      }
    } catch (error) {
      console.error('Error loading guests:', error);
      message.error('Error al cargar invitados del evento');
      setEventGuests([]);
    } finally {
      setLoadingGuests(false);
    }
  }, [currentAlbum?.eventId, development, getEventGuests]);

  // Cargar invitados del evento si el álbum está vinculado a un evento
  useEffect(() => {
    if (!currentAlbum?.eventId || inviteMode !== 'event' || !isMountedRef.current) {
      return;
    }

    const abortController = new AbortController();

    loadEventGuests().catch((error) => {
      if (isMountedRef.current && !abortController.signal.aborted) {
        console.error('Error loading event guests:', error);
      }
    });

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAlbum?.eventId, inviteMode, loadEventGuests]);

  const handleBack = useCallback(() => {
    router.push('/memories');
  }, [router]);

  const handleMediaClick = useCallback((mediaId: string, e?: React.MouseEvent) => {
    if (selectionMode) {
      // En modo selección, toggle la selección
      e?.stopPropagation();
      if (selectedMediaIds.includes(mediaId)) {
        setSelectedMediaIds(selectedMediaIds.filter((id) => id !== mediaId));
      } else {
        setSelectedMediaIds([...selectedMediaIds, mediaId]);
      }
    } else {
      // Modo normal, abrir modal
      setSelectedMedia(mediaId);
    }
  }, [selectionMode, selectedMediaIds, setSelectedMediaIds]);

  const handleDeleteMedia = useCallback(
    async (mediaId: string) => {
      if (!userId) return;

      Modal.confirm({
        cancelText: 'Cancelar',
        content: 'Esta acción no se puede deshacer.',
        okText: 'Eliminar',
        okType: 'danger',
        onOk: async () => {
          await deleteMedia(albumId, mediaId, userId, development);
          message.success('Foto eliminada');
        },
        title: '¿Eliminar esta foto?',
      });
    },
    [albumId, userId, deleteMedia],
  );

  const handleShare = useCallback(async () => {
    if (!userId) return;

    setLoadingQr(true);
    try {
      const result = await generateShareLink(albumId, userId, 30, development);
      if (result) {
        // Build share URL from the current origin so it's always correct regardless
        // of what APP_URL the backend has configured.
        // Include ?development= so the shared page knows which brand it's for,
        // even when opened from an unmapped subdomain (e.g. chat-test.bodasdehoy.com).
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const token = result.shareToken;
        const baseUrl = token ? `${origin}/memories/shared/${token}` : result.shareUrl;
        const correctShareUrl = `${baseUrl}?development=${development}`;
        setShareUrl(correctShareUrl);

        // Generar QR Code directamente desde el frontend con la URL correcta
        // (evita que el backend use APP_URL incorrecto)
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(correctShareUrl)}`;
        setQrUrl(qrApiUrl);

        setShareModalOpen(true);
      } else {
        message.error('Error al generar el enlace de compartir');
      }
    } catch (error) {
      console.error('Error in handleShare:', error);
      message.error('Error al generar el enlace de compartir');
    } finally {
      setLoadingQr(false);
    }
  }, [albumId, userId, development, generateShareLink]);

  const handleCopyShareLink = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      message.success('Enlace copiado al portapapeles');
    }
  }, [shareUrl]);

  const handleInviteSubmit = useCallback(async () => {
    if (!userId) return;

    try {
      setInviteLoading(true);

      if (inviteMode === 'event' && selectedGuests.length > 0) {
        // Invitar múltiples invitados del evento
        let successCount = 0;
        let errorCount = 0;

        for (const guestId of selectedGuests) {
          const guest = eventGuests.find((g) => g._id === guestId || g.id === guestId);
          if (guest?.email) {
            const result = await inviteMember(albumId, guest.email, 'viewer', userId, development);
            if (result) {
              successCount++;
            } else {
              errorCount++;
            }
          }
        }

        if (successCount > 0) {
          message.success(`${successCount} invitación(es) enviada(s) correctamente`);
        }
        if (errorCount > 0) {
          message.warning(`${errorCount} invitación(es) fallaron`);
        }

        setSelectedGuests([]);
        toggleInviteModal(false);
        fetchAlbumMembers(albumId, userId, development);
      } else {
        // Invitación manual
        const values = await inviteForm.validateFields();
      const result = await inviteMember(albumId, values.email, values.role, userId, development);
      if (result) {
        message.success('Invitación enviada correctamente');
        inviteForm.resetFields();
        toggleInviteModal(false);
        fetchAlbumMembers(albumId, userId, development);
      } else {
        message.error('Error al enviar la invitación');
      }
      }
    } catch (error) {
      console.error('Error inviting:', error);
      message.error('Error al enviar invitaciones');
    } finally {
      setInviteLoading(false);
    }
  }, [userId, albumId, development, inviteForm, inviteMember, toggleInviteModal, fetchAlbumMembers, inviteMode, selectedGuests, eventGuests]);

  const handleSendQrToGuests = useCallback(async () => {
    if (!userId || !shareUrl) {
      message.warning('Primero genera el enlace de compartir');
      return;
    }

    if (selectedGuests.length === 0) {
      message.warning('Selecciona al menos un invitado');
      return;
    }

      setSendQrLoading(true);
    try {
      message.loading({ content: 'Enviando QR a invitados...', key: 'sendQr' });

      // Determinar método de envío (por ahora email por defecto)
      const method = 'email'; // TODO: Agregar selector en el modal

      const result = await sendQrToGuests(albumId, selectedGuests, method, userId, development);

      if (result && result.success) {
        message.success({
          content: `QR enviado a ${result.sent_count} invitado(s)${result.failed_count > 0 ? `, ${result.failed_count} fallaron` : ''}`,
          duration: 5,
          key: 'sendQr',
        });
        setSendQrModalOpen(false);
        setSelectedGuests([]);
      } else {
        message.error({ content: 'Error al enviar QR', key: 'sendQr' });
      }
    } catch (error) {
      console.error('Error sending QR:', error);
      message.error({ content: 'Error al enviar QR', key: 'sendQr' });
    } finally {
      setSendQrLoading(false);
    }
  }, [userId, shareUrl, albumId, selectedGuests, development, sendQrToGuests]);

  const handleSettingsSubmit = useCallback(async () => {
    if (!userId) return;

    try {
      const values = await settingsForm.validateFields();
      setSettingsLoading(true);

      await updateAlbum(albumId, {
        description: values.description,
        name: values.name,
        settings: {
          allow_comments: values.allow_comments,
          allow_downloads: values.allow_downloads,
          allow_reactions: values.allow_reactions,
        },
        visibility: values.visibility,
      }, userId, development);

      message.success('Configuración actualizada');
      setSettingsModalOpen(false);
      fetchAlbum(albumId, userId, development);
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('Error al actualizar la configuración');
    } finally {
      setSettingsLoading(false);
    }
  }, [userId, albumId, development, settingsForm, updateAlbum, fetchAlbum]);

  const handleDeleteAlbum = useCallback(async () => {
    if (!userId) return;

    Modal.confirm({
      cancelText: 'Cancelar',
      content: 'Esta acción no se puede deshacer. Se eliminarán todas las fotos y se removerán todos los miembros.',
      okText: 'Eliminar',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteAlbum(albumId, userId, development);
          message.success('Álbum eliminado');
          router.push('/memories');
        } catch {
          message.error('Error al eliminar el álbum');
        }
      },
      title: '¿Eliminar este álbum?',
    });
  }, [albumId, userId, development, deleteAlbum, router]);

  const handleDownloadAll = useCallback(async () => {
    if (currentAlbumMedia.length === 0) {
      message.warning('No hay fotos para descargar');
      return;
    }

    message.loading({ content: 'Preparando descarga...', key: 'download' });

    // Descargar todas las fotos una por una
    // TODO: Implementar descarga ZIP en backend
    try {
      for (const media of currentAlbumMedia) {
        const link = document.createElement('a');
        link.href = media.originalUrl;
        link.download = media.caption || `foto-${media._id}`;
        link.target = '_blank';
        document.body.append(link);
        link.click();
        link.remove();
        // Pequeño delay para no saturar
        await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      }
      message.success({ content: 'Descarga iniciada', key: 'download' });
    } catch {
      message.error({ content: 'Error al descargar', key: 'download' });
    }
  }, [currentAlbumMedia]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedMediaIds.length === 0) {
      message.warning('No hay fotos seleccionadas');
      return;
    }

    message.loading({ content: `Descargando ${selectedMediaIds.length} foto(s)...`, key: 'downloadSelected' });

    try {
      const selectedMedia = currentAlbumMedia.filter((m) => selectedMediaIds.includes(m._id));
      for (const media of selectedMedia) {
        const link = document.createElement('a');
        link.href = media.originalUrl;
        link.download = media.caption || `foto-${media._id}`;
        link.target = '_blank';
        document.body.append(link);
        link.click();
        link.remove();
        await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      }
      message.success({ content: `Descarga de ${selectedMediaIds.length} foto(s) iniciada`, key: 'downloadSelected' });
      setSelectedMediaIds([]);
      setSelectionMode(false);
    } catch {
      message.error({ content: 'Error al descargar', key: 'downloadSelected' });
    }
  }, [selectedMediaIds, currentAlbumMedia, setSelectedMediaIds]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedMediaIds.length === 0) {
      message.warning('No hay fotos seleccionadas');
      return;
    }

    Modal.confirm({
      cancelText: 'Cancelar',
      content: `¿Eliminar ${selectedMediaIds.length} foto(s) seleccionada(s)? Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      onOk: async () => {
        if (!userId) return;

        message.loading({ content: `Eliminando ${selectedMediaIds.length} foto(s)...`, key: 'deleteSelected' });

        let successCount = 0;
        let errorCount = 0;

        for (const mediaId of selectedMediaIds) {
          try {
            await deleteMedia(albumId, mediaId, userId, development);
            successCount++;
          } catch (error) {
            console.error(`Error deleting media ${mediaId}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          message.success({ content: `${successCount} foto(s) eliminada(s)`, key: 'deleteSelected' });
        }
        if (errorCount > 0) {
          message.warning({ content: `${errorCount} foto(s) no se pudieron eliminar`, key: 'deleteSelected' });
        }

        setSelectedMediaIds([]);
        setSelectionMode(false);
        fetchAlbumMedia(albumId, userId, development);
      },
      title: 'Confirmar eliminación',
    });
  }, [selectedMediaIds, userId, albumId, development, deleteMedia, setSelectedMediaIds, fetchAlbumMedia]);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Al desactivar, limpiar selección
      setSelectedMediaIds([]);
    }
  }, [selectionMode, setSelectedMediaIds]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!userId) {
        message.error('Debes iniciar sesion para subir archivos');
        return;
      }

      setUploading(true);
      message.loading({ content: 'Subiendo archivo...', key: 'upload' });

      try {
        const result = await uploadMedia(albumId, file, userId, undefined, development);
        if (result) {
          message.success({ content: 'Archivo subido correctamente', key: 'upload' });
          // Refrescar media
          fetchAlbumMedia(albumId, userId, development);
        } else {
          message.error({ content: 'Error al subir el archivo', key: 'upload' });
        }
      } catch (error) {
        console.error('Upload error:', error);
        message.error({ content: 'Error al subir el archivo', key: 'upload' });
      } finally {
        setUploading(false);
      }
    },
    [albumId, userId, development, uploadMedia, fetchAlbumMedia],
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

  const moreMenuItems: MenuProps['items'] = [
    {
      icon: <Share2 size={16} />,
      key: 'share',
      label: 'Compartir álbum',
      onClick: handleShare,
    },
    {
      icon: <QrCode size={16} />,
      key: 'qr',
      label: 'Generar QR',
      onClick: handleShare,
    },
    { type: 'divider' },
    {
      icon: <Settings size={16} />,
      key: 'settings',
      label: 'Configuración',
      onClick: () => {
        if (currentAlbum) {
          settingsForm.setFieldsValue({
            allow_comments: currentAlbum.settings?.allow_comments ?? true,
            allow_downloads: currentAlbum.settings?.allow_downloads ?? true,
            allow_reactions: currentAlbum.settings?.allow_reactions ?? true,
            description: currentAlbum.description,
            name: currentAlbum.name,
            visibility: currentAlbum.visibility,
          });
        }
        setSettingsModalOpen(true);
      },
    },
    {
      icon: <Download size={16} />,
      key: 'download',
      label: 'Descargar todo',
      onClick: handleDownloadAll,
    },
    { type: 'divider' },
    {
      danger: true,
      icon: <Trash2 size={16} />,
      key: 'delete',
      label: 'Eliminar álbum',
      onClick: handleDeleteAlbum,
    },
  ];

  // Mostrar loading mientras verifica autenticación
  if (isChecking) {
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

  // Mostrar pantalla de login si el usuario no está autenticado
  if (!isSignedIn || !userId) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginIcon}>
            <Images color={theme.colorPrimary} size={40} strokeWidth={1.5} />
          </div>
          <h2 className={styles.loginTitle}>Inicia sesión para ver este álbum</h2>
          <p className={styles.loginSubtitle}>
            Para acceder a los álbumes de Momentos necesitas tener una cuenta.
          </p>
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
              icon={<ArrowLeft size={18} />}
              onClick={() => router.push('/memories')}
              size="large"
            >
              Volver
            </Button>
          </Flexbox>
        </div>
      </div>
    );
  }

  // No mostrar loading aquí, usar loading.tsx de Next.js
  // if (currentAlbumLoading) {
  //   return (
  //     <div className={styles.container}>
  //       <Skeleton active paragraph={{ rows: 4 }} />
  //     </div>
  //   );
  // }

  // Manejar error de álbum
  if (currentAlbumError && !currentAlbumLoading) {
    return (
      <div className={styles.container}>
        <Center style={{ height: 400 }}>
          <Empty description={currentAlbumError || 'Error al cargar el álbum'}>
            <Flexbox gap={8} horizontal>
              <Button onClick={handleBack}>Volver a Momentos</Button>
              <Button
                onClick={() => {
                  if (albumId && userId && isMountedRef.current) {
                    fetchAlbum(albumId, userId, development);
                    fetchAlbumMedia(albumId, userId, development);
                    fetchAlbumMembers(albumId, userId, development);
                  }
                }}
                type="primary"
              >
                Reintentar
              </Button>
            </Flexbox>
          </Empty>
        </Center>
      </div>
    );
  }

  if (!currentAlbum) {
    return (
      <div className={styles.container}>
        <Center style={{ height: 400 }}>
          <Empty description="Álbum no encontrado">
            <Button onClick={handleBack}>Volver a Momentos</Button>
          </Empty>
        </Center>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    editor: 'Editor',
    owner: 'Propietario',
    viewer: 'Visualizador',
  };

  // Si está cargando y no hay error, mostrar skeleton
  if (currentAlbumLoading && !currentAlbum) {
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>Volver</span>
          </div>
          <h1 className={styles.title}>{currentAlbum.name}</h1>
          {currentAlbum.description && (
            <p className={styles.subtitle}>{currentAlbum.description}</p>
          )}
          <div className={styles.stats}>
            <span>{currentAlbum.mediaCount} fotos</span>
            <span>{currentAlbum.memberCount} miembros</span>
          </div>
        </div>

        <Flexbox gap={8} horizontal>
          {selectionMode ? (
            <>
              <Button
                onClick={handleToggleSelectionMode}
                type="default"
              >
                Cancelar ({selectedMediaIds.length})
              </Button>
              <Button
                danger
                disabled={selectedMediaIds.length === 0}
                icon={<Trash2 size={16} />}
                onClick={handleDeleteSelected}
              >
                Eliminar ({selectedMediaIds.length})
              </Button>
              <Button
                disabled={selectedMediaIds.length === 0}
                icon={<Download size={16} />}
                onClick={handleDownloadSelected}
                type="primary"
              >
                Descargar ({selectedMediaIds.length})
              </Button>
            </>
          ) : (
            <>
              <Upload {...uploadProps}>
                <Button icon={<UploadIcon size={16} />} type="primary">
                  Subir Fotos
                </Button>
              </Upload>
              <Button
                icon={<CheckSquare size={16} />}
                onClick={handleToggleSelectionMode}
              >
                Seleccionar
              </Button>
              <Button icon={<UserPlus size={16} />} onClick={() => toggleInviteModal(true)}>
                Invitar
              </Button>
              <Button icon={<Share2 size={16} />} loading={loadingQr} onClick={handleShare} type="primary">
                Compartir / QR
              </Button>
              <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight">
                <Button icon={<MoreVertical size={16} />} />
              </Dropdown>
            </>
          )}
        </Flexbox>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        items={[
          {
            children: (
              <div className={styles.tabContent}>
                {mediaError && (
                  <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4, marginBottom: 16, padding: 12 }}>
                    <div style={{ color: '#ff4d4f', fontWeight: 500 }}>Error al cargar fotos: {mediaError}</div>
                    <Button
                      onClick={() => fetchAlbumMedia(albumId, userId!, development)}
                      size="small"
                      style={{ marginTop: 8 }}
                    >
                      Reintentar
                    </Button>
                  </div>
                )}
                {mediaLoading ? (
                  <div className={styles.gallery}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton.Image
                        active
                        key={i}
                        style={{ aspectRatio: '1', height: 'auto', width: '100%' }}
                      />
                    ))}
                  </div>
                ) : currentAlbumMedia.length === 0 ? (
                  <Upload {...uploadProps}>
                    <div className={styles.emptyUpload}>
                      <UploadIcon size={48} strokeWidth={1.5} />
                      <div style={{ fontSize: 16 }}>Arrastra fotos aquí o haz clic para subir</div>
                      <div style={{ fontSize: 12 }}>Soporta imágenes y videos</div>
                    </div>
                  </Upload>
                ) : (
                  <div className={styles.gallery}>
                    {currentAlbumMedia.map((media) => {
                      const isSelected = selectedMediaIds.includes(media._id);
                      return (
                        <div
                          className={`${styles.mediaItem} ${isSelected ? styles.mediaItemSelected : ''}`}
                          key={media._id}
                          onClick={(e) => handleMediaClick(media._id, e)}
                        >
                          {selectionMode && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                left: 8,
                                position: 'absolute',
                                top: 8,
                                zIndex: 10,
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (e.target.checked) {
                                    setSelectedMediaIds([...selectedMediaIds, media._id]);
                                  } else {
                                    setSelectedMediaIds(selectedMediaIds.filter((id) => id !== media._id));
                                  }
                                }}
                              />
                            </div>
                          )}
                          <img
                            alt={media.caption || ''}
                            className={styles.mediaThumbnail}
                            src={media.thumbnailUrl || media.originalUrl}
                          />
                          {media.mediaType === 'video' && (
                            <div className={styles.videoIndicator}>
                              <Video size={16} />
                            </div>
                          )}
                          {!selectionMode && (
                            <div className={`${styles.mediaOverlay} media-overlay`}>
                              <Flexbox gap={8} horizontal>
                                <Button
                                  ghost
                                  icon={<Download size={16} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(media.originalUrl, '_blank');
                                  }}
                                />
                                <Button
                                  danger
                                  ghost
                                  icon={<Trash2 size={16} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMedia(media._id);
                                  }}
                                />
                              </Flexbox>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
            icon: <ImageIcon size={16} />,
            key: 'gallery',
            label: 'Galería',
          },
          {
            children: (
              <div className={styles.tabContent}>
                <Flexbox gap={12} horizontal style={{ marginBottom: 16 }}>
                  <Button icon={<UserPlus size={16} />} onClick={() => toggleInviteModal(true)}>
                    Invitar Miembro
                  </Button>
                </Flexbox>

                {membersError && (
                  <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4, marginBottom: 16, padding: 12 }}>
                    <div style={{ color: '#ff4d4f', fontWeight: 500 }}>Error al cargar miembros: {membersError}</div>
                    <Button
                      onClick={() => fetchAlbumMembers(albumId, userId!, development)}
                      size="small"
                      style={{ marginTop: 8 }}
                    >
                      Reintentar
                    </Button>
                  </div>
                )}
                {membersLoading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : (
                  <div className={styles.membersList}>
                    {currentAlbumMembers.map((member) => (
                      <div className={styles.memberItem} key={member.userId}>
                        <Avatar src={member.userAvatar}>
                          {member.userName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>
                            {member.userName || member.userEmail}
                          </div>
                          <div style={{ color: theme.colorTextSecondary, fontSize: 12 }}>
                            {member.userEmail}
                          </div>
                        </div>
                        <span className={styles.memberRole}>{roleLabels[member.role]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
            icon: <Users size={16} />,
            key: 'members',
            label: `Miembros (${currentAlbumMembers.length})`,
          },
        ]}
        onChange={setActiveTab}
      />

      {/* Share Modal */}
      <Modal
        footer={[
          <Button key="close" onClick={() => setShareModalOpen(false)}>
            Cerrar
          </Button>,
          <Button key="copy" onClick={handleCopyShareLink} type="primary">
            Copiar Enlace
          </Button>,
          qrUrl && (
            <>
              <Button
                icon={<Download size={16} />}
                key="download-qr"
                onClick={() => {
                  if (qrUrl) {
                    const link = document.createElement('a');
                    link.href = qrUrl;
                    link.download = `album-${albumId}-qr.png`;
                    link.click();
                  }
                }}
              >
                Descargar QR
              </Button>
              {currentAlbum?.eventId && (
                <Button
                  icon={<UserPlus size={16} />}
                  key="send-qr"
                  onClick={() => {
                    loadEventGuests();
                    setSendQrModalOpen(true);
                  }}
                  type="default"
                >
                  Enviar QR a Invitados
                </Button>
              )}
            </>
          ),
        ]}
        onCancel={() => setShareModalOpen(false)}
        open={shareModalOpen}
        title="Compartir Álbum"
        width={420}
      >
        <Flexbox align="center" gap={20} style={{ flexDirection: 'column', padding: '16px 0' }}>
          {/* QR grande y centrado */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: theme.colorTextSecondary, fontSize: 13, marginBottom: 12 }}>
              Escanea el QR con la cámara o comparte el enlace para que otros suban sus fotos
            </p>
            {loadingQr ? (
              <Skeleton.Image active style={{ height: 220, width: 220 }} />
            ) : qrUrl ? (
              <img
                alt="QR Code"
                src={qrUrl}
                style={{
                  borderRadius: 12,
                  boxShadow: `0 4px 20px ${theme.colorPrimaryBg}`,
                  height: 220,
                  width: 220,
                }}
              />
            ) : (
              <QrCode size={220} strokeWidth={1} />
            )}
          </div>

          {/* URL copiable */}
          <div style={{ width: '100%' }}>
            <div style={{ color: theme.colorTextSecondary, fontSize: 12, marginBottom: 6 }}>
              Enlace del álbum:
            </div>
            <div
              onClick={handleCopyShareLink}
              style={{
                background: theme.colorBgTextHover,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                padding: '10px 14px',
                wordBreak: 'break-all',
              }}
              title="Haz clic para copiar"
            >
              {shareUrl || 'Generando enlace...'}
            </div>
            <div style={{ color: theme.colorTextSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
              Haz clic en el enlace para copiar
            </div>
          </div>
        </Flexbox>
      </Modal>

      {/* Invite Modal */}
      <Modal
        cancelText="Cancelar"
        confirmLoading={inviteLoading}
        okText={inviteMode === 'event' ? 'Invitar Seleccionados' : 'Enviar Invitación'}
        onCancel={() => {
          toggleInviteModal(false);
          setInviteMode('manual');
          setSelectedGuests([]);
          inviteForm.resetFields();
        }}
        onOk={handleInviteSubmit}
        open={isInviteModalOpen}
        title="Invitar al Álbum"
        width={600}
      >
        {currentAlbum?.eventId ? (
          <div style={{ marginBottom: 16 }}>
            <Radio.Group
              onChange={(e) => {
                setInviteMode(e.target.value);
                if (e.target.value === 'event') {
                  loadEventGuests();
                }
              }}
              style={{ marginBottom: 16 }}
              value={inviteMode}
            >
              <Radio value="manual">Invitar manualmente</Radio>
              <Radio value="event">Desde invitados del evento</Radio>
            </Radio.Group>
          </div>
        ) : null}

        {inviteMode === 'event' && currentAlbum?.eventId ? (
          <div>
            {loadingGuests ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : eventGuests.length > 0 ? (
              <div>
                <p style={{ marginBottom: 12 }}>
                  Selecciona los invitados del evento que quieres invitar:
                </p>
                <List
                  dataSource={eventGuests}
                  renderItem={(guest) => (
                    <List.Item>
                      <Checkbox
                        checked={selectedGuests.includes(guest._id || guest.id)}
                        onChange={(e) => {
                          const guestId = guest._id || guest.id;
                          if (e.target.checked) {
                            setSelectedGuests([...selectedGuests, guestId]);
                          } else {
                            setSelectedGuests(selectedGuests.filter((id) => id !== guestId));
                          }
                        }}
                      >
                        <div style={{ marginLeft: 8 }}>
                          <div style={{ fontWeight: 500 }}>
                            {guest.nombre || guest.name || 'Sin nombre'}
                          </div>
                          <div style={{ color: theme.colorTextSecondary, fontSize: 12 }}>
                            {guest.email && <span>{guest.email}</span>}
                            {guest.telefono && guest.email && <span> • </span>}
                            {guest.telefono && <span>{guest.telefono}</span>}
                          </div>
                        </div>
                      </Checkbox>
                    </List.Item>
                  )}
                  style={{ maxHeight: 300, overflowY: 'auto' }}
                />
                {selectedGuests.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="blue">{selectedGuests.length} invitado(s) seleccionado(s)</Tag>
                  </div>
                )}
              </div>
            ) : (
              <Empty
                description="No se encontraron invitados del evento"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        ) : (
          <Form
            form={inviteForm}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { message: 'Por favor ingresa un email', required: true },
                { message: 'Email inválido', type: 'email' },
              ]}
            >
              <Input placeholder="email@ejemplo.com" />
            </Form.Item>

            <Form.Item
              initialValue="viewer"
              label="Rol"
              name="role"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="viewer">Visualizador - Solo puede ver</Select.Option>
                <Select.Option value="editor">Editor - Puede subir y ver</Select.Option>
                <Select.Option value="admin">Administrador - Puede gestionar miembros</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Send QR to Guests Modal */}
      <Modal
        cancelText="Cancelar"
        confirmLoading={sendQrLoading}
        okText="Enviar QR"
        onCancel={() => {
          setSendQrModalOpen(false);
          setSelectedGuests([]);
        }}
        onOk={handleSendQrToGuests}
        open={sendQrModalOpen}
        title="Enviar QR a Invitados"
        width={600}
      >
        {currentAlbum?.eventId ? (
          <div>
            <p style={{ marginBottom: 12 }}>
              Selecciona los invitados a los que quieres enviar el QR del álbum:
            </p>
            {loadingGuests ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : eventGuests.length > 0 ? (
              <List
                dataSource={eventGuests}
                renderItem={(guest) => (
                  <List.Item>
                    <Checkbox
                      checked={selectedGuests.includes(guest._id || guest.id)}
                      onChange={(e) => {
                        const guestId = guest._id || guest.id;
                        if (e.target.checked) {
                          setSelectedGuests([...selectedGuests, guestId]);
                        } else {
                          setSelectedGuests(selectedGuests.filter((id) => id !== guestId));
                        }
                      }}
                    >
                      <div style={{ marginLeft: 8 }}>
                        <div style={{ fontWeight: 500 }}>
                          {guest.nombre || guest.name || 'Sin nombre'}
                        </div>
                        <div style={{ color: theme.colorTextSecondary, fontSize: 12 }}>
                          {guest.email && <span>{guest.email}</span>}
                          {guest.telefono && guest.email && <span> • </span>}
                          {guest.telefono && <span>{guest.telefono}</span>}
                        </div>
                      </div>
                    </Checkbox>
                  </List.Item>
                )}
                style={{ maxHeight: 300, overflowY: 'auto' }}
              />
            ) : (
              <Empty description="No se encontraron invitados del evento" />
            )}
          </div>
        ) : (
          <p>Este álbum no está vinculado a un evento.</p>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        cancelText="Cancelar"
        confirmLoading={settingsLoading}
        okText="Guardar Cambios"
        onCancel={() => setSettingsModalOpen(false)}
        onOk={handleSettingsSubmit}
        open={settingsModalOpen}
        title="Configuración del Álbum"
        width={600}
      >
        <Form
          form={settingsForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nombre del Álbum"
            name="name"
            rules={[{ message: 'Por favor ingresa un nombre', required: true }]}
          >
            <Input placeholder="Nombre del álbum" />
          </Form.Item>

          <Form.Item label="Descripción" name="description">
            <Input.TextArea placeholder="Descripción del álbum..." rows={3} />
          </Form.Item>

          <Form.Item label="Visibilidad" name="visibility">
            <Radio.Group>
              <Radio value="private">Privado</Radio>
              <Radio value="members">Solo miembros</Radio>
              <Radio value="public">Público</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Permisos">
            <Form.Item name="allow_downloads" noStyle valuePropName="checked">
              <Switch /> Permitir descargas
            </Form.Item>
            <br />
            <Form.Item name="allow_comments" noStyle style={{ marginTop: 8 }} valuePropName="checked">
              <Switch /> Permitir comentarios
            </Form.Item>
            <br />
            <Form.Item name="allow_reactions" noStyle style={{ marginTop: 8 }} valuePropName="checked">
              <Switch /> Permitir reacciones
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>

      {/* Media Viewer Modal */}
      <Modal
        centered
        footer={null}
        onCancel={() => setSelectedMedia(null)}
        open={!!selectedMedia}
        width="90%"
      >
        {selectedMedia && (
          <div style={{ display: 'flex', justifyContent: 'center', maxHeight: '80vh' }}>
            {(() => {
              const media = currentAlbumMedia.find((m) => m._id === selectedMedia);
              if (!media) return null;

              if (media.mediaType === 'video') {
                return (
                  <video
                    controls
                    src={media.originalUrl}
                    style={{ maxHeight: '80vh', maxWidth: '100%' }}
                  />
                );
              }

              return (
                <img
                  alt={media.caption || ''}
                  src={media.originalUrl}
                  style={{ maxHeight: '80vh', maxWidth: '100%', objectFit: 'contain' }}
                />
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
});

AlbumDetailPage.displayName = 'AlbumDetailPage';

export default AlbumDetailPage;
