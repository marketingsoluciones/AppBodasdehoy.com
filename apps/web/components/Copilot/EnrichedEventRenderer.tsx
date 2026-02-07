/**
 * EnrichedEventRenderer - Renderiza eventos enriquecidos del backend como componentes visuales
 *
 * Soporta: tool_result (download, image, QR, data_table), ui_action, confirm_required,
 * progress, code_output, tool_start
 */

import { memo, useState, useCallback } from 'react';
import type {
  EnrichedEvent,
  ToolResultEvent,
  UIActionEvent,
  ConfirmRequiredEvent,
  ProgressEvent,
  CodeOutputEvent,
  ToolStartEvent,
} from '../../services/copilotChat';
import EventCard, { EventCardData } from './EventCard';

// ── Styles ──

const card: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  marginTop: '8px',
  fontSize: '13px',
};

const cardBody: React.CSSProperties = {
  padding: '10px 12px',
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#F7628C',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  color: '#374151',
  fontSize: '12px',
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: '#ef4444',
};

const label: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: '4px',
};

// ── Sub-components ──

const DownloadCard = ({ data }: { data: ToolResultEvent['result'] }) => (
  <div style={card}>
    <div style={{ ...cardBody, display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '24px' }}>
        {data.filename?.endsWith('.xlsx') || data.filename?.endsWith('.csv') ? '📊' :
         data.filename?.endsWith('.pdf') ? '📄' :
         data.filename?.endsWith('.docx') ? '📝' : '📎'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.filename || 'Archivo'}
        </div>
        {data.size && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{data.size}</div>}
      </div>
      {data.url && (
        <a href={data.url} download style={{ ...btnPrimary, textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
          Descargar
        </a>
      )}
    </div>
  </div>
);

const ImagePreviewCard = ({ data }: { data: ToolResultEvent['result'] }) => (
  <div style={card}>
    {(data.imageUrl || data.url) && (
      <img
        src={data.imageUrl || data.url}
        alt={data.label || 'Imagen generada'}
        style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }}
      />
    )}
    <div style={{ ...cardBody, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: '#4b5563' }}>{data.label || 'Imagen'}</span>
      {(data.imageUrl || data.url) && (
        <a href={data.imageUrl || data.url} download style={btnSecondary} target="_blank" rel="noopener noreferrer">
          Guardar
        </a>
      )}
    </div>
  </div>
);

const QRCodeCard = ({ data }: { data: ToolResultEvent['result'] }) => (
  <div style={{ ...card, textAlign: 'center' as const }}>
    {(data.imageUrl || data.url) && (
      <img
        src={data.imageUrl || data.url}
        alt="Codigo QR"
        style={{ width: '160px', height: '160px', margin: '12px auto', display: 'block' }}
      />
    )}
    <div style={cardBody}>
      <span style={{ color: '#4b5563' }}>{data.label || 'Codigo QR generado'}</span>
    </div>
  </div>
);

