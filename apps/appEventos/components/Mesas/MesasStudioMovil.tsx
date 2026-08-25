import { FC, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import FormInvitadoStudio from "../Forms/FormInvitadoStudio";
import ModalCompartirEventoStudio from "../Utils/ModalCompartirEventoStudio";
import { FURNITURE } from "./furnitureIcons";

/**
 * MesasStudioMovil — vista MÓVIL de Mesas fiel al HTML studio.
 * FASE 1: ver planos (chips) + lienzo con mesas y asientos reales + zoom +
 *   tocar para sentar/quitar invitados + tabs (Mesas/Resumen) + lista de invitados.
 * FASE 2: crear/editar/borrar mesa (sheet "Diseñar mesa"), crear plano (modal),
 *   mobiliario (paleta de elementos). MISMO backend que escritorio: el front es dueño
 *   de planSpace[].tables/elements y persiste vía updateEvento({planSpace}) — igual que
 *   TableConfigurator / EditDefault / BlockPlanos (createTable/editTable escriben en el
 *   legacy mesas_array, desconectado de esta UI). Sentar = editTable(guests)+editGuests.
 */

const CHAIR_TIPOS = ["redonda", "cuadrada", "imperial", "militar", "podio", "bancos"];

// Formas del sheet "Diseñar mesa" (fiel al HTML) → tipo del sistema de mesas.
const SHAPE_LABELS = ["Redonda", "Cuadrada", "Rectangular", "Ovalada"] as const;
type ShapeLabel = typeof SHAPE_LABELS[number];
const shapeToTipo = (s: string): string => (s === "Cuadrada" ? "cuadrada" : s === "Rectangular" ? "imperial" : "redonda");
const tipoToShape = (t: string): ShapeLabel => (t === "cuadrada" ? "Cuadrada" : (t === "imperial" || t === "militar") ? "Rectangular" : "Redonda");

// _id estilo ObjectId (24 hex) — el front genera el id de la mesa/elemento nuevo
// (igual que TableConfigurator.genTableId / mesas.tsx genId).
const genId = (): string => {
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  let rest = ""; for (let i = 0; i < 16; i++) rest += Math.floor(Math.random() * 16).toString(16);
  return ts + rest;
};

// Paleta de mobiliario en móvil (fiel al HTML: Árbol · Planta · Cabina DJ · Arco).
const MOBILIARIO = FURNITURE.filter((f) => ["arbol", "planta", "dj", "arco"].includes(f.model));

type Geom = { w: number; h: number; round: boolean };
const tableGeom = (t: any): Geom => {
  const n = t?.numberChair || 8;
  if ((t?.tipo || "redonda") === "redonda") { const d = Math.max(46, Math.min(74, 34 + n * 4)); return { w: d, h: d, round: true }; }
  const perSide = Math.ceil(n / 2);
  return { w: Math.max(52, perSide * 17), h: 40, round: false };
};
const seatSlots = (t: any, g: Geom) => {
  const n = t?.numberChair || 0;
  const slots: { x: number; y: number; chair: number }[] = [];
  if (g.round) {
    const R = g.w / 2 + 10, cx = g.w / 2, cy = g.h / 2;
    for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI - Math.PI / 2; slots.push({ x: cx + R * Math.cos(a) - 7, y: cy + R * Math.sin(a) - 7, chair: i }); }
  } else {
    const perSide = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const top = i < perSide;
      const idx = top ? i : i - perSide;
      const cnt = top ? perSide : n - perSide;
      slots.push({ x: (g.w / (cnt + 1)) * (idx + 1) - 7, y: top ? -18 : g.h + 4, chair: i });
    }
  }
  return slots;
};

