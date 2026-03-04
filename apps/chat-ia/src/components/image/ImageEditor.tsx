'use client';

import { Button, Input, message, Modal, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { Maximize2, RotateCw, Scissors } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
  actionButton: css`
    background: ${token.colorPrimary};
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 20px;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    &:disabled {
      background: ${token.colorBgContainerDisabled};
      cursor: not-allowed;
      transform: none;
    }
  `,
  editorContainer: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 24px;
  `,
  imagePreview: css`
    border: 2px dashed ${token.colorBorder};
    border-radius: 8px;
    max-height: 400px;
    max-width: 100%;
    object-fit: contain;
    padding: 16px;
  `,
  modal: css`
    .ant-modal-content {
      padding: 24px;
    }
  `,
  previewContainer: css`
    align-items: center;
    display: flex;
    justify-content: center;
    min-height: 300px;
    padding: 24px;
  `,
  secondaryButton: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    color: ${token.colorText};
    cursor: pointer;
    font-size: 14px;
    padding: 8px 16px;
    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      color: ${token.colorPrimary};
    }
  `,
}));

interface ImageEditorProps {
  imageUrl: string;
  onClose?: () => void;
  onSave?: (editedImageUrl: string) => void;
}

const ImageEditor = memo<ImageEditorProps>(({ imageUrl, onClose, onSave }) => {
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [operation, setOperation] = useState<'remove_background' | 'resize' | null>(null);
  const [resizeWidth, setResizeWidth] = useState<number>(800);
  const [resizeHeight, setResizeHeight] = useState<number>(800);

  const handleRemoveBackground = async () => {
    setLoading(true);
    setOperation('remove_background');

    try {
      const response = await fetch('/webapi/image/edit/remove_background', {
        body: JSON.stringify({ image_url: imageUrl }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.edited_image_url) {
        setEditedImageUrl(data.edited_image_url);
        message.success('Fondo removido exitosamente');
      } else {
        message.error(data.error || 'Error removiendo fondo');
      }
    } catch (error) {
      message.error('Error procesando imagen');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResize = async () => {
    setLoading(true);
    setOperation('resize');

    try {
      const response = await fetch('/webapi/image/edit/resize', {
        body: JSON.stringify({
          height: resizeHeight,
          image_url: imageUrl,
          width: resizeWidth,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.edited_image_url) {
        setEditedImageUrl(data.edited_image_url);
        message.success(`Imagen redimensionada a ${resizeWidth}x${resizeHeight}`);
      } else {
        message.error(data.error || 'Error redimensionando imagen');
      }
    } catch (error) {
      message.error('Error procesando imagen');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (editedImageUrl && onSave) {
      onSave(editedImageUrl);
      message.success('Imagen guardada');
      if (onClose) onClose();
    }
  };

  const handleReset = () => {
    setEditedImageUrl(null);
    setOperation(null);
  };

  return (
    <Modal
      className={styles.modal}
      footer={null}
      onCancel={onClose}
      open={true}
      title="Editor de Imágenes"
      width={800}
    >
      <div className={styles.editorContainer}>
        <Flexbox gap={24}>
          {/* Preview de Imagen */}
          <div className={styles.previewContainer}>
            {loading ? (
              <Spin size="large" />
            ) : (
              <img
                alt="Preview"
                className={styles.imagePreview}
                src={editedImageUrl || imageUrl}
              />
            )}
          </div>

          {/* Controles de Edición */}
          <Flexbox gap={16}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Operaciones</h3>
              <Flexbox gap={12} horizontal style={{ flexWrap: 'wrap' }}>
                <Button
                  icon={<Scissors size={16} />}
                  loading={loading && operation === 'remove_background'}
                  onClick={handleRemoveBackground}
                  type="primary"
                >
                  Quitar Fondo
                </Button>
                <Button
                  icon={<Maximize2 size={16} />}
                  loading={loading && operation === 'resize'}
                  onClick={() => setOperation('resize')}
                >
                  Redimensionar
                </Button>
                {editedImageUrl && (
                  <Button icon={<RotateCw size={16} />} onClick={handleReset}>
                    Restaurar Original
                  </Button>
                )}
              </Flexbox>
            </div>

            {/* Controles de Redimensionamiento */}
            {operation === 'resize' && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Dimensiones</h4>
                <Flexbox gap={12} horizontal>
                  <Flexbox gap={4}>
                    <label style={{ fontSize: 12 }}>Ancho</label>
                    <Input
                      onChange={(e) => setResizeWidth(parseInt(e.target.value) || 800)}
                      type="number"
                      value={resizeWidth}
                    />
                  </Flexbox>
                  <Flexbox gap={4}>
                    <label style={{ fontSize: 12 }}>Alto</label>
                    <Input
                      onChange={(e) => setResizeHeight(parseInt(e.target.value) || 800)}
                      type="number"
                      value={resizeHeight}
                    />
                  </Flexbox>
                  <Button
                    icon={<Maximize2 size={16} />}
                    loading={loading}
                    onClick={handleResize}
                    style={{ marginTop: 20 }}
                    type="primary"
                  >
                    Aplicar
                  </Button>
                </Flexbox>
              </div>
            )}

            {/* Acciones */}
            {editedImageUrl && (
              <Flexbox gap={12} horizontal justify="flex-end">
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} type="primary">
                  Guardar Cambios
                </Button>
              </Flexbox>
            )}
          </Flexbox>
        </Flexbox>
      </div>
    </Modal>
  );
});

ImageEditor.displayName = 'ImageEditor';

export default ImageEditor;
