/**
 * CopilotEmbed - Chat integrado nativo (sin iframe) usando @bodasdehoy/copilot-shared
 *
 * Conecta con api-ia vía SSE (copilotChat.ts).
 * Soporta:
 *  - Streaming de respuestas con botón Stop
 *  - Eventos enriquecidos: ui_action, progress, tool_result, reasoning, tool_start
 *  - Tool result cards inline (descarga, imagen, tabla, QR, código)
 *  - Confirmaciones de acciones destructivas
 *  - Acciones por mensaje: Copiar, Regenerar (último assistant)
 *  - Display de razonamiento colapsable
 *  - Indicador de herramienta en ejecución
 *  - Empty state con preguntas sugeridas
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../../hooks/useToast';
import { useVisualViewportKeyboardInset } from '../../hooks/useVisualViewportKeyboardInset';
import { MessageList, CopilotChatInput } from '@bodasdehoy/copilot-shared';
import type { MessageItem } from '@bodasdehoy/copilot-shared';
import {
  sendChatMessage,
  getChatHistory,
  generateMessageId,
  type SendMessageParams,
  type PageContext,
  type EnrichedEvent,
  type UIActionEvent,
  type ProgressEvent,
  type ToolResultEvent,
  type ConfirmRequiredEvent,
  type CodeOutputEvent,
} from '../../services/copilotChat';
import { EventsGroupContextProvider } from '../../context';
import { developments } from '@bodasdehoy/shared/types';

/** Hosts conocidos de todos los tenants — para interceptar links internos */
const KNOWN_APP_HOSTS = developments.flatMap((d) => {
  const root = d.domain.replace(/^\./, '');
  return [`app.${root}`, `app-test.${root}`, `app-dev.${root}`, `organizador.${root}`];
});

/** Mapeo de path → entity para filtros del Copilot */
const PATH_TO_ENTITY: Record<string, string> = {
  '/invitados': 'guests',
  '/mesas': 'tables',
  '/presupuesto': 'budget_items',
  '/itinerario': 'moments',
  '/servicios': 'services',
};

/** Mapeo inverso: entity → path para auto-navegación */
const ENTITY_TO_PATH: Record<string, string> = {
  guests: '/invitados',
  tables: '/mesas',
  budget_items: '/presupuesto',
  moments: '/itinerario',
  services: '/servicios',
};

/** Preguntas sugeridas según sección actual */
function getSuggestedQuestions(path: string): string[] {
  if (path.includes('/invitados')) return [
    '¿Cuántos invitados han confirmado?',
    '¿Quiénes tienen alergias alimentarias?',
    'Invitados sin mesa asignada',
    'Estadísticas de invitados por grupo',
  ];
  if (path.includes('/presupuesto')) return [
    '¿Cuánto he gastado hasta ahora?',
    '¿Qué categoría tiene el mayor gasto?',
    '¿Cuánto falta por pagar?',
    '¿Alguna categoría supera el presupuesto?',
  ];
  if (path.includes('/mesas')) return [
    '¿Hay invitados sin mesa asignada?',
    'Sugiere distribución por grupos familiares',
    '¿Qué mesas tienen invitados con alergias?',
    '¿Cuántas sillas libres quedan?',
  ];
  if (path.includes('/itinerario') || path.includes('/servicios') || path.includes('/tareas')) return [
    '¿Qué tareas están pendientes?',
    '¿Hay tareas vencidas?',
    'Sugiere tareas típicas para este tipo de evento',
    '¿Cuál es la próxima tarea?',
  ];
  if (path.includes('/invitaciones')) return [
    '¿Cuántas invitaciones se han enviado?',
    '¿Quiénes no tienen email para invitar?',
    'Invitados que recibieron invitación pero no confirmaron',
    '¿Por qué canal se enviaron más invitaciones?',
  ];
  if (path.includes('/resumen-evento')) return [
    '¿Está listo mi evento?',
    'Dame un resumen general',
    '¿Qué me falta por hacer?',
    '¿Cómo van los números?',
  ];
  if (path.includes('/momentos')) return [
    '¿Cuántos álbumes tengo?',
    'Comparte el álbum del evento',
  ];
  return [
    '¿Cuántos invitados confirmados tengo?',
    '¿Cómo va el presupuesto?',
    'Muéstrame las tareas pendientes',
    '¿Qué me falta por hacer?',
  ];
}

