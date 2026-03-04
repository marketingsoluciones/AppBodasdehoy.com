'use client';

import { ActionIcon } from '@lobehub/ui';
import { Button, List, message, Modal, Tag, Upload } from 'antd';
import type { UploadProps } from 'antd';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Share2,
  Trash2,
  Upload as UploadIcon,
  Video,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import PermissionBadge from './PermissionBadge';

interface FileMetadata {
  _id: string;
  category: 'documents' | 'photos' | 'videos' | 'memories';
  content_type: string;
  event_id?: string;
  filename: string;
  owner_id: string;
  shared_with?: Array<{
    permissions: {
      can_delete: boolean;
      can_download: boolean;
      can_view: boolean;
    };
    user_id: string;
  }>;
  size: number;
  uploaded_at: string;
  url: string;
  visibility: 'private' | 'event' | 'public';
}

interface FileManagerWithPermissionsProps {
  allowUpload?: boolean;
  categoryFilter?: FileMetadata['category'][];
  currentUserId: string;
  development?: string;
  eventId?: string;
}

/**
 * Gestor de archivos con sistema de permisos
 * 
 * Características:
 * - Subir archivos (si allowUpload=true)
 * - Ver archivos con permisos
 * - Descargar archivos (si tiene can_download)
 * - Eliminar archivos (si es owner o tiene can_delete)
 * - Compartir archivos (si es owner)
 * - Filtrar por categoría
 */
