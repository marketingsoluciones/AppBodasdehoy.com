import { Icon } from '@lobehub/ui';
import { Button, Image, Spin, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { Download, Loader2 } from 'lucide-react';
import { memo, useCallback } from 'react';
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
  downloadBtn: css`
    position: absolute;
    inset-block-end: 8px;
    inset-inline-start: 8px;
    z-index: 10;
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

    /* Slider handle styles */
    --rcs-handle-color: ${token.colorPrimary};
  `,
}));

const VenueItem = memo<VenueVisualizerItem & { messageId: string }>(
  ({ style, roomType, originalUrl, generatedUrl, provider, error, messageId }) => {
    const { styles } = useStyles();

    const loadingKey = messageId + style + roomType;
    const loading = useChatStore(chatToolSelectors.isVenueGenerating(loadingKey));

    const styleLabel = STYLE_LABELS[style] || style;

    const handleDownload = useCallback(async () => {
      if (!generatedUrl) return;
      try {
        const response = await fetch(generatedUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `venue-${style}-${roomType}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // Silently ignore download errors
      }
    }, [generatedUrl, style, roomType]);

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
          <div className={styles.downloadBtn}>
            <Tooltip title="Descargar imagen">
              <Button
                icon={<Icon icon={Download} />}
                onClick={handleDownload}
                shape="circle"
                size="small"
                type="primary"
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
