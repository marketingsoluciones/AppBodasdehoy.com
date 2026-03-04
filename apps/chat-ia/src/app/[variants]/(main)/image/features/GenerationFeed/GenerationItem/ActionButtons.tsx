'use client';

import { ActionIconGroup, ActionIconGroupProps } from '@lobehub/ui';
import { Dices, Download, Scissors, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ImageEditor from '@/components/image/ImageEditor';

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
    const [showEditor, setShowEditor] = useState(false);

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
              // Aquí podrías actualizar la imagen en el store
              console.log('Imagen editada:', editedUrl);
              setShowEditor(false);
            }}
          />
        )}
      </>
    );
  },
);

ActionButtons.displayName = 'ActionButtons';
