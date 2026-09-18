'use client';

import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

import { useBandejaBrand } from '../utils/brand';
import { previewText } from '../utils/preview';
import { IaModeBadge, SharedBadge } from './RowIndicators';
import type { SharedPrincipal } from '../utils/visibility';

/**
 * FilaConversacion — UNA fila, la misma en las dos listas.
 *
 * F4 del informe del owner (ronda 3): "/bandeja tiene un aspecto y la vista con conversación
 * abierta otro (antiguo, sin etiquetas)". Era cierto y la causa era estructural: dos
 * componentes distintos pintando lo mismo. Cada arreglo había que hacerlo dos veces, y el que
 * se olvidaba producía justo esa sensación de que "los arreglos solo llegan al índice".
 *
 * Lo que tenía cada una, antes de unirlas:
 *   índice → RSVP, responsable humano, nombre del agente
 *   canal  → "escribiendo…", menú contextual, punto de presencia, estado (En espera/Cerrada)
 * Aquí está la unión. Lo que no aplique, se omite: el que llama pasa solo lo que tiene.
 *
 * El botón de abrir va DEBAJO del contenido (`absolute inset-0`) y no envolviéndolo, porque
 * los indicadores son botones y anidarlos sería HTML inválido.
 */

export interface FilaDatos {
  /** Nombre del agente IA responsable, si lo hay. */
  agente?: string | null;
  /** Iniciales o carácter para el avatar. */
  avatar: string;
  /** Color del punto de canal. */
  canalColor: string;
  /** "WhatsApp", "Instagram"… para el tooltip. */
  canalNombre: string;
  /** Con quién está compartida. */
  compartidaCon?: SharedPrincipal[] | null;
  /** 'WAB' (API de Meta) | 'WEB_QR' (número vinculado). Solo WhatsApp. */
  conexion?: string | null;
  /** Teléfono o usuario, para el tooltip del nombre. */
  contacto?: string;
  /** El contacto está escribiendo ahora mismo. */
  escribiendo?: boolean;
  /** 'pending' | 'closed' — 'open' no se pinta, es lo normal. */
  estado?: string | null;
  /** Marca de tiempo ya formateada. */
  hora: string;
  id: string;
  /** Canal informativo (newsletter/estado): no admite respuesta. */
  informativo?: boolean;
  /** Mensaje: texto ya limpio de marcado. */
  mensaje: string;
  /** El último mensaje lo escribimos nosotros. */
  mensajeMio?: boolean;
  nombre: string;
  /** En línea hace menos de 5 minutos. */
  presente?: boolean;
  /** La lleva esta persona (id). */
  responsable?: string | null;
  /** El responsable soy yo. */
  responsableSoyYo?: boolean;
  /** 'confirmed' | 'pending' | 'declined' — solo en modo evento. */
  rsvp?: string | null;
  sinLeer: number;
}


const RSVP_COLOR: Record<string, string> = {
  confirmed: '#22C55E',
  declined: '#F43F5E',
  pending: '#F59E0B',
};

const RSVP_TEXTO: Record<string, string> = {
  confirmed: 'Confirmado',
  declined: 'Declinado',
  pending: 'Pendiente',
};

interface FilaConversacionProps {
  /** Se pinta encima del contenido, fuera del botón: menú contextual, etc. */
  children?: ReactNode;
  datos: FilaDatos;
  development?: string;
  fondo?: string;
  onAbrir: () => void;
  onCompartir?: () => void;
  onContextMenu?: (e: ReactMouseEvent) => void;
  seleccionada?: boolean;
}

