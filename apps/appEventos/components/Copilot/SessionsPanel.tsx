/**
 * SessionsPanel — Panel izquierdo de conversaciones del Copilot.
 * Lista de sesiones con creación, selección y borrado.
 */

import { FC, memo } from 'react';
import { IoAddOutline, IoTimeOutline, IoTrashOutline, IoChevronBackOutline } from 'react-icons/io5';

export interface StoredSession {
  id: string;
  label: string;
  createdAt: number;
}

interface SessionsPanelProps {
  sessions: StoredSession[];
  activeSessionId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onCollapse: () => void;
}

const SessionsPanel: FC<SessionsPanelProps> = ({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  onCollapse,
}) => {
  return (
    <div
      style={{
        width: 200,
        minWidth: 200,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #f0f0f0',
        background: '#fafafa',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 8px 8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Conversaciones
        </span>
        <button
          type="button"
          onClick={onCollapse}
          title="Ocultar panel"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '2px 4px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
        >
          <IoChevronBackOutline style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Cambiar conversación rápido (lista compacta) */}
      <div style={{ padding: '6px 8px 0', flexShrink: 0 }}>
        <label
          htmlFor="copilot-session-select"
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 4,
          }}
        >
          Conversación activa
        </label>
        <select
          id="copilot-session-select"
          value={sessions.some(s => s.id === activeSessionId) ? activeSessionId : ''}
          onChange={e => {
            const v = e.target.value;
            if (v) onSelect(v);
          }}
          disabled={sessions.length === 0}
          title="Cambiar de conversación"
          style={{
            width: '100%',
            padding: '8px 28px 8px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: '#374151',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            cursor: sessions.length === 0 ? 'not-allowed' : 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            backgroundSize: 14,
          }}
        >
          {sessions.length === 0 ? (
            <option value="">Sin conversaciones — pulsa Nueva</option>
          ) : (
            sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Nueva conversación */}
      <div style={{ padding: '8px 8px 4px' }}>
        <button
          type="button"
          onClick={onNew}
          style={{
            width: '100%',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff',
            border: '1px solid #fce7f3',
            borderRadius: 8,
            color: '#ec4899',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fdf2f8';
            e.currentTarget.style.borderColor = '#f9a8d4';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#fce7f3';
          }}
        >
          <IoAddOutline style={{ width: 14, height: 14, flexShrink: 0 }} />
          Nueva
        </button>
      </div>

      {/* Lista de sesiones */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px 8px' }}>
        {sessions.length === 0 ? (
          <p
            style={{
              fontSize: 11,
              color: '#9ca3af',
              textAlign: 'center',
              marginTop: 20,
              padding: '0 8px',
              lineHeight: 1.5,
            }}
          >
            Empieza una conversación
          </p>
        ) : (
          sessions.map(s => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  borderRadius: 8,
                  margin: '2px 0',
                  background: isActive ? '#fdf2f8' : 'transparent',
                  border: isActive ? '1px solid #fce7f3' : '1px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    padding: '7px 4px 7px 8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IoTimeOutline
                      style={{
                        width: 11,
                        height: 11,
                        color: isActive ? '#ec4899' : '#9ca3af',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: isActive ? '#be185d' : '#374151',
                        fontWeight: isActive ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                      paddingLeft: 16,
                      lineHeight: 1.3,
                    }}
                  >
                    {new Date(s.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </button>

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  title="Eliminar conversación"
                  style={{
                    padding: '7px 6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#e5e7eb',
                    flexShrink: 0,
                    transition: 'color 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#e5e7eb')}
                >
                  <IoTrashOutline style={{ width: 12, height: 12 }} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

SessionsPanel.displayName = 'SessionsPanel';
export default memo(SessionsPanel);
