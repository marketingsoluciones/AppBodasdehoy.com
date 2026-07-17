import { useEffect, useRef, useState } from 'react';
import { EventContextProvider } from '../../context';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';

// Rediseño Fase C (fiel a MESAS.dc.html): toast con «Deshacer» tras crear/borrar una mesa.
// Centralizado aquí (tiene acceso al contexto). Los sitios de crear/borrar solo disparan
// el evento global `mesas-toast` con { action, table }. Las mutaciones de undo son las
// MISMAS que usan los flujos existentes (createTable / deleteTable) — no se inventa nada.
interface ToastState {
  action: 'create' | 'delete'
  table: any
}

export const MesasUndoToast = () => {
  const { t } = useTranslation();
  const { event, setEvent, planSpaceActive, setPlanSpaceActive } = EventContextProvider();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const onToast = (e: any) => {
      if (!e?.detail?.table) return;
      setToast({ action: e.detail.action, table: e.detail.table });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setToast(null), 6000);
    };
    window.addEventListener('mesas-toast', onToast);
    return () => { window.removeEventListener('mesas-toast', onToast); clearTimeout(timerRef.current); };
  }, []);

  if (!toast) return null;

  const applyTables = (tables: any[]) => {
    const nextPS = { ...planSpaceActive, tables };
    setPlanSpaceActive(nextPS);
    setEvent((prev: any) => ({
      ...prev,
      planSpace: (prev?.planSpace ?? []).map((ps: any) => ps?._id === nextPS._id ? nextPS : ps),
    }));
  };

  const handleUndo = async () => {
    const { action, table } = toast;
    setToast(null);
    clearTimeout(timerRef.current);
    try {
      if (action === 'create') {
        // Deshacer creación: quitar la mesa (estado + backend).
        applyTables((planSpaceActive?.tables ?? []).filter((tb: any) => tb._id !== table._id));
        await fetchApiEventos({
          query: queries.deleteTable,
          variables: { eventID: event._id, planSpaceID: planSpaceActive._id, tableID: table._id },
        });
      } else {
        // Deshacer borrado: recrear la mesa con sus propiedades (misma mutación que el alta).
        applyTables([...(planSpaceActive?.tables ?? []), table]);
        await fetchApiEventos({
          query: queries.createTable,
          variables: {
            eventID: event._id,
            planSpaceID: planSpaceActive._id,
            values: JSON.stringify({
              title: table.title || table.nombre_mesa,
              numberChair: table.numberChair ?? table.cantidad_sillas,
              position: table.position,
              rotation: table.rotation ?? 0,
              size: table.size ?? { width: 100, height: 80 },
              tipo: table.tipo,
            }),
          },
        });
      }
    } catch { /* noop — el estado local ya refleja el undo */ }
  };

  const name = toast.table?.title || toast.table?.nombre_mesa || t('table');
  const message = toast.action === 'create'
    ? `${t('tablecreated')}: ${name}`
    : `${t('tabledeleted')}: ${name}`;

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 300,
      display: 'flex', alignItems: 'center', gap: 14, background: '#3A3A42', color: '#fff',
      borderRadius: 12, padding: '11px 16px', boxShadow: '0 10px 28px rgba(0,0,0,.28)',
    }}>
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{message}</span>
      <button type="button" onClick={handleUndo} style={{ fontSize: 12.5, fontWeight: 700, color: '#FF9EC4', background: 'none', border: 'none', cursor: 'pointer' }}>
        {t('undo')}
      </button>
      <button type="button" onClick={() => { setToast(null); clearTimeout(timerRef.current); }} style={{ color: '#9a9aa2', fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
        ✕
      </button>
    </div>
  );
};

export default MesasUndoToast;
