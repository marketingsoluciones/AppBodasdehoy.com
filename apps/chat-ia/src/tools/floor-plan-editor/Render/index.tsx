import { BuiltinRenderProps } from '@lobechat/types';
import { Button } from 'antd';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

export interface FloorPlanPreview {
  label?: string;
  seats: number;
  svgDataUrl: string;
  tableType: string;
}

const FloorPlanEditorRender = memo<BuiltinRenderProps<FloorPlanPreview[]>>(({ content }) => {
  if (!content || content.length === 0) return null;

  const handleOpenEditor = (item: FloorPlanPreview) => {
    if (typeof window === 'undefined') return;
    window.parent.postMessage(
      {
        payload: {
          suggestedConfig: {
            label: item.label,
            seats: item.seats,
            tableType: item.tableType,
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
        <Flexbox gap={8} key={i} style={{ alignItems: 'flex-start' }}>
          <div
            style={{
              alignItems: 'center',
              background: '#F8F7F4',
              border: '1px solid #E8E4DC',
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'center',
              maxWidth: 320,
              padding: 16,
            }}
          >
            <img
              alt={item.label ?? `Mesa ${item.tableType}`}
              src={item.svgDataUrl}
              style={{ maxHeight: 280, maxWidth: 280, objectFit: 'contain' }}
            />
          </div>
          <div style={{ color: '#666', fontSize: 12 }}>
            {item.label && <strong>{item.label} · </strong>}
            {item.seats} personas · {item.tableType}
          </div>
          <Button
            onClick={() => handleOpenEditor(item)}
            size="small"
            style={{ background: '#8B6914', borderColor: '#8B6914' }}
            type="primary"
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