export const FileManagerWithPermissions = memo<FileManagerWithPermissionsProps>(
  ({
    eventId,
    development = 'bodasdehoy',
    currentUserId,
    allowUpload = true,
    categoryFilter,
  }) => {
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Cargar archivos
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          development,
        });
        if (eventId) params.append('event_id', eventId);
        if (categoryFilter) {
          categoryFilter.forEach((cat) => params.append('category', cat));
        }

        const response = await fetch(`/api/files/list?${params.toString()}`, {
          headers: {
            'X-Development': development,
            'X-User-ID': currentUserId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
        } else {
          message.error('Error al cargar archivos');
        }
      } catch (error) {
        console.error('Error fetching files:', error);
        message.error('Error de red al cargar archivos');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchFiles();
    }, [eventId, development, categoryFilter]);

    // Subir archivo
    const handleUpload: UploadProps['customRequest'] = async (options) => {
      const { file, onSuccess, onError } = options;
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file as File);
        if (eventId) formData.append('event_id', eventId);
        formData.append('development', development);

        const response = await fetch('/api/files/upload', {
          body: formData,
          headers: {
            'X-Development': development,
            'X-User-ID': currentUserId,
          },
          method: 'POST',
        });

        if (response.ok) {
          message.success('Archivo subido exitosamente');
          onSuccess?.(response);
          fetchFiles(); // Recargar lista
        } else {
          const error = await response.json();
          message.error(error.detail || 'Error al subir archivo');
          onError?.(new Error('Upload failed'));
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        message.error('Error de red al subir archivo');
        onError?.(error as Error);
      } finally {
        setUploading(false);
      }
    };

    // Eliminar archivo
    const handleDelete = async (fileId: string, fileName: string) => {
      Modal.confirm({
        cancelText: 'Cancelar',
        content: `¿Estás seguro de eliminar "${fileName}"? Esta acción no se puede deshacer.`,
        okText: 'Eliminar',
        okType: 'danger',
        onOk: async () => {
          try {
            const response = await fetch(`/api/files/${fileId}`, {
              headers: {
                'X-Development': development,
                'X-User-ID': currentUserId,
              },
              method: 'DELETE',
            });

            if (response.ok) {
              message.success('Archivo eliminado');
              fetchFiles();
            } else {
              message.error('Error al eliminar archivo');
            }
          } catch (error) {
            console.error('Error deleting file:', error);
            message.error('Error de red al eliminar archivo');
          }
        },
        title: '¿Eliminar archivo?',
      });
    };

    // Verificar permisos
    const canDelete = (file: FileMetadata): boolean => {
      if (file.owner_id === currentUserId) return true;
      const sharedAccess = file.shared_with?.find((s) => s.user_id === currentUserId);
      return sharedAccess?.permissions.can_delete || false;
    };

    const canDownload = (file: FileMetadata): boolean => {
      if (file.owner_id === currentUserId) return true;
      const sharedAccess = file.shared_with?.find((s) => s.user_id === currentUserId);
      return sharedAccess?.permissions.can_download !== false; // Default true
    };

    // Icono según tipo de archivo
    const getFileIcon = (contentType: string, category: string) => {
      if (contentType.startsWith('image/') || category === 'photos') {
        return <ImageIcon size={18} />;
      }
      if (contentType.startsWith('video/') || category === 'videos') {
        return <Video size={18} />;
      }
      return <FileText size={18} />;
    };

    // Tag de categoría
    const getCategoryTag = (category: FileMetadata['category']) => {
      const colors = {
        documents: 'blue',
        memories: 'orange',
        photos: 'green',
        videos: 'purple',
      };
      return <Tag color={colors[category]}>{category}</Tag>;
    };

    // Tag de visibilidad
    const getVisibilityTag = (visibility: FileMetadata['visibility']) => {
      const config = {
        event: { color: 'cyan', text: 'Evento' },
        private: { color: 'default', text: 'Privado' },
        public: { color: 'green', text: 'Público' },
      };
      const { color, text } = config[visibility];
      return <Tag color={color}>{text}</Tag>;
    };

    return (
      <Flexbox gap={16}>
        {/* Header con botón de subida */}
        {allowUpload && (
          <Flexbox align="center" horizontal justify="space-between">
            <h3 style={{ margin: 0 }}>Archivos</h3>
            <Upload
              accept="image/*,video/*,.pdf,.doc,.docx"
              customRequest={handleUpload}
              multiple
              showUploadList={false}
            >
              <Button
                icon={<UploadIcon size={16} />}
                loading={uploading}
                type="primary"
              >
                Subir Archivo
              </Button>
            </Upload>
          </Flexbox>
        )}

        {/* Lista de archivos */}
        <List
          dataSource={files}
          loading={loading}
          locale={{
            emptyText: eventId
              ? 'No hay archivos en este evento'
              : 'No hay archivos',
          }}
          renderItem={(file) => (
            <List.Item
              actions={[
                canDownload(file) && (
                  <ActionIcon
                    icon={Download}
                    key="download"
                    onClick={() => window.open(file.url, '_blank')}
                    size="small"
                    title="Descargar"
                  />
                ),
                file.owner_id === currentUserId && (
                  <ActionIcon
                    icon={Share2}
                    key="share"
                    size="small"
                    title="Compartir"
                  />
                ),
                canDelete(file) && (
                  <ActionIcon
                    icon={Trash2}
                    key="delete"
                    onClick={() => handleDelete(file._id, file.filename)}
                    size="small"
                    title="Eliminar"
                  />
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(file.content_type, file.category)}
                description={
                  <Flexbox gap={4}>
                    <Flexbox gap={8} horizontal>
                      {getCategoryTag(file.category)}
                      {getVisibilityTag(file.visibility)}
                      <span style={{ color: '#666', fontSize: 12 }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </Flexbox>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </span>
                  </Flexbox>
                }
                title={
                  <Flexbox align="center" gap={8} horizontal>
                    <span>{file.filename}</span>
                    <PermissionBadge
                      compact
                      currentUserId={currentUserId}
                      isOwner={file.owner_id === currentUserId}
                      sharedWith={file.shared_with}
                    />
                  </Flexbox>
                }
              />
            </List.Item>
          )}
        />
      </Flexbox>
    );
  },
);

FileManagerWithPermissions.displayName = 'FileManagerWithPermissions';

export default FileManagerWithPermissions;

