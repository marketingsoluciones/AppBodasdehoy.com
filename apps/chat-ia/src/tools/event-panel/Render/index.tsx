import { BuiltinRenderProps } from '@lobechat/types';
import { memo } from 'react';

interface ShowEventSectionContent {
  eventoId?: string;
  section?: string;
}

const LABEL: Record<string, string> = {
  itinerario: 'itinerario',
  presupuesto: 'presupuesto',
  servicios: 'servicios',
};

/** Resumen inline en el cuerpo del chat; el detalle vive en el Portal (panel lateral). */
const EventPanelRender = memo<BuiltinRenderProps<ShowEventSectionContent>>(({ content }) => {
  const section = content?.section;
  if (!section) return null;
  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
        display: 'flex',
        fontSize: 13,
        gap: 8,
        padding: '8px 12px',
      }}
    >
      <span style={{ fontSize: 16 }}>📊</span>
      <span>
        Mostrando <b>{LABEL[section] ?? section}</b> del evento en el panel lateral →
      </span>
    </div>
  );
});

EventPanelRender.displayName = 'EventPanelRender';

export default EventPanelRender;
