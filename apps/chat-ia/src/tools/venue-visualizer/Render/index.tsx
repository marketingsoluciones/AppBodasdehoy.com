import { useMemoriesStore } from '@bodasdehoy/memories';
import { BuiltinRenderProps } from '@lobechat/types';
import { Icon } from '@lobehub/ui';
import { Button, Tooltip } from 'antd';
import { FileDown } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';
import { useDevelopment } from '@/utils/developmentDetector';
import { VenueVisualizerItem } from '@/types/tool/venueVisualizer';

import VenueItem from './Item';
import { exportVenuePdf } from './VenuePdf';

function getEventNameFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (!raw) return undefined;
    const config = JSON.parse(raw);
    return config.event_name || config.eventName || config.nombre_evento;
  } catch {
    return undefined;
  }
}

const VenueVisualizerRender = memo<BuiltinRenderProps<VenueVisualizerItem[]>>(
  ({ content, messageId }) => {
    const [exporting, setExporting] = useState(false);

    // Configurar memories store para que "Guardar en Momentos" funcione fuera del layout /memories
    const userId = useUserStore((s) => userProfileSelectors.userId(s)) ?? '';
    const { development } = useDevelopment();
    const { setConfig } = useMemoriesStore();
    useEffect(() => {
      if (userId) setConfig('', userId, development);
    }, [userId, development, setConfig]);

    const handleExportPdf = useCallback(async () => {
      if (!content || exporting) return;
      setExporting(true);
      try {
        const eventName = getEventNameFromStorage();
        await exportVenuePdf(content, eventName);
      } catch {
        // Silently ignore export errors
      } finally {
        setExporting(false);
      }
    }, [content, exporting]);

    if (!content || content.length === 0) return null;

    const hasGenerated = content.some((item) => item.generatedUrl);

    return (
      <Flexbox gap={12}>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {content.map((item, index) => (
            <VenueItem
              key={`${item.style}-${item.roomType}-${index}`}
              messageId={messageId}
              {...item}
            />
          ))}
        </div>

        {hasGenerated && (
          <Flexbox horizontal justify="flex-end">
            <Tooltip title="Exportar propuesta en PDF">
              <Button
                icon={<Icon icon={FileDown} />}
                loading={exporting}
                onClick={handleExportPdf}
                size="small"
              >
                Exportar PDF
              </Button>
            </Tooltip>
          </Flexbox>
        )}
      </Flexbox>
    );
  },
);

export default VenueVisualizerRender;
