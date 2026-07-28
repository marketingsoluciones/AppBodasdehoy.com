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
      const result: any = await fetchApiEventos({
        query: queries.createTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          values: JSON.stringify({
            title,
            numberChair: config.seats,
            position,
            rotation: 0,
            size: { width: 100, height: 80 },
            tipo,
            // Datos del nuevo configurador (el canvas existente los ignora, quedan en DB)
            tableConfig: JSON.stringify(config),
            svgString,
          }),
        },
      });
      if (!result?.success) {
        toast('error', result?.errors?.[0]?.message ?? 'Error al crear la mesa');
        return;
      }
      // Construir la mesa LOCAL con los datos que el front conoce (no usar result crudo,
      // que solo trae { success, errors, evento }). Garantiza que `position` existe y
      // evita crashes en DragableDefault al renderizar la mesa recién creada.
      const newTable: any = {
        _id: result?.table?._id ?? result?.evento?._id ?? `tmp_${Date.now()}`,
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
      };
      const nextPlanSpace = {
        ...planSpaceActive,
        tables: [...(planSpaceActive.tables ?? []), newTable],
      };
      setPlanSpaceActive(nextPlanSpace);

      const nextEvent = {
        ...event,
        planSpace: (event.planSpace ?? []).map((ps: any, idx: number) => {
          if (ps?._id === nextPlanSpace._id) return nextPlanSpace;
          if (ps?._id === planSpaceSelect) return nextPlanSpace;
          return ps;
        }),
      };
      setEvent(nextEvent);
      // Toast con «Deshacer» (MesasUndoToast escucha este evento).
      window.dispatchEvent(new CustomEvent('mesas-toast', { detail: { action: 'create', table: newTable } }));
    } catch {
      toast('error', 'Error al crear la mesa desde el configurador');
    } finally {
      setOpen(false);
    }
  };

  const handleAddBenchRow = async () => {
    try {
      const position = {
        x: 180 + Math.round(Math.random() * 80),
        y: 240 + Math.round(Math.random() * 80),
      };
      const title = `Bancos ceremonia ${((planSpaceActive.tables?.length ?? 0) + 1)}`;
      const result: any = await fetchApiEventos({
        query: queries.createTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          values: JSON.stringify({
            title,
            numberChair: 12,
            position,
            rotation: 0,
            size: { width: 100, height: 40 },
            tipo: 'bancos',
          }),
        },
      });
      if (!result?.success) {
        toast('error', result?.errors?.[0]?.message ?? 'Error al añadir bancos al plano');
        return;
      }
      // Mesa LOCAL (createTable devuelve { success, errors, evento }, no la mesa entera)
      const newTable: any = {
        _id: result?.table?._id ?? result?.evento?._id ?? `tmp_${Date.now()}`,
        title,
        nombre_mesa: title,
        tipo: 'bancos',
        cantidad_sillas: 12,
        numberChair: 12,
        position,
        rotation: 0,
        size: { width: 100, height: 40 },
      };
      const nextPlanSpace = {
        ...planSpaceActive,
        tables: [...(planSpaceActive.tables ?? []), newTable],
      };
      setPlanSpaceActive(nextPlanSpace);
      setEvent({
        ...event,
        planSpace: (event.planSpace ?? []).map((ps: any, idx: number) => {
          if (ps?._id === nextPlanSpace._id) return nextPlanSpace;
          if (ps?._id === planSpaceSelect) return nextPlanSpace;
          return ps;
        }),
      });

      toast('success', `"${title}" añadido al plano`);
    } catch {
      toast('error', 'Error al añadir bancos al plano');
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
        onClick={handleAddBenchRow}
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
  { id: 'round', label: 'Redonda' },
  { id: 'rectangular', label: 'Rectangular' },
  { id: 'oval', label: 'Oval' },
  { id: 'square', label: 'Cuadrada' },
];