export function FilaConversacion({
  children,
  datos: d,
  development,
  fondo,
  onAbrir,
  onCompartir,
  onContextMenu,
  seleccionada,
}: FilaConversacionProps) {
  const brand = useBandejaBrand();
  const sinLeer = d.sinLeer > 0;

  return (
    <div
      className="group relative border-b border-[var(--b-border)] last:border-0"
      onContextMenu={onContextMenu}
      style={{ backgroundColor: seleccionada ? 'var(--b-surface-2)' : fondo }}
    >
      <button
        aria-label={`Abrir conversación con ${d.nombre}`}
        className="absolute inset-0 h-full w-full"
        onClick={onAbrir}
        type="button"
      />
      <div className="pointer-events-none relative flex items-center gap-2.5 px-3 py-1.5 text-left">
        {/* Avatar con punto de canal, presencia y RSVP */}
        <div className="relative flex-shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
            style={{ backgroundColor: 'var(--b-surface-2)', color: 'var(--b-text-1)' }}
          >
            {d.avatar}
          </div>
          <span
            aria-label={`Canal ${d.canalNombre}`}
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
            style={{ backgroundColor: d.canalColor, boxShadow: '0 0 0 2px var(--b-surface)' }}
            title={d.canalNombre}
          />
          {d.presente && (
            <span
              aria-label="En línea"
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: '#22C55E', boxShadow: '0 0 0 2px var(--b-surface)' }}
            />
          )}
          {d.rsvp && (
            <span
              aria-label={`RSVP ${RSVP_TEXTO[d.rsvp] ?? d.rsvp}`}
              className="absolute -bottom-0.5 -left-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: RSVP_COLOR[d.rsvp] ?? '#84848F' }}
              title={RSVP_TEXTO[d.rsvp] ?? d.rsvp}
            >
              {d.rsvp === 'confirmed' ? '✓' : d.rsvp === 'pending' ? '⏳' : '✕'}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Nombre · tipo de conexión · estado · hora */}
          <div className="flex items-baseline justify-between gap-2">
            <h3
              className={`truncate text-[13px] ${sinLeer ? 'font-bold' : 'font-semibold'}`}
              style={{ color: 'var(--b-text-1)' }}
              title={d.contacto || d.nombre}
            >
              {d.nombre}
            </h3>
            {d.conexion && (
              <span
                className="flex-none rounded px-1 text-[9px] font-bold uppercase tracking-wide"
                style={
                  d.conexion === 'WEB_QR'
                    ? { backgroundColor: 'var(--b-surface-2)', color: 'var(--b-text-2)' }
                    : { backgroundColor: '#ECFDF5', color: '#047857' }
                }
                title={
                  d.conexion === 'WEB_QR'
                    ? 'Número vinculado por QR: puedes responder siempre, sin plantillas'
                    : 'WhatsApp Business API (Meta): fuera de 24h solo con plantilla aprobada'
                }
              >
                {d.conexion === 'WEB_QR' ? 'QR' : 'API'}
              </span>
            )}
            {d.informativo && (
              <span
                className="flex-none rounded px-1 text-[9px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: 'var(--b-surface-2)', color: 'var(--b-text-2)' }}
                title="Canal informativo (newsletter/estado): no admite respuesta"
              >
                Info
              </span>
            )}
            {d.estado === 'pending' && (
              <span
                className="flex-none rounded-full px-1.5 text-[10px] font-medium"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
              >
                En espera
              </span>
            )}
            {d.estado === 'closed' && (
              <span
                className="flex-none rounded-full px-1.5 text-[10px] font-medium"
                style={{ backgroundColor: 'var(--b-surface-2)', color: 'var(--b-text-2)' }}
              >
                Cerrada
              </span>
            )}
            <span className="flex-shrink-0 text-[10px]" style={{ color: 'var(--b-text-3)' }}>
              {d.hora}
            </span>
          </div>

          {/* Mensaje · responsable · indicadores · no leídos */}
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              {d.escribiendo ? (
                <span
                  className="inline-flex items-center gap-0.5 text-xs italic"
                  style={{ color: brand.brandText }}
                >
                  Escribiendo…
                </span>
              ) : (
                <p
                  className="truncate text-[11.5px]"
                  style={{
                    color: sinLeer ? 'var(--b-text-1)' : 'var(--b-text-2)',
                    fontWeight: sinLeer ? 500 : 400,
                  }}
                >
                  {!!d.mensaje && d.mensajeMio && (
                    <span style={{ color: 'var(--b-text-3)' }}>Tú: </span>
                  )}
                  {previewText(d.mensaje)}
                </p>
              )}
            </div>

            {d.responsable && (
              <span
                className="flex-none rounded-full px-1.5 text-[10px] font-semibold"
                style={
                  d.responsableSoyYo
                    ? { backgroundColor: brand.brandBg, color: brand.brandText }
                    : { backgroundColor: 'var(--b-surface-2)', color: 'var(--b-text-2)' }
                }
                title={d.responsableSoyYo ? 'Asignada a ti' : 'La lleva otra persona'}
              >
                {d.responsableSoyYo ? 'Tuya' : '·'}
              </span>
            )}
            {d.agente && (
              <span
                className="inline-flex max-w-[80px] flex-none items-center gap-0.5 truncate rounded-full px-1 text-[10px] font-medium"
                style={{ backgroundColor: brand.brandBg, color: brand.brandText }}
                title={`Responsable: ${d.agente}`}
              >
                <span aria-hidden>🤖</span>
                <span className="truncate">{d.agente}</span>
              </span>
            )}
            <SharedBadge onManage={onCompartir} sharedWith={d.compartidaCon} />
            {development && <IaModeBadge conversationId={d.id} development={development} />}
            {sinLeer && (
              <span
                aria-label={`${d.sinLeer} sin leer`}
                className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: brand.brandSolid, color: brand.onBrand, minWidth: 20 }}
              >
                {d.sinLeer > 99 ? '99+' : d.sinLeer}
              </span>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