const MesasStudioMovil: FC = () => {
  const { event, setEvent } = EventContextProvider() as any;
  const { user } = AuthContextProvider() as any;
  const toast = useToast();

  const spaces: any[] = useMemo(() => (event?.planSpace || []).filter(Boolean), [event]);
  const [planoId, setPlanoId] = useState<string | null>(spaces[0]?._id ?? null);
  const space = useMemo(() => spaces.find((s) => s._id === planoId) || spaces[0], [spaces, planoId]);
  const tables: any[] = useMemo(() => (space?.tables || []).filter((t: any) => CHAIR_TIPOS.includes(t?.tipo)), [space]);
  const elements: any[] = useMemo(() => (space?.elements || []).filter(Boolean), [space]);

  const [zoom, setZoom] = useState(100);
  const [picked, setPicked] = useState<any>(null);   // invitado elegido para sentar
  const [selected, setSelected] = useState<{ id: string; type: "table" | "element" } | null>(null); // selección en lienzo
  const [tab, setTab] = useState<"mesas" | "mobiliario" | "resumen">("mesas");
  const [guestsOpen, setGuestsOpen] = useState(true);
  const [gFilter, setGFilter] = useState<"todos" | "porsentar" | "sentados">("todos");
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Sheet "Diseñar mesa" (crear/editar)
  const [designOpen, setDesignOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [dName, setDName] = useState("");
  const [dShape, setDShape] = useState<ShapeLabel>("Redonda");
  const [dSillas, setDSillas] = useState(8);
  // Modal "Crear plano nuevo"
  const [newPlanoOpen, setNewPlanoOpen] = useState(false);
  const [newPlanoName, setNewPlanoName] = useState("");
  const [busy, setBusy] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const invitados: any[] = event?.invitados_array || [];
  const isOwner = event?.usuario_id === user?.uid;

  // Sentados en el plano activo (a partir de tables[].guests)
  const seatedInSpace = useMemo(() => {
    const map = new Map<string, { table: any; chair: number }>();
    (space?.tables || []).forEach((t: any) => (t?.guests || []).forEach((g: any) => map.set(g._id, { table: t, chair: g.chair })));
    return map;
  }, [space]);
  const seatedGuests = invitados.filter((i) => seatedInSpace.has(i._id));
  const pendingGuests = invitados.filter((i) => !seatedInSpace.has(i._id));

  const totalSillas = tables.reduce((s, t) => s + (Number(t?.numberChair) || 0), 0);
  const resumenPct = invitados.length ? Math.min(100, Math.round((seatedInSpace.size / invitados.length) * 100)) : 0;

  // ── Persistencia común: reemplaza el plano activo y guarda vía updateEvento(planSpace) ──
  const commitSpace = async (nextSpace: any, errMsg: string): Promise<boolean> => {
    const nextPlanSpaces = (event.planSpace || []).map((ps: any) => (ps._id === nextSpace._id ? nextSpace : ps));
    const res: any = await fetchApiEventos({ query: queries.eventUpdate, variables: { idEvento: event._id, input: { planSpace: nextPlanSpaces } } });
    if (res && res.success === false) { toast("error", res?.errors?.[0]?.message ?? errMsg); return false; }
    setEvent((prev: any) => ({ ...prev, planSpace: (prev.planSpace || []).map((ps: any) => (ps._id === nextSpace._id ? nextSpace : ps)) }));
    return true;
  };

  const patchTableGuests = (tableId: string, newGuests: any[]) => {
    setEvent((prev: any) => ({
      ...prev,
      planSpace: (prev.planSpace || []).map((ps: any) => ps._id !== space._id ? ps : { ...ps, tables: (ps.tables || []).map((tb: any) => tb._id !== tableId ? tb : { ...tb, guests: newGuests }) }),
    }));
    fetchApiEventos({ query: queries.editTable, variables: { eventID: event._id, planSpaceID: space._id, tableID: tableId, variable: "guests", valor: JSON.stringify(newGuests) } });
  };

  const seatGuest = (table: any) => {
    if (!picked) return;
    if (seatedInSpace.has(picked._id)) { toast("warning", "Ya está sentado en este plano"); setPicked(null); return; }
    const taken = new Set((table.guests || []).map((g: any) => g.chair));
    let chair = 0; while (taken.has(chair) && chair < (table.numberChair || 0)) chair++;
    if (chair >= (table.numberChair || 0)) { toast("error", `«${table.title}» está llena`); return; }
    const newGuests = [...(table.guests || []), { _id: picked._id, chair, order: new Date() }];
    patchTableGuests(table._id, newGuests);
    fetchApiBodas({ query: queries.editGuests, variables: { eventID: event._id, guestID: picked._id, datos: { nombre_mesa: table.title || table._id } } });
    fetchApiBodas({ query: queries.editGuests, variables: { eventID: event._id, guestID: picked._id, datos: { puesto: String(chair) } } });
    toast("success", `${picked.nombre} sentado en «${table.title}»`);
    setPicked(null);
  };

  const unseatGuest = (guest: any) => {
    const info = seatedInSpace.get(guest._id);
    if (!info) return;
    const newGuests = (info.table.guests || []).filter((g: any) => g._id !== guest._id);
    patchTableGuests(info.table._id, newGuests);
    fetchApiBodas({ query: queries.editGuests, variables: { eventID: event._id, guestID: guest._id, datos: { nombre_mesa: null } } });
    fetchApiBodas({ query: queries.editGuests, variables: { eventID: event._id, guestID: guest._id, datos: { puesto: null } } });
    toast("success", `${guest.nombre} levantado de la mesa`);
  };

  // Limpia el espejo de sitio (nombre_mesa/puesto) de un invitado en el backend.
  const clearSeatMirror = (guestId: string) => {
    fetchApiBodas({ query: queries.editGuests, variables: { eventID: event._id, guestID: guestId, datos: { nombre_mesa: null } } });
    fetchApiBodas({ query: queries.editGuests, variables: { eventID: event._id, guestID: guestId, datos: { puesto: null } } });
  };

  // ── Sheet Diseñar mesa ──
  const openCreateTable = () => { setEditId(null); setDName(""); setDShape("Redonda"); setDSillas(8); setSelected(null); setPicked(null); setDesignOpen(true); };
  const openEditTable = (t: any) => { setEditId(t._id); setDName(t.title || ""); setDShape(tipoToShape(t.tipo)); setDSillas(Number(t.numberChair) || 8); setSelected(null); setPicked(null); setDesignOpen(true); };

  const confirmDesign = async () => {
    if (busy) return;
    const tipo = shapeToTipo(dShape);
    const name = dName.trim();
    setBusy(true);
    try {
      if (editId) {
        const tbl = (space.tables || []).find((t: any) => t._id === editId);
        const kept = (tbl?.guests || []).filter((g: any) => g.chair < dSillas);
        const dropped = (tbl?.guests || []).filter((g: any) => g.chair >= dSillas);
        const title = name || tbl?.title || "Mesa";
        const nextSpace = { ...space, tables: (space.tables || []).map((t: any) => t._id !== editId ? t : { ...t, title, nombre_mesa: title, tipo, numberChair: dSillas, cantidad_sillas: dSillas, guests: kept }) };
        const ok = await commitSpace(nextSpace, "No se pudo guardar la mesa");
        if (!ok) return;
        dropped.forEach((g: any) => clearSeatMirror(g._id));
        toast("success", "Mesa actualizada");
      } else {
        const nums = tables.map((t: any) => parseInt(t.title, 10) || 0);
        const label = String((nums.length ? Math.max(...nums) : 0) + 1);
        const title = name || `Mesa ${label}`;
        const newTable: any = {
          _id: genId(), title, nombre_mesa: title, tipo,
          cantidad_sillas: dSillas, numberChair: dSillas,
          position: { x: 120 + Math.round(Math.random() * 120), y: 90 + Math.round(Math.random() * 110) },
          rotation: 0, size: { width: 100, height: 80 }, guests: [],
        };
        const nextSpace = { ...space, tables: [...(space.tables || []), newTable] };
        const ok = await commitSpace(nextSpace, "No se pudo crear la mesa");
        if (!ok) return;
        toast("success", `Mesa «${title}» creada`);
      }
      setDesignOpen(false); setEditId(null);
    } catch { toast("error", "Ocurrió un error con la mesa"); }
    finally { setBusy(false); }
  };

  const deleteTable = async (table: any) => {
    if (typeof window !== "undefined" && !window.confirm(`¿Eliminar la mesa «${table.title}»? Los invitados sentados volverán a la lista.`)) return;
    const nextSpace = { ...space, tables: (space.tables || []).filter((t: any) => t._id !== table._id) };
    const ok = await commitSpace(nextSpace, "No se pudo eliminar la mesa");
    if (!ok) return;
    (table.guests || []).forEach((g: any) => clearSeatMirror(g._id));
    setSelected(null);
    toast("success", "Mesa eliminada — invitados devueltos a la lista");
  };

  // ── Mobiliario ──
  const addFurniture = async (f: any) => {
    if (busy) return;
    setBusy(true);
    try {
      const newElement: any = {
        _id: genId(), title: f.model, tipo: f.model,
        position: { x: 60 + Math.round(Math.random() * 170), y: 50 + Math.round(Math.random() * 150) },
        rotation: 0, size: f.size,
      };
      const nextSpace = { ...space, elements: [...(space.elements || []), newElement] };
      const ok = await commitSpace(nextSpace, "No se pudo añadir el objeto");
      if (!ok) return;
      setTab("mesas");
      toast("success", `«${f.label}» añadido al plano`);
    } finally { setBusy(false); }
  };

  const deleteElement = async (el: any) => {
    const nextSpace = { ...space, elements: (space.elements || []).filter((e: any) => e._id !== el._id) };
    const ok = await commitSpace(nextSpace, "No se pudo eliminar el objeto");
    if (!ok) return;
    setSelected(null);
  };

  // ── Crear plano (mirror BlockPlanos: createPlanSpace + updateEvento(planSpace)) ──
  const createPlano = async () => {
    const nm = newPlanoName.trim();
    if (!nm || busy) return;
    setBusy(true);
    try {
      const nuevo: any = await fetchApiEventos({ query: queries.createPlanSpace, variables: { evento_id: event._id, title: nm } });
      if (!nuevo?._id) { toast("error", "No se pudo crear el plano"); return; }
      const nuevoConLienzo = { ...nuevo, size: nuevo.size ?? { width: 1500, height: 800 }, tables: nuevo.tables ?? [], elements: nuevo.elements ?? [] };
      const planSpaceNuevo = [...(event.planSpace ?? []), nuevoConLienzo];
      await fetchApiEventos({ query: queries.eventUpdate, variables: { idEvento: event._id, input: { planSpace: planSpaceNuevo } } });
      setEvent((prev: any) => ({ ...prev, planSpace: planSpaceNuevo }));
      setPlanoId(nuevo._id);
      setNewPlanoOpen(false); setNewPlanoName("");
      toast("success", `Plano «${nm}» creado`);
    } catch { toast("error", "No se pudo crear el plano"); }
    finally { setBusy(false); }
  };

  const onTableTap = (t: any) => {
    if (picked) { seatGuest(t); return; }
    setSelected((sel) => (sel?.id === t._id && sel.type === "table" ? null : { id: t._id, type: "table" }));
  };
  const onElementTap = (el: any) => {
    if (picked) return;
    setSelected((sel) => (sel?.id === el._id && sel.type === "element" ? null : { id: el._id, type: "element" }));
  };

  const furnIcon = (model: string, size = 26) => {
    const def = FURNITURE.find((f) => f.model === model);
    if (!def) return <span style={{ font: "700 14px Poppins", color: "#6b6b72" }}>{model === "text" ? "T" : "•"}</span>;
    const Icon = def.Icon;
    return <Icon width={size} height={size} />;
  };

  const zoomScale = zoom / 100;
  const listForFilter = gFilter === "porsentar" ? pendingGuests : gFilter === "sentados" ? seatedGuests : invitados;

  // Preview del sheet Diseñar mesa (misma geometría que el lienzo, escalada a 180×130).
  const preview = useMemo(() => {
    const pt = { tipo: shapeToTipo(dShape), numberChair: dSillas };
    const g = tableGeom(pt);
    const slots = seatSlots(pt, g);
    const xs = slots.map((s) => s.x); const ys = slots.map((s) => s.y);
    const minX = Math.min(0, ...xs); const maxX = Math.max(g.w, ...xs.map((x) => x + 15));
    const minY = Math.min(0, ...ys); const maxY = Math.max(g.h, ...ys.map((y) => y + 15));
    const bw = Math.max(1, maxX - minX); const bh = Math.max(1, maxY - minY);
    const scale = Math.min(1, 150 / bw, 108 / bh);
    return { g, slots, minX, minY, bw, bh, scale };
  }, [dShape, dSillas]);

  const canvasEmpty = tables.length === 0 && elements.length === 0;

  return (
    <div className="md:hidden flex flex-col" style={{ background: "#fff", minHeight: "100%", position: "relative", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes msm-fade{from{opacity:0}to{opacity:1}}@keyframes msm-up{from{transform:translate(-50%,100%)}to{transform:translate(-50%,0)}}.msm-hs{scrollbar-width:none;}.msm-hs::-webkit-scrollbar{display:none;}" }} />
      {isOwner && shareOpen && <ModalCompartirEventoStudio event={event} onClose={() => setShareOpen(false)} />}
      {addOpen && <FormInvitadoStudio onClose={() => setAddOpen(false)} />}

      {/* HEADER MÓDULO (title bar) */}
      <div style={{ background: "#fff", padding: "12px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f2f2f4" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: "700 19px Poppins", color: "#3A3A42", whiteSpace: "nowrap" }}>Mesas y asientos</div>
          <div style={{ font: "700 10px Poppins", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ color: "#EF5B94" }}>{(event?.tipo || "EVENTO").toUpperCase()}</span><span style={{ color: "#9aa2ab", fontWeight: 600 }}> · {event?.nombre}</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
          <div onClick={() => toast("warning", "Exportar plano — próximamente")} style={{ width: 34, height: 34, borderRadius: "50%", background: "#f4f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#3A3A42", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg></div>
          <div onClick={() => isOwner && setShareOpen(true)} style={{ width: 34, height: 34, borderRadius: "50%", background: "#f4f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", cursor: isOwner ? "pointer" : "default" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg></div>
        </div>
      </div>

      {/* Fondo gris del contenido */}
      <div style={{ background: "#f1f1f4", flex: 1, paddingBottom: 28 }}>
        {/* PLANO CHIPS */}
        <div className="msm-hs" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 16px 12px" }}>
          {spaces.map((p) => {
            const on = p._id === space?._id;
            const mesas = (p.tables || []).filter((t: any) => CHAIR_TIPOS.includes(t?.tipo)).length;
            return (
              <div key={p._id} onClick={() => { setPlanoId(p._id); setPicked(null); setSelected(null); }} style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, cursor: "pointer", background: on ? "#EF5B94" : "#fff", border: `1.5px solid ${on ? "#EF5B94" : "#f0f0f2"}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={on ? "#fff" : "#EF5B94"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 13h5M12 13h9M15 3v4M15 11v10" /></svg>
                <span style={{ font: "600 12px Poppins", color: on ? "#fff" : "#EF5B94", whiteSpace: "nowrap" }}>{p.title}</span>
                <span style={{ font: "600 10px Poppins", color: on ? "rgba(255,255,255,.85)" : "#a0a0a8", whiteSpace: "nowrap" }}>{mesas} mesas</span>
              </div>
            );
          })}
          {/* ＋ Plano — chip punteado (fiel al HTML) */}
          <div onClick={() => { setNewPlanoName(""); setNewPlanoOpen(true); }} style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, cursor: "pointer", background: "#fff", border: "1.5px dashed #f0aecb", color: "#EF5B94", font: "600 12px Poppins", whiteSpace: "nowrap" }}>＋ Plano</div>
        </div>

        {/* Banner "sentar a X" */}
        {picked && (
          <div style={{ position: "sticky", top: 8, zIndex: 25, margin: "0 12px 10px", display: "flex", alignItems: "center", gap: 8, background: "#EF5B94", borderRadius: 999, padding: "10px 16px", boxShadow: "0 6px 16px rgba(239,91,148,.4)", animation: "msm-fade .2s ease" }}>
            <div style={{ flex: 1, font: "600 11.5px Poppins", color: "#fff" }}>Toca una mesa para sentar a <b>{picked.nombre}</b></div>
            <div onClick={() => setPicked(null)} style={{ font: "600 10.5px Poppins", color: "#fff", opacity: .85, cursor: "pointer" }}>Cancelar</div>
          </div>
        )}

        {/* CANVAS */}
        <div style={{ margin: "0 12px", position: "relative" }}>
          <div onClick={() => setSelected(null)} style={{ position: "relative", height: 330, borderRadius: 18, background: "#F3F1EC", overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,.07)" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#E4E1D8 1px,transparent 1px),linear-gradient(90deg,#E4E1D8 1px,transparent 1px)", backgroundSize: "36px 36px", opacity: .6 }} />
            {/* zoom + nombre plano */}
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 8, zIndex: 3 }}>
              <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 10, boxShadow: "0 3px 10px rgba(0,0,0,.08)", overflow: "hidden" }}>
                <button onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(50, z - 10)); }} style={{ width: 32, height: 32, color: "#EF5B94", fontSize: 16, border: "none", background: "none", cursor: "pointer" }}>−</button>
                <div style={{ font: "700 11px Poppins", color: "#3A3A42", padding: "0 4px", minWidth: 40, textAlign: "center" }}>{zoom}%</div>
                <button onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(150, z + 10)); }} style={{ width: 32, height: 32, color: "#EF5B94", fontSize: 16, border: "none", background: "none", cursor: "pointer" }}>＋</button>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 3px 10px rgba(0,0,0,.08)", padding: "8px 12px", font: "600 11px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>{space?.title}</div>
            </div>

            <div style={{ position: "absolute", inset: 0, transform: `scale(${zoomScale})`, transformOrigin: "center center" }}>
              {/* Elementos de mobiliario */}
              {elements.map((el, i) => {
                const on = selected?.id === el._id && selected.type === "element";
                const w = Math.min(el?.size?.width ?? 60, 90); const h = Math.min(el?.size?.height ?? 60, 90);
                const px = el?.position?.x ?? (30 + (i % 3) * 90); const py = el?.position?.y ?? (30 + Math.floor(i / 3) * 90);
                return (
                  <div key={el._id} onClick={(e) => { e.stopPropagation(); onElementTap(el); }} style={{ position: "absolute", left: px, top: py, zIndex: on ? 4 : 1, cursor: "pointer" }}>
                    {on && (
                      <div onClick={(e) => { e.stopPropagation(); deleteElement(el); }} style={{ position: "absolute", top: -13, left: -13, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "1px solid #f2c9d9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,.18)", zIndex: 6 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></div>
                    )}
                    <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6b72", border: on ? "2px dashed #EF5B94" : "none", borderRadius: 10 }}>{furnIcon(el.tipo || el.title, Math.min(w, h))}</div>
                  </div>
                );
              })}
              {/* Mesas */}
              {tables.map((t, i) => {
                const g = tableGeom(t);
                const slots = seatSlots(t, g);
                const occ = new Map((t.guests || []).map((x: any) => [x.chair, x]));
                const seatedCount = (t.guests || []).length;
                const on = selected?.id === t._id && selected.type === "table";
                const px = t?.position?.x ?? (24 + (i % 3) * 120);
                const py = t?.position?.y ?? (24 + Math.floor(i / 3) * 120);
                return (
                  <div key={t._id} onClick={(e) => { e.stopPropagation(); onTableTap(t); }} style={{ position: "absolute", left: px, top: py, zIndex: on ? 5 : 2, cursor: "pointer" }}>
                    {slots.map((s) => {
                      const seatOn = occ.has(s.chair);
                      return <div key={s.chair} style={{ position: "absolute", left: s.x, top: s.y, width: 15, height: 15, borderRadius: "50%", background: seatOn ? "#EF5B94" : "#fff", border: `1.5px solid ${seatOn ? "#EF5B94" : "#cfcfd6"}`, zIndex: 1, boxShadow: seatOn ? "0 0 0 2px rgba(239,91,148,.18)" : "none" }} />;
                    })}
                    {/* Acciones al seleccionar (borrar / editar) */}
                    {on && !picked && (
                      <>
                        <div onClick={(e) => { e.stopPropagation(); deleteTable(t); }} style={{ position: "absolute", top: -13, left: -13, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "1px solid #f2c9d9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,.18)", zIndex: 6 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></div>
                        <div onClick={(e) => { e.stopPropagation(); openEditTable(t); }} style={{ position: "absolute", top: -13, right: -13, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "1px solid #e7e7ea", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,.18)", zIndex: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></div>
                      </>
                    )}
                    <div style={{ position: "relative", width: g.w, height: g.h, borderRadius: g.round ? "50%" : 12, background: "#F0F0F2", border: `2.5px solid ${on ? "#EF5B94" : picked ? "#EF5B94" : "#d8d8de"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,.1)" }}>
                      <span style={{ font: "700 13px Poppins", color: "#6b6b72" }}>{t.title}</span>
                      {seatedCount > 0 && <div style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "700 9px Poppins", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", boxShadow: "0 2px 5px rgba(0,0,0,.2)" }}>{seatedCount}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state con CTA crear mesa */}
            {canvasEmpty && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, zIndex: 2, padding: 20, textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "2px dashed #f0aecb", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", boxShadow: "0 6px 18px rgba(0,0,0,.06)" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><ellipse cx="12" cy="9" rx="8" ry="3" /><path d="M6 10v8M18 10v8" /></svg></div>
                <div><div style={{ font: "700 14px Poppins", color: "#3A3A42" }}>Aún no hay mesas en «{space?.title}»</div><div style={{ font: "500 11px Poppins", color: "#8a8a90", marginTop: 2 }}>Empieza creando tu primera mesa.</div></div>
                <button onClick={(e) => { e.stopPropagation(); openCreateTable(); }} style={{ padding: "11px 18px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 12px Poppins", border: "none", boxShadow: "0 8px 20px rgba(239,91,148,.35)", cursor: "pointer" }}>＋ Crea tu primera mesa</button>
              </div>
            )}

            {/* FAB "Añadir mesa" cuando hay contenido */}
            {!canvasEmpty && (
              <button onClick={(e) => { e.stopPropagation(); openCreateTable(); }} style={{ position: "absolute", right: 12, bottom: 12, zIndex: 3, padding: "12px 17px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(239,91,148,.4)", cursor: "pointer" }}>＋ Añadir mesa</button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", background: "#fff", borderRadius: 14, margin: "14px 12px 0", padding: 5, gap: 3, boxShadow: "0 3px 12px rgba(0,0,0,.05)" }}>
          {([["mesas", "Mesas"], ["mobiliario", "Mobiliario"], ["resumen", "Resumen"]] as const).map(([k, label]) => {
            const on = tab === k;
            return <div key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: "center", padding: "9px 2px", borderRadius: 10, font: "600 11.5px Poppins", cursor: "pointer", background: on ? "#EF5B94" : "transparent", color: on ? "#fff" : "#8a8a90" }}>{label}</div>;
          })}
        </div>

        <div style={{ padding: "13px 12px 0" }}>
          {/* TAB MESAS */}
          {tab === "mesas" && (
            <div style={{ animation: "msm-fade .2s ease", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ font: "700 10.5px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", margin: "0 4px" }}>Mesas en «{space?.title}» · <span style={{ color: "#EF5B94" }}>{tables.length}</span></div>
              {tables.length === 0 && <div style={{ padding: "10px 4px", font: "500 12px Poppins", color: "#a0a0a8" }}>Sin mesas en este plano.</div>}
              {/* Si hay más de 5 mesas, la lista se limita a ~5 y el resto se ve con scroll (invisible). */}
              <div className="msm-hs" style={{ display: "flex", flexDirection: "column", gap: 8, ...(tables.length > 5 ? { maxHeight: 300, overflowY: "auto" } : {}) }}>
              {tables.map((m, i) => (
                <div key={m._id} onClick={() => openEditTable(m)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12, background: "#fff", border: "1.5px solid #f0f0f2", cursor: "pointer" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, flex: "none", background: "#F0F0F2", border: "1.5px solid #E2E2E6", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px Poppins", color: "#6b6b72" }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8" }}>{(m.guests || []).length}/{m.numberChair || 0} personas</div></div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c8c8ce" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* TAB MOBILIARIO */}
          {tab === "mobiliario" && (
            <div style={{ animation: "msm-fade .2s ease" }}>
              <div style={{ background: "#FCF2F6", border: "1px solid #f7c2da", borderRadius: 999, padding: "9px 16px", marginBottom: 11 }}><div style={{ font: "500 10px Poppins", color: "#c14a78" }}>Toca un elemento para añadirlo al plano.</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 9 }}>
                {MOBILIARIO.map((f) => (
                  <div key={f.model} onClick={() => addFurniture(f)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "12px 4px", borderRadius: 12, background: "#fff", border: "1.5px solid #f0f0f2", cursor: "pointer" }}>
                    <div style={{ color: "#EF5B94" }}>{(() => { const Icon = f.Icon; return <Icon width={22} height={22} />; })()}</div>
                    <span style={{ font: "600 9.5px Poppins", color: "#3A3A42", textAlign: "center" }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB RESUMEN */}
          {tab === "resumen" && (
            <div style={{ animation: "msm-fade .2s ease" }}>
              <div style={{ borderRadius: 13, padding: 14, background: "#fff", border: "1px solid #f0f0f2", boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><div style={{ font: "700 24px Poppins", lineHeight: 1, color: "#EF5B94" }}>{resumenPct}%</div><div style={{ font: "600 10.5px Poppins", color: "#8a8a90" }}>ocupado</div></div>
                  <div style={{ font: "700 9px Poppins", letterSpacing: 1, textTransform: "uppercase", color: "#b3b3ba" }}>Plano «{space?.title}»</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "#faf9fb", border: "1px solid #f0f0f2", borderRadius: 9, padding: "7px 10px" }}><div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{tables.length}</div><div style={{ font: "500 9.5px Poppins", color: "#a0a0a8" }}>Mesas</div></div>
                  <div style={{ flex: 1, background: "#faf9fb", border: "1px solid #f0f0f2", borderRadius: 9, padding: "7px 10px" }}><div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{seatedInSpace.size}</div><div style={{ font: "500 9.5px Poppins", color: "#a0a0a8" }}>Sentados</div></div>
                  <div style={{ flex: 1, background: "#faf9fb", border: "1px solid #f0f0f2", borderRadius: 9, padding: "7px 10px" }}><div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{totalSillas}</div><div style={{ font: "500 9.5px Poppins", color: "#a0a0a8" }}>Sillas</div></div>
                </div>
              </div>
            </div>
          )}

          {/* INVITADOS */}
          <div style={{ background: "#fff", borderRadius: 15, marginTop: 14, padding: "13px 14px", boxShadow: "0 3px 12px rgba(0,0,0,.05)" }}>
            <div onClick={() => setGuestsOpen((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${guestsOpen ? 0 : -90}deg)`, transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg><div style={{ font: "700 13px Poppins", color: "#3A3A42" }}>Invitados</div></div>
              <div style={{ font: "600 10.5px Poppins", color: "#a0a0a8" }}>Sentados <span style={{ color: "#EF5B94" }}>{seatedInSpace.size}/{invitados.length}</span></div>
            </div>
            {guestsOpen && (
              <div style={{ animation: "msm-fade .2s ease", marginTop: 11 }}>
                <div style={{ display: "flex", background: "#f2f2f4", borderRadius: 9, padding: 3, gap: 2, marginBottom: 10 }}>
                  {([["todos", "Todos"], ["porsentar", "Por sentar"], ["sentados", "Sentados"]] as const).map(([k, label]) => {
                    const on = gFilter === k;
                    return <div key={k} onClick={() => setGFilter(k)} style={{ flex: 1, textAlign: "center", padding: "7px 2px", borderRadius: 7, font: "600 10.5px Poppins", cursor: "pointer", background: on ? "#fff" : "transparent", color: on ? "#EF5B94" : "#8a8a90", boxShadow: on ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>{label}</div>;
                  })}
                </div>
                {picked && <div style={{ background: "#FCF2F6", border: "1px solid #f7c2da", borderRadius: 999, padding: "9px 16px", marginBottom: 10 }}><div style={{ font: "500 10px Poppins", color: "#c14a78", lineHeight: 1.35 }}>Toca una mesa del plano para sentar a {picked.nombre}.</div></div>}
                <div className="msm-hs" style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 260, overflow: "auto" }}>
                  {listForFilter.length === 0 && <div style={{ padding: "14px 4px", textAlign: "center", font: "500 11.5px Poppins", color: "#c4c4cc" }}>Sin invitados aquí.</div>}
                  {listForFilter.map((gm) => {
                    const info = seatedInSpace.get(gm._id);
                    const isPicked = picked?._id === gm._id;
                    if (info) {
                      return (
                        <div key={gm._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 9, borderRadius: 11, background: "#fff", border: "1.5px solid #f0f0f2" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", flex: "none", background: "linear-gradient(135deg,#c4c4cc,#a8a8b0)" }} />
                          <div style={{ flex: 1, minWidth: 0, font: "600 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{gm.nombre}</div>
                          <div style={{ font: "600 10px Poppins", color: "#EF5B94", background: "#FCE7F0", padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>{info.table.title}</div>
                          <div onClick={() => unseatGuest(gm)} style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", cursor: "pointer", fontSize: 13 }}>✕</div>
                        </div>
                      );
                    }
                    return (
                      <div key={gm._id} onClick={() => setPicked(isPicked ? null : gm)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 9, borderRadius: 11, cursor: "pointer", background: isPicked ? "#FCE7F0" : "#faf9fb", border: `1.5px solid ${isPicked ? "#EF5B94" : "#f0f0f2"}` }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", flex: "none", background: "linear-gradient(135deg,#c4c4cc,#a8a8b0)" }} />
                        <div style={{ flex: 1, minWidth: 0, font: "600 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{gm.nombre}</div>
                        <div style={{ font: "600 10px Poppins", color: isPicked ? "#EF5B94" : "#a0a0a8" }}>{isPicked ? "Elige mesa…" : "Sentar"}</div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setAddOpen(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 10, borderRadius: 11, background: "#fff", border: "1.5px dashed #f0aecb", color: "#EF5B94", font: "600 12.5px Poppins", marginTop: 10, cursor: "pointer" }}><span style={{ fontSize: 15 }}>＋</span>Añadir Invitados</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET: DISEÑAR MESA (portal para escapar el stacking context de la columna) */}
      {mounted && designOpen && createPortal(
        <div>
          <div onClick={() => setDesignOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(43,43,48,.38)", zIndex: 99998, animation: "msm-fade .15s ease" }} />
          <div className="msm-hs" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "#fff", borderRadius: "22px 22px 0 0", zIndex: 99999, boxShadow: "0 -12px 40px rgba(0,0,0,.2)", animation: "msm-up .25s ease", maxHeight: "86vh", overflow: "auto", fontFamily: "'Poppins',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px 12px", borderBottom: "1px solid #f0f0f2", position: "sticky", top: 0, background: "#fff", borderRadius: "22px 22px 0 0" }}>
              <div style={{ font: "700 16px Poppins", color: "#3A3A42", flex: 1 }}>{editId ? "Editar mesa" : "Diseñar mesa"}</div>
              <button onClick={() => setDesignOpen(false)} style={{ width: 30, height: 30, borderRadius: 9, color: "#a0a0a8", fontSize: 17, border: "none", background: "none", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ font: "700 10.5px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>Nombre de la mesa</div>
                <input type="text" value={dName} onChange={(e) => setDName(e.target.value)} placeholder="Ej. Familia de la novia" style={{ width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 10, border: "1.5px solid #E7E7EA", background: "#fff", font: "500 13px Poppins", color: "#3A3A42", outline: "none" }} />
              </div>
              <div>
                <div style={{ font: "700 10.5px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Forma</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {SHAPE_LABELS.map((sh) => {
                    const on = dShape === sh;
                    return <div key={sh} onClick={() => setDShape(sh)} style={{ padding: "8px 13px", borderRadius: 9, font: "600 12px Poppins", cursor: "pointer", border: `1.5px solid ${on ? "#EF5B94" : "#E7E7EA"}`, background: on ? "#FCE7F0" : "#fff", color: on ? "#EF5B94" : "#6b6b72" }}>{sh}</div>;
                  })}
                </div>
              </div>
              <div>
                <div style={{ font: "700 10.5px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Nº de sillas</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={() => setDSillas((n) => Math.max(1, n - 1))} style={{ width: 40, height: 40, borderRadius: 10, background: "#f7f7f9", color: "#EF5B94", fontSize: 20, border: "none", cursor: "pointer" }}>−</button>
                  <div style={{ flex: 1, font: "700 19px Poppins", color: "#3A3A42", textAlign: "center" }}>{dSillas}</div>
                  <button onClick={() => setDSillas((n) => Math.min(40, n + 1))} style={{ width: 40, height: 40, borderRadius: 10, background: "#f7f7f9", color: "#EF5B94", fontSize: 20, border: "none", cursor: "pointer" }}>＋</button>
                </div>
              </div>
              {/* preview */}
              <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                <div style={{ position: "relative", width: 180, height: 130, background: "#fff", border: "1px solid #E7E7EA", borderRadius: 14, backgroundImage: "radial-gradient(#e2e2e6 1px,transparent 1px)", backgroundSize: "13px 13px", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: "50%", top: "50%", width: preview.bw, height: preview.bh, transform: `translate(-50%,-50%) scale(${preview.scale})`, transformOrigin: "center center" }}>
                    <div style={{ position: "absolute", left: -preview.minX, top: -preview.minY, width: preview.g.w, height: preview.g.h, borderRadius: preview.g.round ? "50%" : 12, background: "#F0F0F2", border: "2px solid #4a4a52", display: "flex", alignItems: "center", justifyContent: "center", font: "700 18px Poppins", color: "#4a4a52" }}>{dSillas}</div>
                    {preview.slots.map((sl, i) => (
                      <div key={i} style={{ position: "absolute", left: sl.x - preview.minX, top: sl.y - preview.minY, width: 13, height: 13, borderRadius: "50%", background: "#fff", border: "1.5px solid #B4B4BC" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 18px 20px", borderTop: "1px solid #f0f0f2", display: "flex", gap: 10 }}>
              <button onClick={() => setDesignOpen(false)} style={{ flex: 1, padding: 13, borderRadius: 11, background: "#f7f7f9", color: "#6b6b72", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmDesign} disabled={busy} style={{ flex: 1, padding: 13, borderRadius: 11, background: busy ? "#f4b8d1" : "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", boxShadow: "0 6px 16px rgba(239,91,148,.32)", cursor: busy ? "default" : "pointer" }}>{editId ? "Guardar cambios" : "Crear mesa"}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* MODAL CREAR PLANO */}
      {mounted && newPlanoOpen && createPortal(
        <div onClick={() => setNewPlanoOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(43,43,48,.38)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Poppins',sans-serif" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.28)", padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, flex: "none", background: "#FCE7F0", color: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 13h5M12 13h9M15 3v4M15 11v10" /></svg></div>
              <div><div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>Crear plano nuevo</div><div style={{ font: "500 11px Poppins", color: "#a0a0a8" }}>Un espacio para tu evento</div></div>
            </div>
            <div style={{ font: "700 10.5px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>Nombre del plano</div>
            <input type="text" autoFocus value={newPlanoName} onChange={(e) => setNewPlanoName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createPlano(); if (e.key === "Escape") setNewPlanoOpen(false); }} placeholder="Ej. Jardín, Cóctel, Terraza…" style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 11, border: "1.5px solid #E7E7EA", background: "#fff", font: "500 13px Poppins", color: "#3A3A42", outline: "none" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => setNewPlanoOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 11, background: "#f7f7f9", color: "#6b6b72", font: "600 12.5px Poppins", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={createPlano} disabled={busy || !newPlanoName.trim()} style={{ flex: 1, padding: 12, borderRadius: 11, background: newPlanoName.trim() && !busy ? "#EF5B94" : "#f4b8d1", color: "#fff", font: "600 12.5px Poppins", border: "none", boxShadow: "0 6px 16px rgba(239,91,148,.28)", cursor: newPlanoName.trim() && !busy ? "pointer" : "default" }}>Crear plano</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default MesasStudioMovil;