const DataTableCard = ({ data }: { data: ToolResultEvent['result'] }) => {
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) return null;
  const keys = Object.keys(data.data[0]);
  const rows = data.data.slice(0, 10); // max 10 rows preview

  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            {keys.map((k) => (
              <th key={k} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
              {keys.map((k) => (
                <td key={k} style={{ padding: '5px 10px', color: '#4b5563' }}>
                  {String(row[k] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.data.length > 10 && (
        <div style={{ ...cardBody, color: '#9ca3af', fontSize: '11px' }}>
          Mostrando 10 de {data.data.length} filas
        </div>
      )}
    </div>
  );
};

const SuccessCard = ({ data }: { data: ToolResultEvent['result'] }) => (
  <div style={{ ...card, borderColor: '#86efac' }}>
    <div style={{ ...cardBody, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4' }}>
      <span style={{ fontSize: '18px' }}>✅</span>
      <span style={{ color: '#166534' }}>{data.message || 'Operacion completada'}</span>
    </div>
  </div>
);

const ErrorCard = ({ data }: { data: ToolResultEvent['result'] }) => (
  <div style={{ ...card, borderColor: '#fca5a5' }}>
    <div style={{ ...cardBody, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2' }}>
      <span style={{ fontSize: '18px' }}>❌</span>
      <span style={{ color: '#991b1b' }}>{data.error || data.message || 'Error en la operacion'}</span>
    </div>
  </div>
);

// ── Tool Result Router ──

const ToolResultRenderer = ({ data }: { data: ToolResultEvent }) => {
  const result = data.result;
  if (!result) return null;

  switch (result.type) {
    case 'download': return <DownloadCard data={result} />;
    case 'image_preview': return <ImagePreviewCard data={result} />;
    case 'qr_code': return <QRCodeCard data={result} />;
    case 'data_table': return <DataTableCard data={result} />;
    case 'success': return <SuccessCard data={result} />;
    case 'error': return <ErrorCard data={result} />;
    default: return null;
  }
};

// ── UI Action ──

const UIActionRenderer = ({ data, onNavigate }: { data: UIActionEvent; onNavigate?: (url: string) => void }) => {
  if (data.type === 'navigate' && data.path) {
    return (
      <div style={{ marginTop: '6px' }}>
        <button
          type="button"
          style={btnPrimary}
          onClick={() => onNavigate?.(data.path!)}
        >
          Ir a {data.path}
        </button>
      </div>
    );
  }
  if (data.type === 'refresh_data') {
    return (
      <div style={{ ...card, borderColor: '#93c5fd' }}>
        <div style={{ ...cardBody, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ff' }}>
          <span style={{ fontSize: '16px' }}>🔄</span>
          <span style={{ color: '#1e40af', fontSize: '12px' }}>Datos actualizados{data.target ? `: ${data.target}` : ''}</span>
        </div>
      </div>
    );
  }
  return null;
};

// ── Confirmation ──

const ConfirmRenderer = ({ data, onConfirm }: { data: ConfirmRequiredEvent; onConfirm?: (id: string, accepted: boolean) => void }) => {
  const [answered, setAnswered] = useState<boolean | null>(null);

  const handleAnswer = useCallback((accept: boolean) => {
    setAnswered(accept);
    onConfirm?.(data.id, accept);
  }, [data.id, onConfirm]);

  if (answered !== null) {
    return (
      <div style={{ ...card, borderColor: answered ? '#86efac' : '#fca5a5' }}>
        <div style={{ ...cardBody, color: answered ? '#166534' : '#991b1b', backgroundColor: answered ? '#f0fdf4' : '#fef2f2' }}>
          {answered ? '✅ Confirmado' : '❌ Cancelado'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...card, borderColor: data.danger ? '#fca5a5' : '#fcd34d' }}>
      <div style={{ ...cardBody, backgroundColor: data.danger ? '#fef2f2' : '#fffbeb' }}>
        <div style={label}>{data.danger ? '⚠️ Accion peligrosa' : '⚡ Confirmacion requerida'}</div>
        <div style={{ color: '#1f2937', marginBottom: '8px' }}>{data.message}</div>
        {data.count != null && (
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Afecta a {data.count} elemento{data.count !== 1 ? 's' : ''}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" style={data.danger ? btnDanger : btnPrimary} onClick={() => handleAnswer(true)}>
            Confirmar
          </button>
          <button type="button" style={btnSecondary} onClick={() => handleAnswer(false)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Progress ──

const ProgressRenderer = ({ data }: { data: ProgressEvent }) => {
  const pct = data.total > 0 ? Math.round((data.step / data.total) * 100) : 0;
  const isComplete = data.status === 'completed' || data.step >= data.total;

  return (
    <div style={{ ...card, borderColor: isComplete ? '#86efac' : '#93c5fd' }}>
      <div style={cardBody}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#374151', fontWeight: 500 }}>{data.label}</span>
          <span style={{ color: '#6b7280', fontSize: '11px' }}>{data.step}/{data.total}</span>
        </div>
        <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: data.status === 'error' ? '#ef4444' : isComplete ? '#22c55e' : '#3b82f6',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
};

// ── Code Output ──

const CodeOutputRenderer = ({ data }: { data: CodeOutputEvent }) => (
  <div style={card}>
    {data.code && (
      <div style={{ backgroundColor: '#1e1e2e', padding: '10px 12px', overflow: 'auto', maxHeight: '160px' }}>
        <pre style={{ margin: 0, fontSize: '12px', color: '#cdd6f4', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {data.code}
        </pre>
      </div>
    )}
    {data.output && (
      <div style={{ backgroundColor: '#f9fafb', padding: '8px 12px', borderTop: '1px solid #e5e7eb' }}>
        <div style={label}>Resultado</div>
        <pre style={{ margin: 0, fontSize: '12px', color: '#374151', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto' }}>
          {data.output}
        </pre>
      </div>
    )}
    {data.error && (
      <div style={{ backgroundColor: '#fef2f2', padding: '8px 12px', borderTop: '1px solid #fca5a5' }}>
        <pre style={{ margin: 0, fontSize: '12px', color: '#991b1b', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {data.error}
        </pre>
      </div>
    )}
    {data.files && data.files.length > 0 && (
      <div style={{ ...cardBody, borderTop: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {data.files.map((f, i) => (
          <a key={i} href={f.url} download style={{ ...btnSecondary, textDecoration: 'none', fontSize: '11px' }} target="_blank" rel="noopener noreferrer">
            📎 {f.name} {f.size ? `(${f.size})` : ''}
          </a>
        ))}
      </div>
    )}
  </div>
);

// ── Tool Start (inline indicator) ──

const TOOL_LABELS: Record<string, string> = {
  get_guests: 'Consultando invitados',
  add_guests: 'Agregando invitados',
  update_guest: 'Actualizando invitado',
  delete_guest: 'Eliminando invitado',
  get_budget: 'Consultando presupuesto',
  update_budget: 'Actualizando presupuesto',
  get_tables: 'Consultando mesas',
  update_table: 'Actualizando mesa',
  get_itinerary: 'Consultando itinerario',
  update_itinerary: 'Actualizando itinerario',
  generate_qr: 'Generando codigo QR',
  generate_report: 'Generando reporte',
  export_excel: 'Exportando Excel',
  export_pdf: 'Exportando PDF',
  send_invitation: 'Enviando invitacion',
  generate_image: 'Generando imagen',
  code_interpreter: 'Ejecutando codigo',
};

const ToolStartRenderer = ({ data }: { data: ToolStartEvent }) => {
  const toolLabel = TOOL_LABELS[data.tool] || `Ejecutando: ${data.tool}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6',
        animation: 'pulse 1.5s infinite',
      }} />
      {toolLabel}...
    </div>
  );
};

// ── Main Renderer ──

interface EnrichedEventRendererProps {
  events: EnrichedEvent[];
  onNavigate?: (url: string) => void;
  onConfirm?: (id: string, accepted: boolean) => void;
}

const EnrichedEventRenderer = memo(({ events, onNavigate, onConfirm }: EnrichedEventRendererProps) => {
  if (!events || events.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {events.map((event, idx) => {
        switch (event.type) {
          case 'tool_result':
            return <ToolResultRenderer key={idx} data={event.data as ToolResultEvent} />;
          case 'ui_action':
            return <UIActionRenderer key={idx} data={event.data as UIActionEvent} onNavigate={onNavigate} />;
          case 'confirm_required':
            return <ConfirmRenderer key={idx} data={event.data as ConfirmRequiredEvent} onConfirm={onConfirm} />;
          case 'progress':
            return <ProgressRenderer key={idx} data={event.data as ProgressEvent} />;
          case 'code_output':
            return <CodeOutputRenderer key={idx} data={event.data as CodeOutputEvent} />;
          case 'tool_start':
            return <ToolStartRenderer key={idx} data={event.data as ToolStartEvent} />;
          case 'event_card':
            return <EventCard key={idx} data={event.data as EventCardData} />;
          default:
            return null;
        }
      })}
    </div>
  );
});

EnrichedEventRenderer.displayName = 'EnrichedEventRenderer';

export default EnrichedEventRenderer;
