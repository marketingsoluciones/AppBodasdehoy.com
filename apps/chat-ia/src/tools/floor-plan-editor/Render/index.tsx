import { BuiltinRenderProps } from '@lobechat/types';
import { Button } from 'antd';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

export interface FloorPlanPreview {
  svgDataUrl: string;
  tableType: string;
  seats: number;
  label?: string;
}

const FloorPlanEditorRender = memo<BuiltinRenderProps<FloorPlanPreview[]>>(({ content }) => {
  if (!content || content.length === 0) return null;

  const handleOpenEditor = (item: FloorPlanPreview) => {
    if (typeof window === 'undefined') return;
    window.parent.postMessage(
      {
        payload: {
          suggestedConfig: {
            tableType: item.tableType,
            seats: item.seats,
            label: item.label,
          },
        },
        source: 'copilot-chat',
        timestamp: Date.now(),
        type: 'OPEN_FLOOR_PLAN',
      },
      '*',
    );
  };

  return (
    <Flexbox gap={16}>
      {content.map((item, i) => (
        <Flexbox key={i} gap={8} style={{ alignItems: 'flex-start' }}>
          <div
            style={{
              background: '#F8F7F4',
              borderRadius: 12,
              border: '1px solid #E8E4DC',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 320,
            }}
          >
            <img
              src={item.svgDataUrl}
              alt={item.label ?? `Mesa ${item.tableType}`}
              style={{ maxWidth: 280, maxHeight: 280, objectFit: 'contain' }}
            />
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {item.label && <strong>{item.label} · </strong>}
            {item.seats} personas · {item.tableType}
          </div>
          <Button
            size="small"
            type="primary"
            style={{ background: '#8B6914', borderColor: '#8B6914' }}
            onClick={() => handleOpenEditor(item)}
          >
            ✦ Abrir editor de mesas
          </Button>
        </Flexbox>
      ))}
    </Flexbox>
  );
});

FloorPlanEditorRender.displayName = 'FloorPlanEditorRender';

export default FloorPlanEditorRender;
