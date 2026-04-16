'use client';

import { Text, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Flexbox } from 'react-layout-kit';
import {
  ImageIcon,
  FileTextIcon,
  VideoIcon,
  MusicIcon,
  FileIcon,
  EyeIcon,
  DownloadIcon,
  TrashIcon,
  MoreVerticalIcon
} from 'lucide-react';
import { Button, Modal, Dropdown, Popconfirm } from 'antd';

import { type StorageFile, getFileUrl } from '@/services/storage-r2';
import { formatSize } from '@/utils/format';
// Formatear fecha sin dependencia externa
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

type ViewMode = 'grid' | 'list';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    cursor: pointer;

    overflow: hidden;

    border: 1px solid transparent;
    border-radius: 8px;

    background: ${token.colorFillTertiary};

    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      border-color: ${token.colorBorder};
      background: ${token.colorFillSecondary};
      box-shadow: ${token.boxShadow};
    }
  `,
  containerGrid: css`
    flex-direction: column;
    align-items: center;
    padding: 16px;
    text-align: center;
  `,
  containerList: css`
    max-width: 100%;
    padding-block: 12px;
    padding-inline: 16px;
  `,
  preview: css`
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  `,
  thumbnail: css`
    width: 100%;
    height: 200px;
    margin-block-end: 8px;
    border-radius: 8px;

    object-fit: cover;
  `,
  thumbnailList: css`
    flex-shrink: 0;

    width: 48px;
    height: 48px;
    border-radius: 4px;

    object-fit: cover;
  `,
}));

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.startsWith('video/')) return VideoIcon;
  if (fileType.startsWith('audio/')) return MusicIcon;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileTextIcon;
  return FileIcon;
};

const StorageFileItem = memo<{
  file: StorageFile;
  onDelete?: (_id: string) => void;
  viewMode?: ViewMode;
}>(({ file, viewMode = 'list', onDelete }) => {
  const { styles } = useStyles();
  const FileIconComponent = getFileIcon(file.fileType);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage = file.fileType.startsWith('image/');
  const thumbnailUrl = file.urls.thumbnail || file.urls.optimized400w || file.urls.optimized800w;

  const handleClick = async () => {
    if (isImage) {
      setLoading(true);
      try {
        const result = await getFileUrl(file.fileId, 'optimized_800w');
        if (result.success && result.url) {
          setPreviewUrl(result.url);
          setPreviewVisible(true);
        } else {
          const url = file.urls.optimized800w || file.urls.original || file.urls.thumbnail || '';
          if (url) {
            setPreviewUrl(url);
            setPreviewVisible(true);
          }
        }
      } catch (error) {
        console.error('Error obteniendo URL de archivo:', error);
        const url = file.urls.optimized800w || file.urls.original || file.urls.thumbnail || '';
        if (url) {
          setPreviewUrl(url);
          setPreviewVisible(true);
        }
      } finally {
        setLoading(false);
      }
    } else {
      const url = file.urls.original || file.urls.optimized800w || '';
      if (url) {
        window.open(url, '_blank');
      } else {
        getFileUrl(file.fileId, 'original').then((result) => {
          if (result.success && result.url) {
            window.open(result.url, '_blank');
          }
        });
      }
    }
  };

const handleDownload = async (e?: ReactMouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    try {
      const result = await getFileUrl(file.fileId, 'original');
      if (result.success && result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = file.originalFilename;
        link.click();
      }
    } catch (error) {
      console.error('Error descargando archivo:', error);
    }
  };

  const handleDelete = (e?: ReactMouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    onDelete?.(file.fileId);
  };


  const menuItems = [
    {
      disabled: !isImage,
      icon: <Icon icon={EyeIcon} size="small" />,
      key: 'view',
      label: 'Ver',
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        handleClick();
      },
    },
    {
      icon: <Icon icon={DownloadIcon} size="small" />,
      key: 'download',
      label: 'Descargar',
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        handleDownload(e.domEvent);
      },
    },
    ...(onDelete ? [{
      danger: true,
      icon: <Icon icon={TrashIcon} size="small" />,
      key: 'delete',
      label: (
        <Popconfirm
          cancelText="Cancelar"
          description="Esta acción no se puede deshacer"
          okText="Eliminar"
          onCancel={(e) => e?.stopPropagation()}
          onConfirm={handleDelete}
          title="¿Eliminar archivo?"
        >
          <span style={{ color: 'var(--ant-color-error)' }}>Eliminar</span>
        </Popconfirm>
      ),
    }] : []),
  ];

  if (viewMode === 'grid') {
    return (
      <>
        <Flexbox
          className={`${styles.container} ${styles.containerGrid}`}
          onClick={handleClick}
        >
          {isImage && thumbnailUrl ? (
            <img alt={file.originalFilename} className={styles.thumbnail} src={thumbnailUrl} />
          ) : (
            <Icon icon={FileIconComponent} size={48} style={{ marginBottom: 8 }} />
          )}
          <Flexbox flex={1} gap={4} style={{ width: '100%' }}>
            <Text ellipsis={{ tooltip: true }} style={{ fontSize: '14px', fontWeight: 500 }}>
              {file.originalFilename}
            </Text>
            <Text style={{ fontSize: '12px' }} type="secondary">
              {formatSize(file.sizeBytes)}
            </Text>
            <Text style={{ fontSize: '11px' }} type="secondary">
              {formatDate(file.uploadDate)}
            </Text>
          </Flexbox>
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button
              icon={<Icon icon={MoreVerticalIcon} />}
              onClick={(e) => e.stopPropagation()}
              size="small"
              style={{ position: 'absolute', right: 8, top: 8 }}
              type="text"
            />
          </Dropdown>
        </Flexbox>

        {isImage && (
          <Modal
            centered
            footer={[
              <Button icon={<Icon icon={DownloadIcon} />} key="download" onClick={handleDownload}>
                Descargar
              </Button>,
              <Button key="close" onClick={() => setPreviewVisible(false)}>
                Cerrar
              </Button>,
            ]}
            onCancel={() => setPreviewVisible(false)}
            open={previewVisible}
            style={{ top: 20 }}
            width="90vw"
          >
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>
            ) : previewUrl ? (
              <img alt={file.originalFilename} className={styles.preview} src={previewUrl} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center' }}>No se pudo cargar la imagen</div>
            )}
          </Modal>
        )}
      </>
    );
  }

  // Vista lista
  return (
    <>
      <Flexbox
        align={'center'}
        className={`${styles.container} ${styles.containerList}`}
        gap={12}
        horizontal
        onClick={handleClick}
      >
        {isImage && thumbnailUrl ? (
          <img alt={file.originalFilename} className={styles.thumbnailList} src={thumbnailUrl} />
        ) : (
          <Icon icon={FileIconComponent} size={'large'} />
        )}
        <Flexbox flex={1} gap={4}>
          <Text ellipsis={{ tooltip: true }} style={{ fontWeight: 500 }}>
            {file.originalFilename}
          </Text>
          <Flexbox gap={12} horizontal>
            <Text style={{ fontSize: '12px' }} type={'secondary'}>
              {formatSize(file.sizeBytes)}
            </Text>
            <Text style={{ fontSize: '12px' }} type={'secondary'}>
              {formatDate(file.uploadDate)}
            </Text>
          </Flexbox>
        </Flexbox>
        <Flexbox gap={4} horizontal>
          {isImage && (
            <Button
              icon={<Icon icon={EyeIcon} size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              size="small"
              type="text"
            />
          )}
          <Button
            icon={<Icon icon={DownloadIcon} size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(e);
            }}
            size="small"
            type="text"
          />
          {onDelete && (
            <Popconfirm
              cancelText="Cancelar"
              description="Esta acción no se puede deshacer"
              okText="Eliminar"
              onCancel={(e) => e?.stopPropagation()}
              onConfirm={handleDelete}
              title="¿Eliminar archivo?"
            >
              <Button
                danger
                icon={<Icon icon={TrashIcon} size={16} />}
                onClick={(e) => e.stopPropagation()}
                size="small"
                type="text"
              />
            </Popconfirm>
          )}
        </Flexbox>
      </Flexbox>

      {isImage && (
        <Modal
          centered
          footer={[
            <Button icon={<Icon icon={DownloadIcon} />} key="download" onClick={handleDownload}>
              Descargar
            </Button>,
            <Button key="close" onClick={() => setPreviewVisible(false)}>
              Cerrar
            </Button>,
          ]}
          onCancel={() => setPreviewVisible(false)}
          open={previewVisible}
          style={{ top: 20 }}
          width="90vw"
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>
          ) : previewUrl ? (
            <img alt={file.originalFilename} className={styles.preview} src={previewUrl} />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>No se pudo cargar la imagen</div>
          )}
        </Modal>
      )}
    </>
  );
});

StorageFileItem.displayName = 'StorageFileItem';

export default StorageFileItem;
