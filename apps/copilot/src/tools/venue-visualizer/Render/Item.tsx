import { Icon } from '@lobehub/ui';
import { Image, Spin, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';
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
  error: css`
    color: ${token.colorError};
    font-size: 12px;
    padding: 8px;
    text-align: center;
  `,
  image: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
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
}));

const VenueItem = memo<VenueVisualizerItem & { messageId: string }>(
  ({ style, roomType, originalUrl, generatedUrl, provider, error, messageId }) => {
    const { styles } = useStyles();

    const loadingKey = messageId + style + roomType;
    const loading = useChatStore(chatToolSelectors.isVenueGenerating(loadingKey));

    const styleLabel = STYLE_LABELS[style] || style;

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

        {!loading && !error && generatedUrl && (
          <Image
            alt={`${styleLabel} - ${roomType}`}
            preview={{
              src: generatedUrl,
            }}
            src={generatedUrl}
            style={{ height: '100%', objectFit: 'cover', width: '100%' }}
          />
        )}

        {!loading && !error && !generatedUrl && originalUrl && (
          <Image
            alt="Original venue"
            src={originalUrl}
            style={{ height: '100%', objectFit: 'cover', opacity: 0.5, width: '100%' }}
          />
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