/** Chips proactivos basados en datos del evento */
interface ProactiveChip { text: string; severity: 'danger' | 'warning' | 'info'; }

function getProactiveChips(ctx: any): ProactiveChip[] {
  if (!ctx?.eventSummary) return [];
  const chips: ProactiveChip[] = [];
  const s = ctx.eventSummary;
  const cross = ctx.screenData?._crossSection;

  if (s.pendingGuests > 10) chips.push({ text: `${s.pendingGuests} invitados sin confirmar`, severity: 'warning' });
  if (s.budgetRemaining < 0) chips.push({ text: `Presupuesto excedido ${Math.abs(s.budgetRemaining)}${s.currency}`, severity: 'danger' });
  if (cross?.confirmedWithoutTableCount > 0) chips.push({ text: `${cross.confirmedWithoutTableCount} confirmados sin mesa`, severity: 'warning' });
  if (cross?.overdueTasksCount > 0) chips.push({ text: `${cross.overdueTasksCount} tareas vencidas`, severity: 'danger' });
  if (cross?.unsentInvitations > 5) chips.push({ text: `${cross.unsentInvitations} invitaciones sin enviar`, severity: 'warning' });
  if (s.totalTasks > 0 && s.completedTasks === s.totalTasks) chips.push({ text: '¡Todas las tareas completadas!', severity: 'info' });
  if (s.daysUntilEvent >= 0 && s.daysUntilEvent <= 7) chips.push({ text: `¡Faltan ${s.daysUntilEvent} días para el evento!`, severity: 'danger' });
  if (s.daysUntilEvent >= 0 && s.daysUntilEvent <= 30 && s.daysUntilEvent > 7) chips.push({ text: `Faltan ${s.daysUntilEvent} días`, severity: 'info' });

  return chips.slice(0, 4);
}

export interface CopilotEmbedProps {
  userId: string;
  sessionId: string;
  development: string;
  eventId?: string;
  eventName?: string;
  pageContext?: PageContext;
  className?: string;
  isGuest?: boolean;
  loginPath?: string;
  onFirstMessage?: (firstMsg: string) => void;
}

// ── Tool result card ─────────────────────────────────────────────────────────

interface ToolResultCardProps {
  tool: string;
  result: ToolResultEvent['result'];
}

