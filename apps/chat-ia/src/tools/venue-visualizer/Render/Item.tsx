import { useMemoriesStore } from '@bodasdehoy/memories';
import { Icon } from '@lobehub/ui';
import { Button, Image, Spin, Tag, Tooltip, message } from 'antd';
import { createStyles } from 'antd-style';
import { Download, Loader2, Save } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatToolSelectors } from '@/store/chat/slices/builtinTool/selectors';
import { VenueVisualizerItem } from '@/types/tool/venueVisualizer';

const STYLE_LABELS: Record<string, string> = {
  'glamour': 'Glamour',
  'industrial': 'Industrial',
  'jardin-floral': 'Jardín Floral',
  'mediterraneo': 'Mediterráneo',
  'minimalista': 'Minimalista',
  'romantico': 'Romántico',
  'rustico-boho': 'Rústico Boho',
  'tropical': 'Tropical',
};

const useStyles = createStyles(({ css, token }) => ({
  actions: css`
    position: absolute;
    inset-block-end: 8px;
    inset-inline-start: 8px;
    z-index: 10;
    display: flex;
    gap: 6px;
  `,
  badge: css`
    position: absolute;
    inset-block-start: 8px;
    inset-inline-start: 8px;
    z-index: 10;
  `,
  container: css`
    position: relative;
    overflow: hidden;
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    background: ${token.colorFillTertiary};
    min-height: 200px;
  `,
  error: css`
    color: ${token.colorError};
    font-size: 12px;
    padding: 8px;
    text-align: center;
  `,
  loading: css`
    width: 100%;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
    color: ${token.colorTextSecondary};
    font-size: 12px;
  `,
  providerBadge: css`
    position: absolute;
    inset-block-end: 8px;
    inset-inline-end: 8px;
    z-index: 10;
  `,
  slider: css`
    width: 100%;
    height: 100%;
    min-height: 200px;
    --rcs-handle-color: ${token.colorPrimary};
  `,
}));

function getEventIdFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (!raw) return undefined;
    const config = JSON.parse(raw);
    if (config.event_id) return config.event_id;
    if (config.current_event_id) return config.current_event_id;
    if (config.eventos?.length > 0) return config.eventos[0]._id || config.eventos[0].id;
  } catch {
    // ignore
  }
  return undefined;
}

async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

const VenueItem = memo<VenueVisualizerItem & { messageId: string }>(
  ({ style, roomType, originalUrl, generatedUrl, provider, error, messageId }) => {
    const { styles } = useStyles();
    const [saving, setSaving] = useState(false);

    const loadingKey = messageId + style + roomType;
    const loading = useChatStore(chatToolSelectors.isVenueGenerating(loadingKey));

    const { getAlbumsByEvent, createAlbum, uploadMedia } = useMemoriesStore();

    const styleLabel = STYLE_LABELS[style] || style;

    const handleDownload = useCallback(async () => {
      if (!generatedUrl) return;
      try {
        const file = await urlToFile(generatedUrl, `venue-${style}-${roomType}.jpg`);
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `venue-${style}-${roomType}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // Silently ignore download errors
      }
    }, [generatedUrl, style, roomType]);

    const handleSaveToMoments = useCallback(async () => {
      if (!generatedUrl || saving) return;
      const eventId = getEventIdFromStorage();
      if (!eventId) {
        message.warning('No se encontró el evento activo');
        return;
      }

      setSaving(true);
      try {
        // Find or create "Diseño de Espacios" album for this event
        const albums: any[] = await getAlbumsByEvent(eventId);
        let targetAlbum = albums?.find(
          (a: any) => a.name === 'Diseño de Espacios' || a.name === 'Venue Design',
        );

        if (!targetAlbum) {
          targetAlbum = await createAlbum({
            description: 'Visualizaciones de decoración generadas con IA',
            eventId,
            name: 'Diseño de Espacios',
          });
        }

        if (!targetAlbum?._id && !targetAlbum?.id) {
          throw new Error('No se pudo obtener el álbum');
        }

        const albumId = targetAlbum._id || targetAlbum.id;
        const file = await urlToFile(generatedUrl, `venue-${style}-${roomType}.jpg`);
        await uploadMedia(albumId, file, `Estilo ${styleLabel} — ${roomType}`);

        message.success('Guardado en Momentos ✓');
      } catch {
        message.error('No se pudo guardar en Momentos');
      } finally {
        setSaving(false);
      }
    }, [generatedUrl, saving, style, roomType, styleLabel, getAlbumsByEvent, createAlbum, uploadMedia]);

    const showSlider = !loading && !error && generatedUrl && originalUrl;
    const showGenerated = !loading && !error && generatedUrl && !originalUrl;
    const showOriginal = !loading && !error && !generatedUrl && originalUrl;

    return (
      <Flexbox className={styles.container}>
        <div className={styles.badge}>
          <Tag color="purple">{styleLabel}</Tag>
        </div>

        {loading && (
          <div className={styles.loading}>
            <Spin indicator={<Icon icon={Loader2} spin />} size="large" />
            <span>Generando visualización...</span>
          </div>
        )}

        {!loading && error && (
          <Flexbox align="center" className={styles.loading}>
            <div className={styles.error}>{error}</div>
          </Flexbox>
        )}

        {showSlider && (
          <ReactCompareSlider
            className={styles.slider}
            itemOne={
              <ReactCompareSliderImage
                alt="Original"
                src={originalUrl}
                style={{ objectFit: 'cover' }}
              />
            }
            itemTwo={
              <ReactCompareSliderImage
                alt={`${styleLabel} - ${roomType}`}
                src={generatedUrl}
                style={{ objectFit: 'cover' }}
              />
            }
          />
        )}

        {showGenerated && (
          <Image
            alt={`${styleLabel} - ${roomType}`}
            preview={{ src: generatedUrl }}
            src={generatedUrl}
            style={{ height: '100%', objectFit: 'cover', width: '100%' }}
          />
        )}

        {showOriginal && (
          <Image
            alt="Original venue"
            src={originalUrl}
            style={{ height: '100%', objectFit: 'cover', opacity: 0.5, width: '100%' }}
          />
        )}

        {generatedUrl && !loading && (
          <div className={styles.actions}>
            <Tooltip title="Descargar imagen">
              <Button
                icon={<Icon icon={Download} />}
                onClick={handleDownload}
                shape="circle"
                size="small"
                type="primary"
              />
            </Tooltip>
            <Tooltip title="Guardar en Momentos">
              <Button
                icon={<Icon icon={Save} spin={saving} />}
                loading={saving}
                onClick={handleSaveToMoments}
                shape="circle"
                size="small"
              />
            </Tooltip>
          </div>
        )}

        {provider && !loading && (
          <div className={styles.providerBadge}>
            <Tag>{provider}</Tag>
          </div>
        )}
      </Flexbox>
    );
  },
);

export default VenueItem;
