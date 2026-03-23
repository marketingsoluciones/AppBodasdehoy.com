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
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, planSpaceSelect } = EventContextProvider();
  const toast = useToast();

  if (!event || !planSpaceActive) return null;

  const handleConfirm = async (config: TableConfig, svgString: string) => {
    try {
      const position = {
        x: 200 + Math.round(Math.random() * 100),
        y: 200 + Math.round(Math.random() * 100),
      };
      const result: any = await fetchApiEventos({
        query: queries.createTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          values: JSON.stringify({
            title: config.tableName || `Mesa ${config.tableNumber ?? planSpaceActive.tables.length + 1}`,
            numberChair: config.seats,
            position,
            rotation: 0,
            size: { width: 100, height: 80 },
            tipo: SHAPE_TO_TIPO[config.shape] ?? 'redonda',
            // Datos del nuevo configurador (el canvas existente los ignora, quedan en DB)
            tableConfig: JSON.stringify(config),
            svgString,
          }),
        },
      });
      planSpaceActive.tables.push({ ...result });
      setPlanSpaceActive({ ...planSpaceActive });
      event.planSpace[planSpaceSelect] = planSpaceActive;
      setEvent({ ...event });
      toast('success', `Mesa "${result.title}" creada con el configurador visual`);
    } catch {
      toast('error', 'Error al crear la mesa desde el configurador');
    } finally {
      setOpen(false);
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
          background: '#8B6914',
          color: '#fff',
          border: 'none',
          borderRadius: 40,
          padding: '10px 18px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(139,105,20,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ✦ Diseñar mesa
      </button>

      {/* Modal configurador */}
      {open && (
        <TableConfigurator
          nextTableNumber={(planSpaceActive.tables?.length ?? 0) + 1}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURADOR PURO (sin lógica de negocio — reutilizable)
// ─────────────────────────────────────────────────────────────────────────────

const SHAPES: { id: TableShape; label: string }[] = [
  { id: 'round', label: '⬤ Redonda' },
  { id: 'rectangular', label: '▬ Rectangular' },
  { id: 'oval', label: '⬭ Oval' },
  { id: 'square', label: '■ Cuadrada' },
  { id: 'semicircle', label: '⌓ Novios' },
];

export default function TableConfigurator({ initialConfig, onConfirm, onCancel, nextTableNumber = 1 }: TableConfiguratorProps) {
  const defaultShape = (initialConfig?.shape ?? 'round') as TableShape;
  const [config, setConfig] = useState<TableConfig>({
    tableNumber: nextTableNumber,
    ...(TABLE_DEFAULTS[defaultShape] ?? TABLE_DEFAULTS.round),
    ...initialConfig,
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
      if (key === 'realWidthCm' || key === 'realHeightCm') {
        const maxS = getMaxSeats(next);
        const total = (next.seatsTop ?? 0) + (next.seatsBottom ?? 0) + (next.seatsLeft ?? 0) + (next.seatsRight ?? 0);
        if (total > maxS) {
          next.seatsTop = Math.floor((next.seatsTop ?? 0) * maxS / total);
          next.seatsBottom = Math.floor((next.seatsBottom ?? 0) * maxS / total);
          next.seatsLeft = Math.min(next.seatsLeft ?? 0, 2);
          next.seatsRight = Math.min(next.seatsRight ?? 0, 2);
        }
      }
      return next;
    });
  }, []);

  const handleConfirm = () => {
    const final = { ...config };
    if (final.shape === 'rectangular' || final.shape === 'square') {
      final.seats = (final.seatsTop ?? 0) + (final.seatsBottom ?? 0) + (final.seatsLeft ?? 0) + (final.seatsRight ?? 0);
    }
    onConfirm(final, generateTableSVG(final));
  };

  const maxSeats = getMaxSeats(config);
  const isRect = config.shape === 'rectangular' || config.shape === 'square';
  const maxPerLongSide = isRect ? Math.floor((config.realWidthCm ?? 240) / 45) : 0;
  const totalSize = getTableTotalSize(config);

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>{initialConfig ? '✏️ Editar mesa' : '✦ Nueva mesa'}</h2>
          <button style={s.closeBtn} type="button" onClick={onCancel}>✕</button>
        </div>

        <div style={s.body}>
          <div style={s.controls}>
            {/* FORMA */}
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

            {/* TAMAÑO */}
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

            {/* SILLAS */}
            <section style={s.section}>
              <div style={s.sectionTitle}>Sillas</div>
              {!isRect ? (<>
                <NumberStepper label="Número de sillas" value={config.seats} min={1} max={maxSeats} onChange={v => update('seats', v)} />
                <div style={s.maxHint}>Máximo recomendado: {maxSeats} personas</div>
              </>) : (
                <SeatDistributor seatsTop={config.seatsTop ?? 0} seatsBottom={config.seatsBottom ?? 0}
                  seatsLeft={config.seatsLeft ?? 0} seatsRight={config.seatsRight ?? 0}
                  maxPerSide={maxPerLongSide} onChange={(side, v) => setConfig(p => ({ ...p, [side]: v }))} />
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
              <div style={s.fieldRow}>
                <label style={s.label}>Color sillas</label>
                <input type="color" value={config.chairColor ?? '#E8D5B7'} onChange={e => update('chairColor', e.target.value)} style={s.colorPicker} />
              </div>
            </section>

            {/* ASPECTO */}
            <section style={s.section}>
              <div style={s.sectionTitle}>Aspecto</div>
              <div style={s.fieldRow}>
                <label style={s.label}>Color mesa</label>
                <input type="color" value={config.tableColor ?? '#F5F0E8'} onChange={e => update('tableColor', e.target.value)} style={s.colorPicker} />
              </div>
              <div style={s.fieldRow}>
                <label style={s.label}>Nº de mesa</label>
                <input type="number" value={config.tableNumber ?? 1} min={1} max={999} onChange={e => update('tableNumber', Number(e.target.value))} style={s.numInput} />
              </div>
              <div style={s.fieldRow}>
                <label style={s.label}>Nombre</label>
                <input type="text" value={config.tableName ?? ''} placeholder="Ej: Mesa Familia García" onChange={e => update('tableName', e.target.value)} style={s.textInput} />
              </div>
              <div style={s.toggleRow}>
                {([['showNumber', 'Mostrar número'], ['showName', 'Mostrar nombre'], ['isHeadTable', 'Mesa de novios'], ['isKidsTable', 'Mesa infantil']] as [keyof TableConfig, string][]).map(([key, label]) => (
                  <label key={key} style={s.toggleLabel}>
                    <input type="checkbox" checked={!!config[key]} onChange={e => update(key, e.target.checked as any)} />{' '}{label}
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Preview */}
          <div style={s.preview}>
            <div style={s.previewTitle}>Vista previa</div>
            <div style={s.previewCanvas}>
              {previewSVG && <div style={s.previewSVG} dangerouslySetInnerHTML={{ __html: previewSVG }} />}
            </div>
            <div style={s.previewInfo}>
              <span>🪑 {isRect ? (config.seatsTop ?? 0) + (config.seatsBottom ?? 0) + (config.seatsLeft ?? 0) + (config.seatsRight ?? 0) : config.seats} personas</span>
              {config.tableName && <span>📋 {config.tableName}</span>}
              {config.isHeadTable && <span>💍 Novios</span>}
            </div>
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} type="button" onClick={onCancel}>Cancelar</button>
          <button style={s.confirmBtn} type="button" onClick={handleConfirm}>
            {initialConfig ? '✓ Actualizar' : '✦ Añadir al plano'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────

function SliderField({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div style={s.fieldRow}>
      <label style={s.label}>{label}</label>
      <div style={s.sliderWrap}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={s.slider} />
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

function SeatDistributor({ seatsTop, seatsBottom, seatsLeft, seatsRight, maxPerSide, onChange }: { seatsTop: number; seatsBottom: number; seatsLeft: number; seatsRight: number; maxPerSide: number; onChange: (side: string, v: number) => void }) {
  const total = seatsTop + seatsBottom + seatsLeft + seatsRight;
  return (
    <div style={s.seatDistrib}>
      <div style={s.distribLabel}>Distribución · Total: <strong>{total}</strong></div>
      <div style={s.distribGrid}>
        {[['seatsTop', 'Arriba', seatsTop, maxPerSide], ['seatsBottom', 'Abajo', seatsBottom, maxPerSide], ['seatsLeft', 'Izq.', seatsLeft, 4], ['seatsRight', 'Der.', seatsRight, 4]].map(([key, label, val, max]) => (
          <div key={key as string} style={s.distribRow}>
            <span style={s.distribSide}>{label}</span>
            <div style={s.stepper}>
              <button style={s.stepBtn} type="button" onClick={() => onChange(key as string, Math.max(0, (val as number) - 1))}>−</button>
              <span style={s.stepValue}>{val}</span>
              <button style={s.stepBtn} type="button" onClick={() => onChange(key as string, Math.min(max as number, (val as number) + 1))}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' },
  modal: { background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #eee', background: '#FAFAF8' },
  title: { margin: 0, fontSize: 18, fontWeight: 600, color: '#2C2C2C' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: '4px 8px' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  controls: { flex: 1, overflowY: 'auto', padding: '16px 20px', borderRight: '1px solid #eee' },
  section: { marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F0F0F0' },
  sectionTitle: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: 12 },
  shapeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  shapeBtn: { padding: '10px 8px', border: '2px solid #E0E0E0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#444' },
  shapeBtnActive: { borderColor: '#8B6914', background: '#FDF5EC', color: '#8B6914', fontWeight: 600 },
  fieldRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  label: { fontSize: 13, color: '#555', minWidth: 100, flexShrink: 0 },
  sliderWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1 } as CSSProperties,
  sliderValue: { fontSize: 13, fontWeight: 600, color: '#2C2C2C', minWidth: 50, textAlign: 'right' },
  stepper: { display: 'flex', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, border: '1px solid #ddd', borderRadius: 6, background: '#F5F5F5', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontWeight: 700 },
  stepValue: { fontSize: 16, fontWeight: 600, color: '#2C2C2C', minWidth: 28, textAlign: 'center' },
  maxHint: { fontSize: 11, color: '#AAA', marginTop: 2, marginBottom: 8 },
  sizeHint: { fontSize: 12, color: '#888', marginTop: 8, background: '#F8F8F8', padding: '6px 10px', borderRadius: 6 },
  seatDistrib: { background: '#F8F8F8', borderRadius: 8, padding: 12, marginBottom: 10 },
  distribLabel: { fontSize: 13, color: '#555', marginBottom: 10 },
  distribGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  distribRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  distribSide: { fontSize: 12, color: '#777', minWidth: 32 },
  select: { flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, background: '#fff' },
  colorPicker: { width: 44, height: 32, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', padding: 2 },
  numInput: { width: 70, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, textAlign: 'center' },
  textInput: { flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 },
  toggleRow: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  toggleLabel: { fontSize: 13, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  preview: { width: 320, padding: 20, background: '#F8F7F4', display: 'flex', flexDirection: 'column' },
  previewTitle: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  previewCanvas: { flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12, backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)', backgroundSize: '20px 20px' },
  previewSVG: { maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewInfo: { marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#666' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 24px', borderTop: '1px solid #eee', background: '#FAFAF8' },
  cancelBtn: { padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', color: '#555' },
  confirmBtn: { padding: '10px 24px', border: 'none', borderRadius: 8, background: '#8B6914', fontSize: 14, cursor: 'pointer', color: '#fff', fontWeight: 600 },
};
