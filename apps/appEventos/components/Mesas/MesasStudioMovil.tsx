import { FC, useMemo, useState } from "react";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import FormInvitadoStudio from "../Forms/FormInvitadoStudio";
import ModalCompartirEventoStudio from "../Utils/ModalCompartirEventoStudio";

/**
 * MesasStudioMovil — vista MÓVIL de Mesas (FASE 1) fiel al HTML studio.
 * FASE 1: ver planos (chips) + lienzo con mesas y asientos reales + zoom +
 *   tocar para sentar/quitar invitados + tabs (Mesas/Resumen) + lista de invitados.
 * MISMO backend: planSpace[].tables[].guests, editTable (guests) + editGuests
 *   (nombre_mesa/puesto) — igual que moveGuest de FuntionsDragable.
 * FASE 2 (pendiente): crear/editar/borrar mesa, crear plano, mobiliario.
 */

const CHAIR_TIPOS = ["redonda", "cuadrada", "imperial", "militar", "podio", "bancos"];

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

  const [zoom, setZoom] = useState(100);
  const [picked, setPicked] = useState<any>(null);   // invitado elegido para sentar
  const [tab, setTab] = useState<"mesas" | "mobiliario" | "resumen">("mesas");
  const [guestsOpen, setGuestsOpen] = useState(true);
  const [gFilter, setGFilter] = useState<"todos" | "porsentar" | "sentados">("todos");
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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

  const zoomScale = zoom / 100;
  const listForFilter = gFilter === "porsentar" ? pendingGuests : gFilter === "sentados" ? seatedGuests : invitados;

  return (
    <div className="md:hidden" style={{ background: "#fff", minHeight: "100%", position: "relative", display: "flex", flexDirection: "column", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes msm-fade{from{opacity:0}to{opacity:1}}.msm-hs{scrollbar-width:none;}.msm-hs::-webkit-scrollbar{display:none;}" }} />
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
              <div key={p._id} onClick={() => { setPlanoId(p._id); setPicked(null); }} style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, cursor: "pointer", background: on ? "#EF5B94" : "#fff", border: `1.5px solid ${on ? "#EF5B94" : "#f0f0f2"}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={on ? "#fff" : "#EF5B94"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 13h5M12 13h9M15 3v4M15 11v10" /></svg>
                <span style={{ font: "600 12px Poppins", color: on ? "#fff" : "#EF5B94", whiteSpace: "nowrap" }}>{p.title}</span>
                <span style={{ font: "600 10px Poppins", color: on ? "rgba(255,255,255,.85)" : "#a0a0a8", whiteSpace: "nowrap" }}>{mesas} mesas</span>
              </div>
            );
          })}
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
          <div style={{ position: "relative", height: 330, borderRadius: 18, background: "#F3F1EC", overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,.07)" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#E4E1D8 1px,transparent 1px),linear-gradient(90deg,#E4E1D8 1px,transparent 1px)", backgroundSize: "36px 36px", opacity: .6 }} />
            {/* zoom + nombre plano */}
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 8, zIndex: 3 }}>
              <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 10, boxShadow: "0 3px 10px rgba(0,0,0,.08)", overflow: "hidden" }}>
                <button onClick={() => setZoom((z) => Math.max(50, z - 10))} style={{ width: 32, height: 32, color: "#EF5B94", fontSize: 16, border: "none", background: "none", cursor: "pointer" }}>−</button>
                <div style={{ font: "700 11px Poppins", color: "#3A3A42", padding: "0 4px", minWidth: 40, textAlign: "center" }}>{zoom}%</div>
                <button onClick={() => setZoom((z) => Math.min(150, z + 10))} style={{ width: 32, height: 32, color: "#EF5B94", fontSize: 16, border: "none", background: "none", cursor: "pointer" }}>＋</button>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 3px 10px rgba(0,0,0,.08)", padding: "8px 12px", font: "600 11px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>{space?.title}</div>
            </div>

            <div style={{ position: "absolute", inset: 0, transform: `scale(${zoomScale})`, transformOrigin: "center center" }}>
              {tables.map((t, i) => {
                const g = tableGeom(t);
                const slots = seatSlots(t, g);
                const occ = new Map((t.guests || []).map((x: any) => [x.chair, x]));
                const seatedCount = (t.guests || []).length;
                const px = t?.position?.x ?? (24 + (i % 3) * 120);
                const py = t?.position?.y ?? (24 + Math.floor(i / 3) * 120);
                return (
                  <div key={t._id} onClick={() => seatGuest(t)} style={{ position: "absolute", left: px, top: py, zIndex: 2, cursor: picked ? "pointer" : "default" }}>
                    {slots.map((s) => {
                      const on = occ.has(s.chair);
                      return <div key={s.chair} style={{ position: "absolute", left: s.x, top: s.y, width: 15, height: 15, borderRadius: "50%", background: on ? "#EF5B94" : "#fff", border: `1.5px solid ${on ? "#EF5B94" : "#cfcfd6"}`, zIndex: 1, boxShadow: on ? "0 0 0 2px rgba(239,91,148,.18)" : "none" }} />;
                    })}
                    <div style={{ position: "relative", width: g.w, height: g.h, borderRadius: g.round ? "50%" : 12, background: "#F0F0F2", border: `2.5px solid ${picked ? "#EF5B94" : "#d8d8de"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,.1)" }}>
                      <span style={{ font: "700 13px Poppins", color: "#6b6b72" }}>{t.title}</span>
                      {seatedCount > 0 && <div style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "700 9px Poppins", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", boxShadow: "0 2px 5px rgba(0,0,0,.2)" }}>{seatedCount}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {tables.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, zIndex: 2, padding: 20, textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "2px dashed #f0aecb", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><ellipse cx="12" cy="9" rx="8" ry="3" /><path d="M6 10v8M18 10v8" /></svg></div>
                <div><div style={{ font: "700 14px Poppins", color: "#3A3A42" }}>Aún no hay mesas en «{space?.title}»</div><div style={{ font: "500 11px Poppins", color: "#8a8a90", marginTop: 2 }}>Crea mesas desde escritorio (edición móvil próximamente).</div></div>
              </div>
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
              {tables.map((m, i) => (
                <div key={m._id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12, background: "#fff", border: "1.5px solid #f0f0f2" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, flex: "none", background: "#F0F0F2", border: "1.5px solid #E2E2E6", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px Poppins", color: "#6b6b72" }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8" }}>{(m.guests || []).length}/{m.numberChair || 0} personas</div></div>
                </div>
              ))}
            </div>
          )}

          {/* TAB MOBILIARIO (Fase 2) */}
          {tab === "mobiliario" && (
            <div style={{ animation: "msm-fade .2s ease", background: "#fff", border: "1px solid #f0f0f2", borderRadius: 13, padding: "22px 16px", textAlign: "center" }}>
              <div style={{ font: "600 12.5px Poppins", color: "#8a8a90" }}>Añadir mobiliario llega en la siguiente fase.</div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 260, overflow: "auto" }}>
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
    </div>
  );
};

export default MesasStudioMovil;
