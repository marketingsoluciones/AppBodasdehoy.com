'use client';

import { ActionIconGroup, ActionIconGroupProps } from '@lobehub/ui';
import { App, Modal, Select, Spin } from 'antd';
import { Dices, Download, Images, Scissors, Trash2 } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ImageEditor from '@/components/image/ImageEditor';
import { useMemoriesStore } from '@/store/memories';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';
import { useDevelopment } from '@/utils/developmentDetector';

import { useStyles } from './styles';
import { ActionButtonsProps } from './types';

// 操作按钮组件
export const ActionButtons = memo<ActionButtonsProps>(
  ({
    onDelete,
    onDownload,
    onCopySeed,
    showDownload = false,
    showCopySeed = false,
    seedTooltip,
    imageUrl,
  }) => {
    const { styles } = useStyles();
    const { t } = useTranslation('image');
    const { message } = App.useApp();

    const [showEditor, setShowEditor] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState<string>();

    // Memories store — global Zustand, needs manual config init
    const userId = useUserStore((s) => userProfileSelectors.userId(s)) ?? '';
    const { development } = useDevelopment();
    const { setConfig, fetchAlbums, albums, albumsLoading, uploadMedia } = useMemoriesStore();

    useEffect(() => {
      if (userId) setConfig('', userId, development);
    }, [userId, development, setConfig]);

    const handleOpenSaveModal = useCallback(() => {
      fetchAlbums();
      setSelectedAlbum(undefined);
      setShowSaveModal(true);
    }, [fetchAlbums]);

    const handleSaveToMemories = useCallback(async () => {
      if (!selectedAlbum || !imageUrl) return;
      setSaving(true);
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error('No se pudo descargar la imagen');
        const blob = await res.blob();
        const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
        const file = new File([blob], `imagen-ia.${ext}`, { type: blob.type });
        const saved = await uploadMedia(selectedAlbum, file, 'Generado con IA');
        if (saved) {
          message.success('Imagen guardada en el álbum');
          setShowSaveModal(false);
        } else {
          message.error('No se pudo guardar la imagen');
        }
      } catch (e: any) {
        message.error(`Error: ${e?.message || 'desconocido'}`);
      } finally {
        setSaving(false);
      }
    }, [selectedAlbum, imageUrl, uploadMedia, message]);

    return (
      <>
        <ActionIconGroup
          actionIconProps={{
            tooltipProps: { placement: 'left' },
          }}
          className={styles.generationActionButton}
          horizontal={false}
          items={
            [
              Boolean(showDownload && onDownload) && {
                icon: Download,
                key: 'download',
                label: t('generation.actions.download'),
                onClick: onDownload,
              },
              Boolean(imageUrl) && {
                icon: Scissors,
                key: 'edit',
                label: 'Editar Imagen',
                onClick: () => setShowEditor(true),
              },
              Boolean(imageUrl) && {
                icon: Images,
                key: 'saveToMemories',
                label: 'Guardar en Momentos',
                onClick: handleOpenSaveModal,
              },
              Boolean(showCopySeed && onCopySeed) && {
                icon: Dices,
                key: 'copySeed',
                label: seedTooltip,
                onClick: onCopySeed,
              },
              {
                danger: true,
                icon: Trash2,
                key: 'delete',
                label: t('generation.actions.delete'),
                onClick: onDelete,
              },
            ].filter(Boolean) as ActionIconGroupProps['items']
          }
          variant="outlined"
        />
        {showEditor && imageUrl && (
          <ImageEditor
            imageUrl={imageUrl}
            onClose={() => setShowEditor(false)}
            onSave={(editedUrl) => {
              // Open the edited image in a new tab so the user can save it
              if (editedUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = editedUrl;
                link.download = 'imagen-editada.png';
                link.click();
              } else {
                window.open(editedUrl, '_blank');
              }
              setShowEditor(false);
            }}
          />
        )}
        <Modal
          cancelText="Cancelar"
          okButtonProps={{ disabled: !selectedAlbum, loading: saving }}
          okText="Guardar"
          onCancel={() => setShowSaveModal(false)}
          onOk={handleSaveToMemories}
          open={showSaveModal}
          title="Guardar en Momentos"
        >
          {albumsLoading ? (
            <Spin style={{ display: 'block', margin: '20px auto' }} />
          ) : (
            <Select
              onChange={setSelectedAlbum}
              options={albums.map((a) => ({ label: a.name, value: a._id }))}
              placeholder="Elige un álbum"
              style={{ marginTop: 8, width: '100%' }}
              value={selectedAlbum}
            />
          )}
        </Modal>
      </>
    );
  },
);

ActionButtons.displayName = 'ActionButtons';
