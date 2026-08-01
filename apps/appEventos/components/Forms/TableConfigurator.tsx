/**
 * TableConfigurator.tsx
 * Capa superior sobre el sistema de mesas existente — NO modifica FormCrearMesa,
 * FormEditarMesa ni el canvas de interact.js.
 *
 * Uso en mesas.tsx (una sola línea, sin tocar nada más):
 *   <TableConfiguratorFloating />
 *
 * El botón flotante "✦ Nuevo diseño" abre el configurador visual.
 * Al confirmar llama queries.createTable con los mismos parámetros que FormCrearMesa
 * + datos adicionales (svgString, tableConfig) que el sistema actual ignora.
 */
import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { generateTableSVG, getMaxSeats, TABLE_DEFAULTS, getTableTotalSize } from '@bodasdehoy/shared/utils';
import type { TableConfig, ChairStyle, TableShape } from '@bodasdehoy/shared/utils';
import { EventContextProvider } from '../../context';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useToast } from '../../hooks/useToast';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS del configurador puro (reutilizable desde tools Render en la app de chat, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export interface TableConfiguratorProps {
  initialConfig?: Partial<TableConfig>;
  onConfirm: (config: TableConfig, svgString: string) => void;
  onCancel: () => void;
  nextTableNumber?: number;
  /** Modo "banco" al CREAR: fila lineal de sillas sueltas + nº de filas paralelas. */
  benchMode?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPA: shape → tipo del sistema existente (para compatibilidad con el canvas)
// ─────────────────────────────────────────────────────────────────────────────

const SHAPE_TO_TIPO: Record<TableShape, string> = {
  round: 'redonda',
  rectangular: 'imperial',
  oval: 'redonda',
  square: 'cuadrada',
  semicircle: 'podio',
  head: 'podio',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE FLOTANTE AUTOCONTENIDO (una sola línea en mesas.tsx)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Botón flotante + modal configurador.
 * Se monta junto al canvas de mesas sin modificar ningún componente existente.
 */
export function TableConfiguratorFloating() {
  const [open, setOpen] = useState(false);
  const [benchOpen, setBenchOpen] = useState(false);
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, planSpaceSelect } = EventContextProvider();
  const toast = useToast();

  // El estado vacío del lienzo (ComponenteTransformWrapper) abre este panel disparando
  // un evento global — así no hay que subir el estado `open` ni acoplar componentes.
  useEffect(() => {
    const openDesigner = () => setOpen(true);
    window.addEventListener('open-table-designer', openDesigner);
    return () => window.removeEventListener('open-table-designer', openDesigner);
  }, []);

  if (!event || !planSpaceActive) return null;

  const handleConfirm = async (config: TableConfig, svgString: string) => {
    try {
      const position = {
        x: 200 + Math.round(Math.random() * 100),
        y: 200 + Math.round(Math.random() * 100),
      };
      const title = config.tableName || `Mesa ${config.tableNumber ?? planSpaceActive.tables.length + 1}`;
      const tipo = SHAPE_TO_TIPO[config.shape] ?? 'redonda';
      // Mesa nueva dentro del planSpace (el front es dueño de planSpace[].tables).
      const newTable: any = {
        _id: genTableId(),
        title,
        nombre_mesa: title,
        tipo,
        cantidad_sillas: config.seats,
        numberChair: config.seats,
        position,
        rotation: 0,
        size: { width: 100, height: 80 },
        tableConfig: config,
        svgString,
        guests: [],
      };
      const nextPlanSpace = {
        ...planSpaceActive,
        tables: [...(planSpaceActive.tables ?? []), newTable],
      };
      const nextPlanSpaces = (event.planSpace ?? []).map((ps: any) =>
        (ps?._id === nextPlanSpace._id || ps?._id === planSpaceSelect) ? nextPlanSpace : ps
      );
      // Persistir vía updateEvento({planSpace}) — createTable escribe en el legacy
      // mesas_array, desconectado de esta UI. Igual que eliminar/crear plano.
      const result: any = await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: event._id, input: { planSpace: nextPlanSpaces } },
      });
      if (!result?.success) {
        toast('error', result?.errors?.[0]?.message ?? 'Error al crear la mesa');
        return;
      }
      setPlanSpaceActive(nextPlanSpace);
      setEvent({ ...event, planSpace: nextPlanSpaces });
      // Toast con «Deshacer» (MesasUndoToast escucha este evento).
      window.dispatchEvent(new CustomEvent('mesas-toast', { detail: { action: 'create', table: newTable } }));
    } catch {
      toast('error', 'Error al crear la mesa desde el configurador');
    } finally {
      setOpen(false);
    }
  };

  // Crea N bancos PARALELOS (cada uno = fila lineal de `seats` sillas), apilados con
  // separación vertical, desde el modal en modo banco. Persiste vía updateEvento(planSpace).
  const handleAddBenchRows = async (config: any) => {
    try {
      const rows = Math.max(1, Math.min(10, Math.floor(config?.rows ?? 1)));
      const seats = Math.max(1, Math.floor(config?.seats ?? 12));
      const baseName = (config?.tableName || 'Bancos ceremonia').toString();
      const baseX = 180 + Math.round(Math.random() * 60);
      const baseY = 200 + Math.round(Math.random() * 40);
      const rowGap = 60; // separación vertical entre bancos paralelos
      const startN = (planSpaceActive.tables?.length ?? 0) + 1;
      const newTables = Array.from({ length: rows }, (_, r) => {
        const title = rows > 1 ? `${baseName} ${startN + r}` : `${baseName} ${startN}`;
        return {
          _id: genTableId(),
          title, nombre_mesa: title, tipo: 'bancos',
          cantidad_sillas: seats, numberChair: seats,
          position: { x: baseX, y: baseY + r * rowGap },
          rotation: 0, size: { width: 100, height: 40 },
          tableConfig: { shape: 'rectangular', seats, chairStyle: config?.chairStyle ?? 'bench', isBench: true },
          guests: [],
        } as any;
      });
      const nextPlanSpace = {
        ...planSpaceActive,
        tables: [...(planSpaceActive.tables ?? []), ...newTables],
      };
      const nextPlanSpaces = (event.planSpace ?? []).map((ps: any) =>
        (ps?._id === nextPlanSpace._id || ps?._id === planSpaceSelect) ? nextPlanSpace : ps
      );
      const result: any = await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: event._id, input: { planSpace: nextPlanSpaces } },
      });
      if (!result?.success) {
        toast('error', result?.errors?.[0]?.message ?? 'Error al añadir bancos al plano');
        return;
      }
      setPlanSpaceActive(nextPlanSpace);
      setEvent({ ...event, planSpace: nextPlanSpaces });
      toast('success', rows > 1 ? `${rows} bancos añadidos al plano` : 'Banco añadido al plano');
    } catch {
      toast('error', 'Error al añadir bancos al plano');
    } finally {
      setBenchOpen(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 200,
          background: '#EF5B94',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '13px 20px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(239,91,148,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ＋ Añadir mesa
      </button>

      <button
        type="button"
        onClick={() => setBenchOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 188,
          zIndex: 200,
          background: '#fff',
          color: '#EF5B94',
          border: '1.5px solid #f0aecb',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        }}
      >
        ＋ Bancos
      </button>

      {/* Modal configurador de MESA */}
      {open && (
        <TableConfigurator
          nextTableNumber={(planSpaceActive.tables?.length ?? 0) + 1}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}

      {/* Modal configurador de BANCO (fila lineal + nº de filas paralelas) */}
      {benchOpen && (
        <TableConfigurator
          benchMode
          nextTableNumber={(planSpaceActive.tables?.length ?? 0) + 1}
          onConfirm={handleAddBenchRows}
          onCancel={() => setBenchOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURADOR PURO (sin lógica de negocio — reutilizable)
// ─────────────────────────────────────────────────────────────────────────────

const SHAPES: { id: TableShape; label: string }[] = [
  { id: 'round', label: 'Redonda' },
  { id: 'rectangular', label: 'Rectangular' },
  { id: 'square', label: 'Cuadrada' },
];

// El usuario edita el TOTAL de sillas (el plano las reparte automáticamente).
// El SVG de la preview sí dibuja por lado, así que derivamos un reparto sensato
// del total para que la preview siga funcionando (rectangular: 1 en cada extremo
// corto + resto en los lados largos; cuadrada: reparto uniforme en 4 lados).
function distributeSeatsBySide(total: number, shape: TableShape): { seatsTop: number; seatsBottom: number; seatsLeft: number; seatsRight: number } {
  const n = Math.max(0, Math.floor(total || 0));
  if (shape === 'square') {
    const per = Math.floor(n / 4), r = n % 4;
    return { seatsTop: per + (r > 0 ? 1 : 0), seatsRight: per + (r > 1 ? 1 : 0), seatsBottom: per + (r > 2 ? 1 : 0), seatsLeft: per };
  }
  const ends = n >= 2 ? 1 : 0;
  const rest = n - ends * 2;
  return { seatsTop: Math.ceil(rest / 2), seatsBottom: Math.floor(rest / 2), seatsLeft: ends, seatsRight: ends };
}

// El front es dueño de planSpace[].tables. El backend createTable escribe en el
// legacy `evento.mesas_array` (desconectado de esta UI), así que generamos aquí un
// _id estilo ObjectId (24 hex) y persistimos la mesa dentro del planSpace vía
// updateEvento({planSpace}) — el mismo mecanismo que eliminar/crear plano.
function genTableId(): string {
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  let rest = '';
  for (let i = 0; i < 16; i++) rest += Math.floor(Math.random() * 16).toString(16);
  return ts + rest;
}

// Preview LINEAL para bancos: una sola fila de sillas sobre una barra (coherente con
// cómo se dibuja el banco en el plano), en vez de una mesa con figura geométrica.
function benchPreviewSVG(seats: number, rows = 1): string {
  const n = Math.max(1, Math.min(40, Math.floor(seats || 1)));
  const R = Math.max(1, Math.min(10, Math.floor(rows || 1)));
  const W = 290, H = 230, pad = 20;
  const gap = (W - pad * 2) / n;
  const r = Math.max(4, Math.min(10, gap * 0.34));
  const rowH = Math.min(46, (H - 60) / R);         // separación vertical entre filas
  const top = (H - 30 - (R - 1) * rowH) / 2;
  let body = '';
  for (let row = 0; row < R; row++) {
    const cy = top + row * rowH;
    const barY = cy + r + 6;
    body += `<rect x="${pad}" y="${barY}" width="${W - pad * 2}" height="12" rx="5" fill="#F0F0F2" stroke="#4a4a52" stroke-width="1.1"/>`;
    for (let i = 0; i < n; i++) {
      const cx = pad + gap * (i + 0.5);
      body += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" stroke="#B4B4BC" stroke-width="1.4"/>`;
    }
  }
  const label = `<text x="${W / 2}" y="${H - 8}" font-size="12" fill="#8a8a90" text-anchor="middle" font-family="Poppins, sans-serif">${R > 1 ? R + ' bancos paralelos · ' : 'Banco lineal · '}${n} sillas c/u</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${body}${label}</svg>`;
}

export default function TableConfigurator({ initialConfig, onConfirm, onCancel, nextTableNumber = 1, benchMode = false }: TableConfiguratorProps) {
  const defaultShape = (initialConfig?.shape ?? 'round') as TableShape;
  const [config, setConfig] = useState<TableConfig>(() => {
    // Modo banco (CREAR): fila lineal de sillas sueltas + nº de filas paralelas.
    if (benchMode) {
      return { tableNumber: nextTableNumber, shape: 'rectangular', seats: 12, chairStyle: 'bench',
        tableName: '', isBench: true, rows: 1, tableColor: '#F0F0F2', chairColor: '#ffffff' } as any;
    }
    const base = {
      tableNumber: nextTableNumber,
      ...(TABLE_DEFAULTS[defaultShape] ?? TABLE_DEFAULTS.round),
      // Look del prototipo: mesa y sillas en GRIS (no beige) — sobrescribe los defaults beige.
      tableColor: '#F0F0F2', chairColor: '#ffffff', chairStyle: 'modern',
      ...initialConfig,
    } as TableConfig;
    // Para rectangular/cuadrada el usuario edita el TOTAL; derivamos el reparto por
    // lado del total real (numberChair de la mesa) para que la preview SVG cuadre.
    if (base.shape === 'rectangular' || base.shape === 'square') {
      Object.assign(base, distributeSeatsBySide(base.seats ?? 0, base.shape));
    }
    return base;
  });
  const [previewSVG, setPreviewSVG] = useState('');

  useEffect(() => {
    try { setPreviewSVG(generateTableSVG(config)); } catch { /* ignore */ }
  }, [config]);

  const update = useCallback(<K extends keyof TableConfig>(key: K, value: TableConfig[K]) => {
    setConfig(prev => {
      const next: TableConfig = { ...prev, [key]: value };
      if (key === 'shape') {
        const d = TABLE_DEFAULTS[value as TableShape] ?? TABLE_DEFAULTS.round;
        return { ...d, tableNumber: prev.tableNumber, tableName: prev.tableName };
      }
      if (key === 'realDiameterCm') {
        const maxS = getMaxSeats(next);
        if ((next.seats ?? 0) > maxS) next.seats = maxS;
      }
      // El usuario edita el TOTAL de sillas; para rectangular/cuadrada derivamos el
      // reparto por lado (solo alimenta la preview SVG; el plano reparte el total).
      if (key === 'seats' && (next.shape === 'rectangular' || next.shape === 'square')) {
        Object.assign(next, distributeSeatsBySide(next.seats ?? 0, next.shape));
      }
      if (key === 'realWidthCm' || key === 'realHeightCm') {
        const maxS = getMaxSeats(next);
        if ((next.seats ?? 0) > maxS) {
          next.seats = maxS;
          Object.assign(next, distributeSeatsBySide(maxS, next.shape));
        }
      }
      return next;
    });
  }, []);

  const handleConfirm = () => {
    // config.seats es el TOTAL (fuente de verdad); el reparto por lado ya está
    // derivado en `update` solo para la preview SVG.
    onConfirm({ ...config }, generateTableSVG(config));
  };

  const maxSeats = getMaxSeats(config);
  const isRect = config.shape === 'rectangular' || config.shape === 'square';
  // Banco = fila lineal de sillas sueltas: el modal oculta Forma/Tamaño/Tipo-mesa
  // y muestra solo Nombre + Sillas + Estilo silla, con una preview lineal.
  const isBench = benchMode || !!(config as any).isBench;
  const totalSize = getTableTotalSize(config);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div style={s.overlay}>
      <div style={s.modal}>
        <style>{`.tc-round-check{appearance:none;-webkit-appearance:none;width:17px;height:17px;border:1.6px solid #c4c4cc;border-radius:50%;cursor:pointer;position:relative;flex:none;vertical-align:middle}.tc-round-check:checked{background:#EF5B94;border-color:#EF5B94}.tc-round-check:checked::after{content:'';position:absolute;left:5px;top:2.5px;width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}.tc-slider{-webkit-appearance:none;appearance:none;height:6px;border-radius:6px;background:#E7E7EA;width:100%;outline:none}.tc-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#EF5B94;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.25)}.tc-slider::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:50%;background:#EF5B94;cursor:pointer}.tc-scroll::-webkit-scrollbar{width:0;height:0;display:none}`}</style>
        <div style={s.header}>
          <h2 style={s.title}>{isBench ? (initialConfig ? 'Editar banco' : 'Diseñar banco') : (initialConfig ? 'Editar mesa' : 'Diseñar mesa')}</h2>
          <button style={s.closeBtn} type="button" onClick={onCancel}>✕</button>
        </div>

        <div style={s.body}>
          <div className="tc-scroll" style={s.controls}>
            {/* NOMBRE DE LA MESA */}
            <section style={s.section}>
              <div style={s.sectionTitle}>Nombre de la mesa</div>
              <input type="text" value={config.tableName ?? ''} placeholder="Ej: Mesa 1" onChange={e => update('tableName', e.target.value)} style={{ ...s.textInput, width: '100%', boxSizing: 'border-box' }} />
            </section>

            {/* FORMA — no aplica a un banco (fila lineal) */}
            {!isBench && (
            <section style={s.section}>
              <div style={s.sectionTitle}>Forma</div>
              <div style={s.shapeGrid}>
                {SHAPES.map(sh => (
                  <button key={sh.id} type="button"
                    style={{ ...s.shapeBtn, ...(config.shape === sh.id ? s.shapeBtnActive : {}) }}
                    onClick={() => update('shape', sh.id)}>{sh.label}</button>
                ))}
              </div>
            </section>
            )}

            {/* TAMAÑO — no aplica a un banco (fila lineal) */}
            {!isBench && (
            <section style={s.section}>
              <div style={s.sectionTitle}>Tamaño</div>
              {(config.shape === 'round') && (
                <SliderField label="Diámetro" value={config.realDiameterCm ?? 150} min={80} max={300} step={10} unit=" cm" onChange={v => update('realDiameterCm', v)} />
              )}
              {isRect && (<>
                <SliderField label="Largo" value={config.realWidthCm ?? 240} min={80} max={700} step={10} unit=" cm" onChange={v => update('realWidthCm', v)} />
                <SliderField label="Ancho" value={config.realHeightCm ?? 90} min={60} max={200} step={5} unit=" cm" onChange={v => update('realHeightCm', v)} />
              </>)}
              {config.shape === 'oval' && (<>
                <SliderField label="Largo" value={config.realWidthCm ?? 220} min={120} max={400} step={10} unit=" cm" onChange={v => update('realWidthCm', v)} />
                <SliderField label="Ancho" value={config.realHeightCm ?? 110} min={80} max={200} step={10} unit=" cm" onChange={v => update('realHeightCm', v)} />
              </>)}
              {config.shape === 'semicircle' && (
                <SliderField label="Ancho total" value={config.realWidthCm ?? 400} min={150} max={600} step={10} unit=" cm" onChange={v => update('realWidthCm', v)} />
              )}
              <div style={s.sizeHint}>Espacio total con sillas: <strong>{Math.round(totalSize.widthCm)} × {Math.round(totalSize.heightCm)} cm</strong></div>
            </section>
            )}

            {/* SILLAS */}
            <section style={s.section}>
              <div style={s.sectionTitle}>Sillas</div>
              <NumberStepper label={isBench ? 'Sillas por fila' : 'Número de sillas'} value={config.seats} min={1} max={isBench ? 60 : maxSeats} onChange={v => update('seats', v)} />
              {!isBench && <div style={s.maxHint}>Máximo recomendado: {maxSeats} personas</div>}
              {benchMode && (
                <NumberStepper label="Filas paralelas" value={(config as any).rows ?? 1} min={1} max={10} onChange={v => setConfig(p => ({ ...p, rows: v } as any))} />
              )}
              <div style={s.fieldRow}>
                <label style={s.label}>Estilo silla</label>
                <select style={s.select} value={config.chairStyle ?? 'chiavari'}
                  onChange={e => update('chairStyle', e.target.value as ChairStyle)}>
                  <option value="chiavari">Chiavari / Tiffany</option>
                  <option value="modern">Moderna</option>
                  <option value="ghost">Fantasma</option>
                  <option value="bench">Banco</option>
                  <option value="none">Sin sillas</option>
                </select>
              </div>
            </section>

            {/* TIPO DE MESA — no aplica a un banco (fila lineal) */}
            {!isBench && (
            <section style={s.section}>
              <div style={s.sectionTitle}>Tipo de mesa</div>
              <div style={s.toggleRow}>
                {([['isHeadTable', 'Mesa de novios'], ['isKidsTable', 'Mesa infantil']] as [keyof TableConfig, string][]).map(([key, label]) => (
                  <label key={key} style={s.toggleLabel}>
                    <input type="checkbox" className="tc-round-check" checked={!!config[key]} onChange={e => update(key, e.target.checked as any)} />{' '}{label}
                  </label>
                ))}
              </div>
            </section>
            )}
          </div>

          {/* Preview */}
          <div style={s.preview}>
            <div style={s.previewCanvas}>
              {isBench
                ? <div style={s.previewSVG} dangerouslySetInnerHTML={{ __html: benchPreviewSVG(config.seats, (config as any).rows ?? 1) }} />
                : (previewSVG && <div style={s.previewSVG} dangerouslySetInnerHTML={{ __html: previewSVG }} />)}
            </div>
            <div style={s.previewInfo}>
              <span>🪑 {config.seats} {isBench ? 'sillas' : 'personas'}</span>
              {config.tableName && <span>📋 {config.tableName}</span>}
              {!isBench && config.isHeadTable && <span>💍 Novios</span>}
            </div>
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} type="button" onClick={onCancel}>Cancelar</button>
          <button style={s.confirmBtn} type="button" onClick={handleConfirm}>
            {initialConfig ? 'Actualizar' : 'Añadir al plano'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────

function SliderField({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div style={s.fieldRow}>
      <label style={s.label}>{label}</label>
      <div style={s.sliderWrap}>
        <input type="range" className="tc-slider" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={s.slider} />
        <span style={s.sliderValue}>{value}{unit}</span>
      </div>
    </div>
  );
}

function NumberStepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={s.fieldRow}>
      <label style={s.label}>{label}</label>
      <div style={s.stepper}>
        <button style={s.stepBtn} type="button" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span style={s.stepValue}>{value}</span>
        <button style={s.stepBtn} type="button" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  // Drawer desde la IZQUIERDA (fiel al HTML): full-height, no centrado → no se corta.
  // Card flotante a la izquierda (fiel al HTML): NO full-height, con márgenes + esquinas redondeadas.
  overlay: { position: 'fixed', inset: 0, background: 'rgba(43,43,48,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '20px 20px 20px 24px', zIndex: 99999, backdropFilter: 'blur(3px)' },
  modal: { background: '#fff', borderRadius: 20, width: 'min(700px, 94vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f0f0f2', background: '#fff' },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: '#3A3A42' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a0a0a8', padding: '4px 8px' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  controls: { width: 296, flexShrink: 0, overflowY: 'auto', padding: 20, borderRight: '1px solid #f2f2f4', display: 'flex', flexDirection: 'column', gap: 18, scrollbarWidth: 'none', msOverflowStyle: 'none' } as CSSProperties,
  section: {},
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#b3b3ba', marginBottom: 10 },
  shapeGrid: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  shapeBtn: { padding: '8px 13px', border: '1.5px solid #E7E7EA', borderRadius: 9, background: '#f7f7f9', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6b6b72' },
  shapeBtnActive: { borderColor: '#c4c4cc', background: '#e9e9ee', color: '#3A3A42', fontWeight: 700 },
  fieldRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  label: { fontSize: 13, color: '#6b6b72', minWidth: 100, flexShrink: 0 },
  sliderWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1, accentColor: '#EF5B94' } as CSSProperties,
  sliderValue: { fontSize: 13, fontWeight: 700, color: '#3A3A42', minWidth: 50, textAlign: 'right' },
  stepper: { display: 'flex', alignItems: 'center', gap: 8 },
  stepBtn: { width: 38, height: 38, border: 'none', borderRadius: 10, background: '#f7f7f9', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF5B94', fontWeight: 700 },
  stepValue: { fontSize: 16, fontWeight: 700, color: '#3A3A42', minWidth: 28, textAlign: 'center' },
  maxHint: { fontSize: 11, color: '#b3b3ba', marginTop: 2, marginBottom: 8 },
  sizeHint: { fontSize: 12, color: '#8a8a90', marginTop: 8, background: '#F0F0F2', padding: '8px 12px', borderRadius: 9 },
  seatDistrib: { background: '#faf9fb', borderRadius: 9, padding: 12, marginBottom: 10 },
  distribLabel: { fontSize: 13, color: '#6b6b72', marginBottom: 10 },
  distribGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  distribRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  distribSide: { fontSize: 12, color: '#8a8a90', minWidth: 32 },
  select: { flex: 1, padding: '9px 10px', border: '1px solid #E7E7EA', borderRadius: 10, fontSize: 13, background: '#fff', color: '#3A3A42' },
  colorPicker: { width: 44, height: 32, border: '1px solid #E7E7EA', borderRadius: 8, cursor: 'pointer', padding: 2 },
  numInput: { width: 70, padding: '9px 10px', border: '1px solid #E7E7EA', borderRadius: 10, fontSize: 14, textAlign: 'center', color: '#3A3A42' },
  textInput: { flex: 1, padding: '9px 10px', border: '1px solid #E7E7EA', borderRadius: 10, fontSize: 13, color: '#3A3A42' },
  toggleRow: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  toggleLabel: { fontSize: 13, color: '#6b6b72', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  preview: { flex: 1, padding: 20, background: '#FAFAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 },
  previewTitle: { fontSize: 11, fontWeight: 700, color: '#b3b3ba', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  previewCanvas: { width: 290, height: 230, background: '#fff', borderRadius: 16, border: '1px solid #E7E7EA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12, backgroundImage: 'radial-gradient(#e2e2e6 1px, transparent 1px)', backgroundSize: '15px 15px' },
  previewSVG: { maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewInfo: { marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#6b6b72' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 24px', borderTop: '1px solid #f0f0f2', background: '#fff' },
  cancelBtn: { padding: '11px 22px', border: 'none', borderRadius: 10, background: '#f7f7f9', fontSize: 13, cursor: 'pointer', color: '#6b6b72', fontWeight: 600 },
  confirmBtn: { padding: '11px 26px', border: 'none', borderRadius: 10, background: '#EF5B94', fontSize: 13, cursor: 'pointer', color: '#fff', fontWeight: 600, boxShadow: '0 6px 16px rgba(239,91,148,0.32)' },
};