const ToolResultCard = ({ tool, result }: ToolResultCardProps) => {
  const typeLabels: Record<string, string> = {
    download: '📥',
    image_preview: '🖼️',
    data_table: '📊',
    qr_code: '📷',
    success: '✅',
    error: '❌',
  };
  const icon = typeLabels[result.type] || '🔧';

  if (result.type === 'error') {
    return (
      <div style={{
        margin: '6px 0', padding: '8px 12px', background: '#fff5f5',
        border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626',
      }}>
        {icon} <strong>{tool}</strong>: {result.error || 'Error desconocido'}
      </div>
    );
  }

  if (result.type === 'download' && result.url) {
    return (
      <div style={{
        margin: '6px 0', padding: '8px 12px', background: '#f0fdf4',
        border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#166534' }}>{result.filename || result.label || tool}</div>
          {result.size && <div style={{ color: '#6b7280', fontSize: 11 }}>{result.size}</div>}
        </div>
        <a
          href={result.url}
          download={result.filename}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '4px 12px', background: '#16a34a', color: '#fff',
            borderRadius: 6, textDecoration: 'none', fontSize: 11, fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Descargar
        </a>
      </div>
    );
  }

  if (result.type === 'image_preview' && result.imageUrl) {
    return (
      <div style={{ margin: '6px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <img
          src={result.imageUrl}
          alt={result.label || tool}
          style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }}
        />
        {result.label && (
          <div style={{ padding: '6px 10px', fontSize: 11, color: '#6b7280', background: '#f9fafb' }}>
            {icon} {result.label}
          </div>
        )}
      </div>
    );
  }

  if (result.type === 'qr_code' && result.imageUrl) {
    return (
      <div style={{
        margin: '6px 0', padding: '12px', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center',
      }}>
        <img src={result.imageUrl} alt="QR Code" style={{ width: 160, height: 160, margin: '0 auto', display: 'block' }} />
        {result.label && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>{result.label}</div>}
      </div>
    );
  }

  if (result.type === 'success') {
    return (
      <div style={{
        margin: '6px 0', padding: '8px 12px', background: '#f0fdf4',
        border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#166534',
      }}>
        {icon} {result.message || result.label || `${tool} completado`}
      </div>
    );
  }

  // Grilla de imágenes — venue visualizer, floor plans generados, etc.
  if ((result as any).type === 'image_gallery') {
    const images: Array<{ url: string; label?: string }> = (result as any).images || [];
    return (
      <div style={{ margin: '6px 0' }}>
        {result.label && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>🖼️ {result.label}</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
          {images.map((img, i) => (
            <div key={i} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <img
                src={img.url}
                alt={img.label || `${tool} ${i + 1}`}
                style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
              />
              {img.label && (
                <div style={{ padding: '3px 6px', fontSize: 10, color: '#6b7280', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.label}
                </div>
              )}
            </div>
          ))}
        </div>
        {(result as any).downloadUrl && (
          <a href={(result as any).downloadUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 6, fontSize: 11, color: '#6b7280', textDecoration: 'underline' }}>
            📥 Descargar todas
          </a>
        )}
      </div>
    );
  }

  // data_table o cualquier otro
  if (result.type === 'data_table' && result.data) {
    const rows = Array.isArray(result.data) ? result.data : [];
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    return (
      <div style={{ margin: '6px 0', overflowX: 'auto' }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{icon} {result.label || tool}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {cols.map(col => (
                <th key={col} style={{ padding: '4px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#374151', fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((row: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {cols.map(col => (
                  <td key={col} style={{ padding: '4px 8px', color: '#4b5563' }}>
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length > 20 && (
              <tr>
                <td colSpan={cols.length} style={{ padding: '4px 8px', color: '#9ca3af', fontSize: 10 }}>
                  …y {rows.length - 20} más
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

// ── Code output ──────────────────────────────────────────────────────────────

const CodeOutputCard = ({ event }: { event: CodeOutputEvent }) => {
  const [showCode, setShowCode] = useState(false);
  return (
    <div style={{
      margin: '6px 0', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', fontSize: 12,
    }}>
      <div style={{
        padding: '6px 10px', background: '#1e293b', color: '#94a3b8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>🐍 {event.language} · Código ejecutado</span>
        <button
          type="button"
          onClick={() => setShowCode(v => !v)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
        >
          {showCode ? 'Ocultar' : 'Ver código'}
        </button>
      </div>
      {showCode && (
        <pre style={{
          margin: 0, padding: '8px 10px', background: '#0f172a', color: '#e2e8f0',
          overflowX: 'auto', fontSize: 11, lineHeight: 1.6,
        }}>
          {event.code}
        </pre>
      )}
      {event.output && (
        <pre style={{
          margin: 0, padding: '8px 10px', background: '#f8fafc', color: '#334155',
          overflowX: 'auto', fontSize: 11, lineHeight: 1.6, borderTop: '1px solid #e5e7eb',
        }}>
          {event.output}
        </pre>
      )}
      {event.files && event.files.length > 0 && (
        <div style={{ padding: '6px 10px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {event.files.map((f, i) => (
            <a
              key={i}
              href={f.url}
              download={f.name}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#16a34a', textDecoration: 'underline' }}
            >
              📥 {f.name} {f.size && `(${f.size})`}
            </a>
          ))}
        </div>
      )}
      {event.error && (
        <div style={{ padding: '6px 10px', background: '#fff5f5', borderTop: '1px solid #fecaca', color: '#dc2626', fontSize: 11 }}>
          ❌ {event.error}
        </div>
      )}
    </div>
  );
};

// ── Confirmación de acción destructiva ──────────────────────────────────────

const ConfirmDialog = ({
  event,
  onConfirm,
  onCancel,
}: {
  event: ConfirmRequiredEvent;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div style={{
    margin: '8px 0', padding: '12px 14px',
    background: event.danger ? '#fff5f5' : '#fffbeb',
    border: `1px solid ${event.danger ? '#fecaca' : '#fde68a'}`,
    borderRadius: 10,
  }}>
    <p style={{ fontSize: 13, color: event.danger ? '#dc2626' : '#92400e', margin: '0 0 10px', fontWeight: 500 }}>
      {event.danger ? '⚠️' : '❓'} {event.message}
      {event.count && event.count > 1 && (
        <span style={{ fontWeight: 700 }}> ({event.count} elementos)</span>
      )}
    </p>
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        onClick={onConfirm}
        style={{
          padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: 'none',
          background: event.danger ? '#dc2626' : '#f59e0b', color: '#fff',
        }}
      >
        Confirmar
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{
          padding: '5px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
          border: '1px solid #d1d5db', background: '#fff', color: '#374151',
        }}
      >
        Cancelar
      </button>
    </div>
  </div>
);

// ── Botón de acción simple ───────────────────────────────────────────────────

const ActionBtn = ({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      background: 'none',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      color: '#6b7280',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
  >
    {children}
  </button>
);

// ── Razonamiento colapsable ──────────────────────────────────────────────────

const ReasoningSection = ({ text, isStreaming }: { text: string; isStreaming: boolean }) => {
  const [open, setOpen] = useState(isStreaming);
  useEffect(() => { if (!isStreaming) setOpen(false); }, [isStreaming]);
  return (
    <div style={{
      margin: '4px 0 8px', border: '1px solid #e0e7ff',
      borderRadius: 8, overflow: 'hidden', fontSize: 12,
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: '#eef2ff', border: 'none',
          cursor: 'pointer', color: '#4338ca', fontWeight: 500, fontSize: 11, textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13 }}>{isStreaming ? '🧠' : '💡'}</span>
        {isStreaming ? 'Razonando…' : 'Ver razonamiento'}
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          padding: '8px 10px', background: '#f5f3ff', color: '#4b5563',
          lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
        }}>
          {text || '…'}
        </div>
      )}
    </div>
  );
};

// ── Indicador herramienta corriendo ─────────────────────────────────────────

const ToolRunning = ({ tool }: { tool: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
    background: '#fffbeb', borderTop: '1px solid #fde68a',
    fontSize: 12, color: '#92400e', flexShrink: 0,
  }}>
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: '#f59e0b', animation: 'pulse 1s infinite',
    }} />
    Ejecutando <strong>{tool}</strong>…
  </div>
);

// ── Tipos extra para events inline ──────────────────────────────────────────

interface InlineEvent {
  type: 'tool_result' | 'code_output' | 'confirm';
  data: any;
}

// ── LocalStorage message persistence (24h TTL) ───────────────────────────────

const LS_MSGS_PREFIX = 'copilot_msgs_v1_';
const LS_MSGS_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function lsSaveMsgs(sessionId: string, messages: MessageItem[]): void {
  if (typeof window === 'undefined' || messages.length === 0) return;
  try {
    const toStore = messages.filter(m => !m.loading).map(m => ({
      id: m.id, role: m.role, message: m.message, createdAt: m.createdAt,
    }));
    localStorage.setItem(LS_MSGS_PREFIX + sessionId, JSON.stringify({ ts: Date.now(), messages: toStore }));
  } catch { /* quota exceeded */ }
}

function lsLoadMsgs(sessionId: string): MessageItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_MSGS_PREFIX + sessionId);
    if (!raw) return null;
    const { ts, messages } = JSON.parse(raw);
    if (Date.now() - ts > LS_MSGS_TTL_MS) {
      localStorage.removeItem(LS_MSGS_PREFIX + sessionId);
      return null;
    }
    return messages.map((m: any) => ({
      ...m,
      avatar: m.role === 'user' ? { title: 'Tú' } : { title: 'Copilot', backgroundColor: '#FF1493' },
      loading: false,
      // JSON serializa Date → string; restaurar como Date para que MessageList llame .getTime()
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
    }));
  } catch { return null; }
}

// ── Componente principal ─────────────────────────────────────────────────────

export const CopilotEmbed = ({
  userId,
  sessionId,
  development,
  eventId,
  eventName,
  pageContext,
  className,
  isGuest,
  loginPath,
  onFirstMessage,
}: CopilotEmbedProps) => {
  const router = useRouter();
  const toast = useToast();
  const keyboardInsetBottom = useVisualViewportKeyboardInset();
  const { setCopilotFilter, clearCopilotFilter, refreshEventsGroup } = EventsGroupContextProvider();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const firstMessageSentRef = useRef(false);
  const messagesRef = useRef<MessageItem[]>([]);
  const currentAssistantIdRef = useRef<string>('');

  const [retryContent, setRetryContent] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [showRecoverBanner, setShowRecoverBanner] = useState(false);
  const [reasoningText, setReasoningText] = useState('');
  const [isReasoning, setIsReasoning] = useState(false);
  const [runningTool, setRunningTool] = useState<string | null>(null);

  // Eventos inline por messageId (tool results, code output, confirmaciones)
  const [inlineEvents, setInlineEvents] = useState<Map<string, InlineEvent[]>>(new Map());
  // Confirmación pendiente
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmRequiredEvent | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Reset al cambiar de sesión
  useEffect(() => {
    setMessages([]);
    setLoading(false);
    setRetryContent(null);
    setIsRateLimited(false);
    setProgress(null);
    setShowRecoverBanner(false);
    setReasoningText('');
    setIsReasoning(false);
    setRunningTool(null);
    setInlineEvents(new Map());
    setPendingConfirm(null);
    firstMessageSentRef.current = false;
  }, [sessionId]);

  // Cargar historial (API → fallback localStorage 24h)
  useEffect(() => {
    const load = async () => {
      try {
        const history = await getChatHistory(sessionId, development);
        let formatted: MessageItem[] = history.map(msg => ({
          id: msg.id,
          role: msg.role,
          message: msg.content,
          avatar:
            msg.role === 'user'
              ? { title: 'Tú' }
              : { title: 'Copilot', backgroundColor: '#FF1493' },
          createdAt: msg.createdAt,
          loading: false,
          error: msg.error ? { message: msg.error } : undefined,
        }));
        // Si API devuelve vacío, intentar localStorage (24h TTL)
        if (formatted.length === 0) {
          const cached = lsLoadMsgs(sessionId);
          if (cached && cached.length > 0) {
            formatted = cached;
          }
        }
        if (formatted.length > 0) setLoadingHistory(true);
        setMessages(formatted);
        if (formatted.length > 0) {
          setShowRecoverBanner(true);
          firstMessageSentRef.current = true;
        }
      } catch (e) {
        console.error('[CopilotEmbed] history error:', e);
        // En error también intentar localStorage
        const cached = lsLoadMsgs(sessionId);
        if (cached && cached.length > 0) {
          setMessages(cached);
          setShowRecoverBanner(true);
          firstMessageSentRef.current = true;
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [sessionId, development]);

  // Persistir mensajes en localStorage cuando cambian (debounced 1s)
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => lsSaveMsgs(sessionId, messages), 1000);
    return () => clearTimeout(t);
  }, [sessionId, messages]);

  // Asociar evento inline al mensaje assistant actual
  const addInlineEvent = useCallback((msgId: string, event: InlineEvent) => {
    setInlineEvents(prev => {
      const next = new Map(prev);
      const existing = next.get(msgId) || [];
      next.set(msgId, [...existing, event]);
      return next;
    });
  }, []);

  // Handle enriched events del SSE
  const handleEnrichedEvent = useCallback(
    (event: EnrichedEvent) => {
      const assistantId = currentAssistantIdRef.current;
      switch (event.type) {
        case 'reasoning': {
          const chunk = typeof event.data === 'string' ? event.data : event.data?.text || '';
          setIsReasoning(true);
          setReasoningText(prev => prev + chunk);
          break;
        }
        case 'tool_start': {
          const tool = event.data?.tool || event.data || 'herramienta';
          setRunningTool(String(tool));
          break;
        }
        case 'tool_result': {
          setRunningTool(null);
          const toolResult = event.data as ToolResultEvent;
          if (assistantId) {
            addInlineEvent(assistantId, { type: 'tool_result', data: toolResult });
          }
          break;
        }
        case 'code_output': {
          if (assistantId) {
            addInlineEvent(assistantId, { type: 'code_output', data: event.data as CodeOutputEvent });
          }
          break;
        }
        case 'confirm_required': {
          setPendingConfirm(event.data as ConfirmRequiredEvent);
          break;
        }
        case 'ui_action': {
          const action = event.data as UIActionEvent & {
            entity?: string;
            ids?: string[];
            query?: string;
          };
          if (action.type === 'navigate' && action.path) {
            let pathname = action.path;
            let searchIds: string[] | undefined;
            let searchQuery: string | undefined;
            try {
              const url = new URL(action.path, 'http://localhost');
              pathname = url.pathname;
              const idsParam = url.searchParams.get('ids');
              if (idsParam) searchIds = idsParam.split(',').filter(Boolean);
              searchQuery = url.searchParams.get('query') || undefined;
            } catch { /* path sin query params */ }
            const entity = action.entity || PATH_TO_ENTITY[pathname];
            if (entity) setCopilotFilter({ entity, ids: action.ids || searchIds, query: action.query || searchQuery });
            router.push(action.path);
          } else if ((action.type as string) === 'filter') {
            const entity = action.entity;
            if (entity) {
              setCopilotFilter({ entity, ids: action.ids, query: action.query });
              const targetPath = ENTITY_TO_PATH[entity];
              if (targetPath && !router.pathname.includes(targetPath)) router.push(targetPath);
            }
          } else if ((action.type as string) === 'clear_filter') {
            clearCopilotFilter();
          } else if (action.type === 'refresh_data') {
            refreshEventsGroup();
            router.replace(router.asPath);
          }
          break;
        }
        case 'progress': {
          const prog = event.data as ProgressEvent;
          setProgress(prog);
          if (prog.status === 'completed' || prog.status === 'error') {
            setTimeout(() => setProgress(null), 2000);
          }
          break;
        }
        default:
          break;
      }
    },
    [router, setCopilotFilter, clearCopilotFilter, refreshEventsGroup, addInlineEvent],
  );

  // Construir acciones por mensaje
  const buildActions = useCallback(
    (msgId: string, role: 'user' | 'assistant', isLast: boolean, content: string) => {
      if (role !== 'assistant') return undefined;
      const handleCopy = () => {
        navigator.clipboard.writeText(content).then(
          () => toast('success', 'Copiado'),
          () => toast('error', 'No se pudo copiar'),
        );
      };
      const handleRegen = () => {
        setMessages(prev => {
          const lastUserIdx = [...prev].reverse().findIndex(m => m.role === 'user');
          if (lastUserIdx === -1) return prev;
          const userIdx = prev.length - 1 - lastUserIdx;
          const userMsg = prev[userIdx];
          const trimmed = prev.slice(0, userIdx);
          setTimeout(() => handleSend(userMsg.message as string), 0);
          return trimmed;
        });
      };
      return (
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <ActionBtn onClick={handleCopy} title="Copiar respuesta">📋 Copiar</ActionBtn>
          {isLast && !loading && (
            <ActionBtn onClick={handleRegen} title="Regenerar respuesta">🔄 Regenerar</ActionBtn>
          )}
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, toast],
  );

  // Rebuild messages with actions + inline events
  const messagesWithActions = useMemo(() => messages.map((msg, idx) => {
    const isLast = idx === messages.length - 1;
    const events = inlineEvents.get(msg.id) || [];

    // Construir belowMessage con tool results, code outputs
    const belowMessage = events.length > 0 ? (
      <div>
        {events.map((e, i) => {
          if (e.type === 'tool_result') {
            const tr = e.data as ToolResultEvent;
            return <ToolResultCard key={i} tool={tr.tool} result={tr.result} />;
          }
          if (e.type === 'code_output') {
            return <CodeOutputCard key={i} event={e.data as CodeOutputEvent} />;
          }
          return null;
        })}
      </div>
    ) : undefined;

    return {
      ...msg,
      actions: buildActions(msg.id, msg.role as 'user' | 'assistant', isLast, msg.message as string || ''),
      aboveMessage:
        isLast && msg.role === 'assistant' && (isReasoning || reasoningText) ? (
          <ReasoningSection text={reasoningText} isStreaming={isReasoning} />
        ) : undefined,
      belowMessage,
    };
  }), [messages, buildActions, isReasoning, reasoningText, inlineEvents]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;
      if (!firstMessageSentRef.current) {
        firstMessageSentRef.current = true;
        onFirstMessage?.(content);
      }
      setReasoningText('');
      setIsReasoning(false);
      setRunningTool(null);
      setPendingConfirm(null);

      const userMessageId = generateMessageId();
      const userMessage: MessageItem = {
        id: userMessageId,
        role: 'user',
        message: content,
        avatar: { title: 'Tú' },
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setLoading(true);
      setRetryContent(null);

      const assistantMessageId = generateMessageId();
      currentAssistantIdRef.current = assistantMessageId;
      const assistantMessage: MessageItem = {
        id: assistantMessageId,
        role: 'assistant',
        message: '',
        avatar: { title: 'Copilot', backgroundColor: '#FF1493' },
        createdAt: new Date(),
        loading: true,
      };
      setMessages(prev => [...prev, assistantMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const messageHistory = messagesRef.current.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.message as string || '',
        }));
        const params: SendMessageParams = {
          message: content, sessionId, userId, development,
          eventId, eventName, pageContext, messageHistory,
          // SEGURIDAD: si el usuario es visitante en appEventos, no enviar token de auth.
          // El token idTokenV0.1.0 puede pertenecer a otro usuario logueado en chat-ia
          // y causaría que el copilot devuelva datos privados de ese otro usuario.
          isAnonymous: isGuest ?? false,
        };
        await sendChatMessage(
          params,
          chunk => {
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.id === assistantMessageId) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  message: (updated[lastIdx].message as string) + chunk,
                  loading: false,
                };
              }
              return updated;
            });
          },
          controller.signal,
          event => {
            handleEnrichedEvent(event);
            if (event.type === 'tool_result') setIsReasoning(false);
          },
        );
        setIsReasoning(false);
        setRunningTool(null);
        currentAssistantIdRef.current = '';
      } catch (error: any) {
        setIsReasoning(false);
        setRunningTool(null);
        currentAssistantIdRef.current = '';
        const isAbort = error.name === 'AbortError';
        const isAuthError = error.__errorCode === 'AUTH_ERROR';
        const isRateLimitError = error.__errorCode === 'RATE_LIMIT';
        if (!isAbort && !isAuthError && !isRateLimitError) setRetryContent(content);
        if (isRateLimitError) setIsRateLimited(true);
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.id === assistantMessageId) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              message: isAbort ? 'Solicitud cancelada.' : error.message || 'Error al enviar el mensaje.',
              loading: false,
              error: { message: error.message || 'Ocurrió un error.' },
            };
          }
          return updated;
        });
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, userId, development, eventId, eventName, pageContext, loading, handleEnrichedEvent, onFirstMessage],
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRetry = useCallback(() => {
    if (!retryContent || loading) return;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && last?.error) return prev.slice(0, -2);
      return prev;
    });
    handleSend(retryContent);
  }, [retryContent, loading, handleSend]);

  // Interceptar clicks en links markdown internos
  const messageListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('/')) {
        e.preventDefault();
        try {
          const url = new URL(href, 'http://localhost');
          const entity = PATH_TO_ENTITY[url.pathname];
          if (entity) {
            const idsParam = url.searchParams.get('ids');
            const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined;
            const query = url.searchParams.get('query') || undefined;
            if (ids || query) setCopilotFilter({ entity, ids, query });
          }
        } catch { /* ignorar */ }
        router.push(href);
        return;
      }
      try {
        const url = new URL(href, window.location.origin);
        const knownHosts = KNOWN_APP_HOSTS;
        if (url.origin === window.location.origin || knownHosts.some(h => url.hostname === h)) {
          e.preventDefault();
          router.push(url.pathname + url.search + url.hash);
        }
      } catch { /* ignorar */ }
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [router, setCopilotFilter]);

  useEffect(() => { return () => { abortControllerRef.current?.abort(); }; }, []);

  // Empty state — sin color heredado en el root (evita gris ilegible); contraste explícito
  const emptyState = useMemo(() => (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: 440,
        margin: '0 auto',
        padding: '20px 12px 24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '28px 20px 22px',
          borderRadius: 16,
          background: 'linear-gradient(145deg, #fff5f9 0%, #ffffff 45%, #fdf2f8 100%)',
          border: '1px solid #fce7f3',
          boxShadow: '0 1px 3px rgba(236, 72, 153, 0.08), 0 8px 24px rgba(17, 24, 39, 0.06)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            marginBottom: 14,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #fce7f3, #fff)',
            border: '1px solid #fbcfe8',
            fontSize: 26,
            lineHeight: 1,
          }}
          aria-hidden
        >
          ✨
        </div>
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#111827',
            lineHeight: 1.25,
          }}
        >
          Copilot IA
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 500, color: '#4b5563', lineHeight: 1.45 }}>
          {eventName ? `Evento: ${eventName}` : 'Tu asistente de bodas inteligente'}
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
          Pregunta por invitados, presupuesto, mesas o servicios. También puedes escribir abajo.
        </p>
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#9ca3af',
          }}
        >
          Prueba con
        </p>
        {/* Chips proactivos */}
        {(() => {
          const chips = getProactiveChips(pageContext);
          if (chips.length === 0) return null;
          const chipColors = { danger: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' }, warning: { bg: '#fffbeb', border: '#fcd34d', text: '#d97706' }, info: { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb' } };
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {chips.map(chip => {
                const c = chipColors[chip.severity];
                return (
                  <button key={chip.text} type="button" onClick={() => handleSend(chip.text)}
                    style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: c.text, cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    {chip.severity === 'danger' ? '🔴' : chip.severity === 'warning' ? '🟡' : '🟢'} {chip.text}
                  </button>
                );
              })}
            </div>
          );
        })()}
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
          Prueba con
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
          {getSuggestedQuestions(router?.pathname || '').map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 500,
                color: '#1f2937',
                cursor: 'pointer',
                textAlign: 'left',
                lineHeight: 1.4,
                transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fdf2f8';
                e.currentTarget.style.borderColor = '#f472b6';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  ), [eventName, handleSend, pageContext, router?.pathname]);

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
    >
      {/* Banner guest */}
      {isGuest && !isRateLimited && (
        <div style={{
          padding: '7px 16px', background: '#fff5f9', borderBottom: '1px solid #ffe0ef',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: '#999' }}>Modo gratuito · mensajes limitados</span>
          <a href={loginPath || '/login'} style={{ fontSize: 12, color: '#eb2f96', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Regístrate →
          </a>
        </div>
      )}

      {/* Banner eliminado — el historial es accesible desde el icono reloj del header */}

      {/* Lista de mensajes */}
      <div ref={messageListRef} style={{ flex: 1, overflow: 'hidden' }}>
        <MessageList
          messages={messagesWithActions}
          autoScroll
          loading={loadingHistory}
          emptyState={emptyState}
        />
      </div>

      {/* Confirmación pendiente */}
      {pendingConfirm && (
        <div style={{ padding: '0 16px', flexShrink: 0 }}>
          <ConfirmDialog
            event={pendingConfirm}
            onConfirm={() => {
              // Enviar confirmación al backend (mensaje especial)
              handleSend(`[CONFIRM:${pendingConfirm.id}]`);
              setPendingConfirm(null);
            }}
            onCancel={() => {
              setPendingConfirm(null);
            }}
          />
        </div>
      )}

      {/* Progreso multi-paso */}
      {progress && (
        <div style={{
          padding: '8px 16px', background: '#f0f7ff', borderTop: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{ flex: 1, height: 4, background: '#dbeafe', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.round((progress.step / progress.total) * 100)}%`,
              background: progress.status === 'error' ? '#ef4444' : '#3b82f6',
              borderRadius: 2, transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {progress.label} ({progress.step}/{progress.total})
          </span>
        </div>
      )}

      {/* Herramienta corriendo */}
      {runningTool && <ToolRunning tool={runningTool} />}

      {/* Rate limit */}
      {isRateLimited && (
        <div style={{
          padding: '10px 16px', background: '#fff0f6', borderTop: '1px solid #ffadd2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: '#c41d7f', flex: 1 }}>Límite de mensajes gratuitos alcanzado.</span>
          <a href={loginPath || '/login'} style={{
            fontSize: 13, color: '#fff', background: '#eb2f96', borderRadius: 6,
            padding: '4px 12px', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            Regístrate gratis
          </a>
        </div>
      )}

      {/* Retry */}
      {retryContent && !loading && !isRateLimited && (
        <div style={{
          padding: '8px 16px', background: '#fff7f0', borderTop: '1px solid #ffd0a8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: '#c05000' }}>El asistente no pudo responder.</span>
          <button onClick={handleRetry} disabled={loading}
            style={{ fontSize: 13, color: '#fff', background: '#e05a00', border: 'none', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontWeight: 500 }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Input area — full LobeChat editor (CopilotChatInput); padding extra con teclado virtual móvil */}
      <div
        style={{
          borderTop: '1px solid #e8e8e8',
          background: '#fff',
          flexShrink: 0,
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${keyboardInsetBottom}px)`,
        }}
      >
        <CopilotChatInput
          generating={loading}
          chatKey={sessionId}
          onSend={({ clearContent, getMarkdownContent }) => {
            const content = getMarkdownContent();
            if (content.trim()) {
              handleSend(content);
              clearContent();
            }
          }}
          sendButtonProps={{
            generating: loading,
            onStop: ({ editor }) => handleStop(),
          }}
          onClear={() => {
            setMessages([]);
            clearCopilotFilter();
          }}
          onSearchToggle={(enabled) => {
            // TODO: wire to pageContext search flag
          }}
          fileUploadEnabled={false}
        />
      </div>
    </div>
  );
};

export default CopilotEmbed;