export default function TableConfigurator({ initialConfig, onConfirm, onCancel, nextTableNumber = 1 }: TableConfiguratorProps) {
  const defaultShape = (initialConfig?.shape ?? 'round') as TableShape;
  const [config, setConfig] = useState<TableConfig>({
    tableNumber: nextTableNumber,
    ...(TABLE_DEFAULTS[defaultShape] ?? TABLE_DEFAULTS.round),
    // Look del prototipo: mesa y sillas en GRIS (no beige) — sobrescribe los defaults beige.
    tableColor: '#ececef', chairColor: '#ffffff', chairStyle: 'modern',
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
          <h2 style={s.title}>{initialConfig ? 'Editar mesa' : 'Diseñar mesa'}</h2>
          <button style={s.closeBtn} type="button" onClick={onCancel}>✕</button>
        </div>

        <div style={s.body}>
          <div style={s.controls}>
            {/* NOMBRE DE LA MESA */}
            <section style={s.section}>
              <div style={s.sectionTitle}>Nombre de la mesa</div>
              <input type="text" value={config.tableName ?? ''} placeholder="Ej: Mesa 1" onChange={e => update('tableName', e.target.value)} style={{ ...s.textInput, width: '100%', boxSizing: 'border-box' }} />
            </section>

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
            </section>

            {/* TIPO DE MESA — el usuario pidió mantener Novios / Infantil */}
            <section style={s.section}>
              <div style={s.sectionTitle}>Tipo de mesa</div>
              <div style={s.toggleRow}>
                {([['isHeadTable', 'Mesa de novios'], ['isKidsTable', 'Mesa infantil']] as [keyof TableConfig, string][]).map(([key, label]) => (
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
            {initialConfig ? 'Actualizar' : 'Añadir al plano'}
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
  // Drawer desde la IZQUIERDA (fiel al HTML): full-height, no centrado → no se corta.
  overlay: { position: 'fixed', inset: 0, background: 'rgba(43,43,48,0.45)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', zIndex: 99999, backdropFilter: 'blur(3px)' },
  modal: { background: '#fff', borderTopRightRadius: 18, borderBottomRightRadius: 18, width: 'min(600px, 92vw)', height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '24px 0 80px rgba(0,0,0,0.3)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f0f0f2', background: '#fff' },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: '#3A3A42' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a0a0a8', padding: '4px 8px' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  controls: { flex: 1, overflowY: 'auto', padding: '16px 20px', borderRight: '1px solid #f2f2f4' },
  section: { marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f2f2f4' },
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b3b3ba', marginBottom: 12 },
  shapeGrid: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  shapeBtn: { padding: '8px 13px', border: '1.5px solid #E7E7EA', borderRadius: 9, background: '#f7f7f9', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6b6b72' },
  shapeBtnActive: { borderColor: '#c4c4cc', background: '#e9e9ee', color: '#3A3A42', fontWeight: 700 },
  fieldRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  label: { fontSize: 13, color: '#6b6b72', minWidth: 100, flexShrink: 0 },
  sliderWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1, accentColor: '#EF5B94' } as CSSProperties,
  sliderValue: { fontSize: 13, fontWeight: 700, color: '#3A3A42', minWidth: 50, textAlign: 'right' },
  stepper: { display: 'flex', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, border: 'none', borderRadius: 10, background: '#f7f7f9', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF5B94', fontWeight: 700 },
  stepValue: { fontSize: 16, fontWeight: 700, color: '#3A3A42', minWidth: 28, textAlign: 'center' },
  maxHint: { fontSize: 11, color: '#b3b3ba', marginTop: 2, marginBottom: 8 },
  sizeHint: { fontSize: 12, color: '#8a8a90', marginTop: 8, background: '#F0F0F2', padding: '8px 12px', borderRadius: 9 },
  seatDistrib: { background: '#faf9fb', borderRadius: 9, padding: 12, marginBottom: 10 },
  distribLabel: { fontSize: 13, color: '#6b6b72', marginBottom: 10 },
  distribGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  distribRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  distribSide: { fontSize: 12, color: '#8a8a90', minWidth: 32 },
  select: { flex: 1, padding: '9px 10px', border: '1px solid #E7E7EA', borderRadius: 10, fontSize: 13, background: '#fff', color: '#3A3A42' },
  colorPicker: { width: 44, height: 32, border: '1px solid #E7E7EA', borderRadius: 8, cursor: 'pointer', padding: 2 },
  numInput: { width: 70, padding: '9px 10px', border: '1px solid #E7E7EA', borderRadius: 10, fontSize: 14, textAlign: 'center', color: '#3A3A42' },
  textInput: { flex: 1, padding: '9px 10px', border: '1px solid #E7E7EA', borderRadius: 10, fontSize: 13, color: '#3A3A42' },
  toggleRow: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  toggleLabel: { fontSize: 13, color: '#6b6b72', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  preview: { width: 250, flexShrink: 0, padding: 16, background: '#FAFAFB', display: 'flex', flexDirection: 'column' },
  previewTitle: { fontSize: 11, fontWeight: 700, color: '#b3b3ba', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  previewCanvas: { flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #E7E7EA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12, backgroundImage: 'radial-gradient(circle, #e2e2e6 1px, transparent 1px)', backgroundSize: '15px 15px' },
  previewSVG: { maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewInfo: { marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#6b6b72' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 24px', borderTop: '1px solid #f0f0f2', background: '#fff' },
  cancelBtn: { padding: '11px 22px', border: 'none', borderRadius: 10, background: '#f7f7f9', fontSize: 13, cursor: 'pointer', color: '#6b6b72', fontWeight: 600 },
  confirmBtn: { padding: '11px 26px', border: 'none', borderRadius: 10, background: '#EF5B94', fontSize: 13, cursor: 'pointer', color: '#fff', fontWeight: 600, boxShadow: '0 6px 16px rgba(239,91,148,0.32)' },
};
