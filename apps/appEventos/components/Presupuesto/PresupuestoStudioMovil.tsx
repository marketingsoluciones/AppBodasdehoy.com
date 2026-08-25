import { FC, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";

/**
 * PresupuestoStudioMovil — vista MÓVIL de Presupuesto fiel al HTML studio (md:hidden).
 * Escritorio intacto (PresupuestoStudio en hidden md:block). MISMO backend:
 *   presupuesto_objeto.{categorias_array[].gastos_array[].pagos_array[], pagado, currency,
 *   presupuesto_total, weddingPlannerIngresos}. Escrituras reutilizan las mismas mutaciones
 *   que el desktop: editPresupuesto, nuevoCategoria, nuevoGasto+editGasto, addWeddingPlannerIngreso.
 * IMPORTANTE: root con clases (flex flex-col) SIN display inline → md:hidden oculta bien en desk.
 */

const WP = "wedding planer";
const parseEs = (s: string) => { const n = parseFloat(String(s).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".")); return Number.isNaN(n) ? 0 : n; };
const gastoPagado = (g: any) => (g?.pagos_array || []).filter((p: any) => p?.estado === "pagado").reduce((a: number, p: any) => a + (Number(p.importe) || 0), 0);
const gastoEstaPagado = (g: any) => (g?.coste_final || 0) > 0 && gastoPagado(g) >= (g?.coste_final || 0);

const PresupuestoStudioMovil: FC = () => {
  const { event, setEvent } = EventContextProvider() as any;
  const { user } = AuthContextProvider() as any;
  const toast = useToast();
  const [isAllowed, ht] = useAllowed();

  const po = event?.presupuesto_objeto;
  const cur = po?.currency;
  const cats: any[] = useMemo(() => (po?.categorias_array || []).filter(Boolean), [po]);
  const deposits: any[] = po?.weddingPlannerIngresos || [];
  const isOwner = event?.usuario_id === user?.uid;

  const fmt = (n: number) => getCurrency(Number(n) || 0, cur);

  // ── Totales ──
  const budget = typeof po?.presupuesto_total === "number" ? po.presupuesto_total : (po?.coste_estimado || 0);
  const gastado = cats.reduce((s, c) => s + (c.coste_final || 0), 0);
  const pagado = po?.pagado || 0;
  const pendiente = Math.max(0, gastado - pagado);
  const overBudget = budget > 0 && gastado > budget;
  const over = overBudget ? gastado - budget : 0;
  const pctPagado = budget > 0 ? Math.min(100, (pagado / budget) * 100) : 0;
  const pctPendiente = budget > 0 ? Math.min(100 - pctPagado, (pendiente / budget) * 100) : 0;

  // ── Planner (gestión financiera) ──
  const fin = useMemo(() => {
    const allPagos: any[] = [];
    cats.forEach((c) => (c.gastos_array || []).filter((g: any) => g?.estatus !== false).forEach((g: any) => (g.pagos_array || []).filter((p: any) => p?.estado === "pagado").forEach((p: any) => allPagos.push(p))));
    const wpPagos = allPagos.filter((p) => p.pagado_por === WP);
    const recibido = deposits.reduce((a, d) => a + (Number(d.monto) || 0), 0);
    const utilizado = wpPagos.reduce((a, p) => a + (Number(p.importe) || 0), 0);
    const disponible = recibido - utilizado;
    return { nPagos: allPagos.length, wpUsos: wpPagos.length, recibido, utilizado, disponible };
  }, [cats, deposits]);
  const proximos = useMemo(() => {
    const out: any[] = [];
    cats.forEach((c) => (c.gastos_array || []).filter((g: any) => g?.estatus !== false && !gastoEstaPagado(g) && (g?.coste_final || 0) > 0).forEach((g: any) => out.push({ id: g._id, catId: c._id, name: g.nombre, cat: c.nombre, monto: (g.coste_final || 0) - gastoPagado(g), fecha: g?.fecha_pago ? new Date(g.fecha_pago).toLocaleDateString() : c.nombre })));
    return out;
  }, [cats]);

  const [tab, setTab] = useState<"resumen" | "gastos" | "planner">("resumen");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Sheets / forms
  const [catSheet, setCatSheet] = useState<any>(null);           // categoría abierta (detalle)
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [budgetVal, setBudgetVal] = useState("");
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addCatName, setAddCatName] = useState("");
  const [gastoForm, setGastoForm] = useState<{ catId: string; nombre: string; coste: string } | null>(null);
  const [depOpen, setDepOpen] = useState(false);
  const [depMonto, setDepMonto] = useState("");
  const [depMetodo, setDepMetodo] = useState("");
  const [depRef, setDepRef] = useState("");
  const [busy, setBusy] = useState(false);

  // Gastos tab
  const [query, setQuery] = useState("");
  const [pill, setPill] = useState<"todos" | "pagado" | "pendiente">("todos");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const applyPO = (result: any) => {
    const next = result?.evento?.presupuesto_objeto;
    if (next) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: next }));
    return next;
  };
  const guard = () => { if (!isAllowed()) { ht(); return false; } return true; };

  // ── Escrituras ──
  const saveBudget = async () => {
    if (!guard() || busy) return;
    const v = parseEs(budgetVal);
    setBusy(true);
    try {
      const r: any = await fetchApiEventos({ query: queries.editPresupuesto, variables: { evento_id: event._id, datos: { presupuesto_total: v } } });
      if (!applyPO(r)) { toast("error", "No se pudo actualizar el presupuesto"); return; }
      toast("success", "Presupuesto actualizado");
      setEditBudgetOpen(false);
    } catch { toast("error", "Ocurrió un error"); } finally { setBusy(false); }
  };
  const addCategory = async () => {
    if (!guard() || busy) return;
    const nombre = addCatName.trim(); if (!nombre) return;
    setBusy(true);
    try {
      const r: any = await fetchApiEventos({ query: queries.nuevoCategoria, variables: { evento_id: event._id, nombre } });
      if (!applyPO(r)) { toast("error", "No se pudo crear la categoría"); return; }
      toast("success", `Categoría «${nombre}» creada`);
      setAddCatOpen(false); setAddCatName("");
    } catch { toast("error", "Ocurrió un error"); } finally { setBusy(false); }
  };
  const addGasto = async () => {
    if (!guard() || busy || !gastoForm) return;
    const nombre = gastoForm.nombre.trim(); if (!nombre) return;
    const coste = parseEs(gastoForm.coste);
    const catId = gastoForm.catId;
    setBusy(true);
    try {
      const r1: any = await fetchApiEventos({ query: queries.nuevoGasto, variables: { evento_id: event._id, categoria_id: catId, nombre } });
      const po1 = r1?.evento?.presupuesto_objeto;
      if (!po1) { toast("error", "No se pudo añadir el gasto"); return; }
      applyPO(r1);
      if (coste > 0) {
        const cat = (po1.categorias_array || []).find((c: any) => c._id === catId);
        const arr = cat?.gastos_array || [];
        const g = [...arr].reverse().find((x: any) => x.nombre === nombre) || arr[arr.length - 1];
        if (g?._id) {
          const r2: any = await fetchApiEventos({ query: queries.editGasto, variables: { evento_id: event._id, categoria_id: catId, gasto_id: g._id, variable_reemplazar: "coste_final", valor_reemplazar: String(coste) } });
          applyPO(r2);
        }
      }
      toast("success", "Gasto añadido");
      setGastoForm(null);
    } catch { toast("error", "Ocurrió un error"); } finally { setBusy(false); }
  };
  const addDeposito = async () => {
    if (!guard() || busy) return;
    const monto = parseEs(depMonto); if (!monto) return;
    setBusy(true);
    try {
      const r: any = await fetchApiEventos({ query: queries.addWeddingPlannerIngreso, variables: { evento_id: event._id, ingreso: { fecha: new Date(), monto, metodo: depMetodo, referencia: depRef, registrado_por: user?.displayName || user?.email || "" } } });
      if (!applyPO(r)) { toast("error", "No se pudo registrar el depósito"); return; }
      toast("success", "Depósito registrado");
      setDepOpen(false); setDepMonto(""); setDepMetodo(""); setDepRef("");
    } catch { toast("error", "Ocurrió un error"); } finally { setBusy(false); }
  };

  const openEditBudget = () => { setBudgetVal(String(budget || "")); setEditBudgetOpen(true); };
  const openCategory = (c: any) => setCatSheet(c);
  const catDetail = catSheet ? cats.find((c) => c._id === catSheet._id) || catSheet : null;

  const TABS = [["resumen", "Resumen"], ["gastos", "Gastos"], ["planner", "Planner"]] as const;
  const sheetBackdrop: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(30,30,36,.4)", zIndex: 99998 };
  const sheetBox: React.CSSProperties = { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "#fff", borderRadius: "20px 20px 0 0", zIndex: 99999, padding: "10px 18px 22px", animation: "psm-up .22s ease", maxHeight: "82vh", overflow: "auto", fontFamily: "'Poppins',sans-serif" };
  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: "1.5px solid #E7E7EA", background: "#fff", font: "500 13px Poppins", color: "#3A3A42", outline: "none" };

  return (
    <div className="md:hidden flex flex-col psm-hs" style={{ maxWidth: 420, margin: "0 auto", background: "#f1f1f4", minHeight: "100%", paddingBottom: 40, fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes psm-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes psm-up{from{transform:translate(-50%,100%)}to{transform:translate(-50%,0)}}.psm-hs{scrollbar-width:none}.psm-hs::-webkit-scrollbar{display:none}" }} />

      {/* TITLE BAR */}
      <div style={{ background: "#fff", padding: "12px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 14px rgba(0,0,0,.05)" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: "700 19px Poppins", color: "#3A3A42", whiteSpace: "nowrap" }}>Presupuesto</div>
          <div style={{ font: "700 10px Poppins", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ color: "#EF5B94" }}>{(event?.tipo || "EVENTO").toUpperCase()}</span><span style={{ color: "#9aa2ab", fontWeight: 600 }}> · {event?.nombre}</span></div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 13, padding: 4, margin: "12px 14px 0", boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}>
        {TABS.map(([k, label]) => {
          const on = tab === k;
          return <div key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 10, font: "600 12px Poppins", cursor: "pointer", color: on ? "#fff" : "#8a8a90", background: on ? "#EF5B94" : "transparent", transition: "all .18s" }}>{label}</div>;
        })}
      </div>

      {/* ══════ RESUMEN ══════ */}
      {tab === "resumen" && (
        <div style={{ animation: "psm-fade .2s ease" }}>
          {/* Presupuesto total */}
          <div style={{ background: "#fff", borderRadius: 16, margin: "12px 14px 0", padding: 16, boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ font: "600 13px Poppins", color: "#6b6b72" }}>Presupuesto total</div>
              {isOwner && <div onClick={openEditBudget} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#EF5B94", cursor: "pointer" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg><span style={{ font: "600 11px Poppins" }}>Editar</span></div>}
            </div>
            <div style={{ font: "700 26px Poppins", color: "#3A3A42", marginTop: 4 }}>{fmt(budget)}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, background: "#faf9fb", borderRadius: 11, padding: 11, textAlign: "center" }}><div style={{ font: "600 14px Poppins", color: "#D83E7C" }}>{fmt(gastado)}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>Gastado</div></div>
              <div style={{ flex: 1, background: "#faf9fb", borderRadius: 11, padding: 11, textAlign: "center" }}><div style={{ font: "600 14px Poppins", color: "#2FB37E" }}>{fmt(pagado)}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>Pagado</div></div>
              <div style={{ flex: 1, background: "#faf9fb", borderRadius: 11, padding: 11, textAlign: "center" }}><div style={{ font: "600 14px Poppins", color: "#B4801F" }}>{fmt(pendiente)}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>Pendiente</div></div>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: "#f0f0f2", overflow: "hidden", marginTop: 12, display: "flex" }}>
              <div style={{ height: "100%", width: `${pctPagado}%`, background: "#2FB37E" }} />
              <div style={{ height: "100%", width: `${pctPendiente}%`, background: "#F2D48F" }} />
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2FB37E" }} /><span style={{ font: "500 10px Poppins", color: "#8a8a90" }}>Pagado</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F2D48F" }} /><span style={{ font: "500 10px Poppins", color: "#8a8a90" }}>Por pagar</span></div>
            </div>
            {overBudget && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FDF6E7", border: "1px solid #F2E2B8", borderRadius: 999, padding: "5px 12px", marginTop: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B4801F" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h0" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                <span style={{ font: "600 10.5px Poppins", color: "#B4801F" }}>Superas el presupuesto en {fmt(over)}</span>
              </div>
            )}
          </div>

          {/* ¿Cómo va tu presupuesto? */}
          <div style={{ background: "#fff", borderRadius: 16, margin: "12px 14px 0", padding: 16, boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ font: "700 14px Poppins", color: "#3A3A42" }}>¿Cómo va tu presupuesto?</div>
              {isOwner && <div onClick={() => { setAddCatName(""); setAddCatOpen(true); }} style={{ font: "600 11px Poppins", color: "#EF5B94", cursor: "pointer", whiteSpace: "nowrap" }}>＋ Categoría</div>}
            </div>
            <div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginBottom: 10 }}>Toca una categoría para ver y añadir gastos</div>
            {cats.length === 0 && <div style={{ padding: "12px 2px", font: "500 12px Poppins", color: "#a0a0a8" }}>Aún no hay categorías.</div>}
            {cats.map((c) => {
              const real = c.coste_final || 0;
              const est = c.coste_estimado || 0;
              const nG = (c.gastos_array || []).filter((g: any) => g?.estatus !== false).length;
              const pct = est > 0 ? Math.min(100, (real / est) * 100) : (real > 0 ? 100 : 0);
              const barCol = est > 0 && real > est ? "#EF5B94" : "#2FB37E";
              const sub = est > 0 ? `${Math.round(pct)}% del estimado` : `${nG} gasto${nG === 1 ? "" : "s"}`;
              return (
                <div key={c._id} onClick={() => openCategory(c)} style={{ padding: "11px 2px", borderBottom: "1px solid #f5f5f7", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ font: "500 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                      <span style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>{fmt(real)}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9c9cf" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 6, background: "#f0f0f2", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: barCol, borderRadius: 6 }} /></div>
                    <span style={{ font: "500 10px Poppins", color: "#a0a0a8", whiteSpace: "nowrap" }}>{sub}</span>
                  </div>
                  {nG === 0 && <div style={{ font: "500 10.5px Poppins", color: "#EF5B94", marginTop: 6 }}>Toca para añadir tu primer gasto</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════ GASTOS ══════ */}
      {tab === "gastos" && (
        <div style={{ margin: "12px 14px 0", animation: "psm-fade .2s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "9px 12px", marginBottom: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a0a8" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar gasto…" style={{ flex: 1, border: "none", outline: "none", font: "500 12px Poppins", color: "#3A3A42", background: "transparent", minWidth: 0 }} />
          </div>
          <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
            {([["todos", "Todos"], ["pagado", "Pagados"], ["pendiente", "Pendientes"]] as const).map(([k, label]) => {
              const on = pill === k;
              return <div key={k} onClick={() => setPill(k)} style={{ padding: "7px 15px", borderRadius: 999, font: "600 11px Poppins", cursor: "pointer", color: on ? "#fff" : "#8a8a90", background: on ? "#EF5B94" : "#fff", border: `1.5px solid ${on ? "#EF5B94" : "#E7E7EA"}` }}>{label}</div>;
            })}
          </div>
          {cats.map((c) => {
            const q = query.trim().toLowerCase();
            let rows = (c.gastos_array || []).filter((g: any) => g?.estatus !== false);
            if (q) rows = rows.filter((g: any) => (g.nombre || "").toLowerCase().includes(q));
            if (pill === "pagado") rows = rows.filter((g: any) => gastoEstaPagado(g));
            if (pill === "pendiente") rows = rows.filter((g: any) => !gastoEstaPagado(g));
            if (rows.length === 0 && (q || pill !== "todos")) return null;
            const open = openGroups[c._id] ?? false;
            return (
              <div key={c._id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, boxShadow: "0 3px 10px rgba(0,0,0,.04)", overflow: "hidden" }}>
                <div onClick={() => setOpenGroups((o) => ({ ...o, [c._id]: !open }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 15px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .18s", transform: open ? "rotate(90deg)" : "rotate(0deg)", flex: "none" }}><path d="M9 6l6 6-6 6" /></svg>
                    <span style={{ font: "600 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</span>
                  </div>
                  <span style={{ font: "600 12px Poppins", color: "#6b6b72", whiteSpace: "nowrap" }}>{fmt(c.coste_final || 0)}</span>
                </div>
                {open && (
                  <div style={{ borderTop: "1px solid #f5f5f7" }}>
                    {rows.length === 0 && <div style={{ padding: "12px 15px", font: "500 11.5px Poppins", color: "#a0a0a8", textAlign: "center" }}>Sin gastos aquí.</div>}
                    {rows.map((r: any) => {
                      const pgd = gastoEstaPagado(r);
                      return (
                        <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 15px", borderBottom: "1px solid #f8f8fa" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ font: "500 12px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nombre}</div>
                            <div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>{fmt(gastoPagado(r))} pagado</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                            <span style={{ font: "600 12px Poppins", color: "#3A3A42" }}>{fmt(r.coste_final || 0)}</span>
                            <span style={{ font: "600 9.5px Poppins", color: pgd ? "#2FB37E" : "#B4801F", background: pgd ? "#E4F5EE" : "#FBF0DA", padding: "3px 9px", borderRadius: 999 }}>{pgd ? "Pagado" : "Pendiente"}</span>
                          </div>
                        </div>
                      );
                    })}
                    {isOwner && <div onClick={() => setGastoForm({ catId: c._id, nombre: "", coste: "" })} style={{ textAlign: "center", padding: 11, font: "600 11.5px Poppins", color: "#EF5B94", cursor: "pointer" }}>＋ Añadir gasto</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ PLANNER ══════ */}
      {tab === "planner" && (
        <div style={{ margin: "12px 14px 0", animation: "psm-fade .2s ease" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}>
            <div style={{ font: "700 14px Poppins", color: "#3A3A42" }}>Gestión financiera</div>
            <div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>Depósitos, pagos directos y pagos por Wedding Planner</div>
            <div className="psm-hs" style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12, paddingBottom: 2 }}>
              <div style={{ flex: "none", width: 150, background: "#faf9fb", borderRadius: 12, padding: "12px 13px" }}><span style={{ font: "600 8.5px Poppins", color: "#2FB37E", background: "#E4F5EE", padding: "3px 9px", borderRadius: 999, letterSpacing: ".4px" }}>TOTAL RECIBIDO</span><div style={{ font: "700 17px Poppins", color: "#3A3A42", marginTop: 8 }}>{fmt(fin.recibido)}</div><div style={{ font: "500 9.5px Poppins", color: "#a0a0a8" }}>Del presupuesto total</div></div>
              <div style={{ flex: "none", width: 150, background: "#faf9fb", borderRadius: 12, padding: "12px 13px" }}><span style={{ font: "600 8.5px Poppins", color: "#6b6b72", background: "#ececee", padding: "3px 9px", borderRadius: 999, letterSpacing: ".4px" }}>FONDOS DISPONIBLES</span><div style={{ font: "700 17px Poppins", color: "#3A3A42", marginTop: 8 }}>{fmt(fin.disponible)}</div><div style={{ font: "500 9.5px Poppins", color: "#a0a0a8" }}>{fin.recibido > 0 ? Math.round((fin.disponible / fin.recibido) * 100) : 0}% del total</div></div>
              <div style={{ flex: "none", width: 150, background: "#faf9fb", borderRadius: 12, padding: "12px 13px" }}><span style={{ font: "600 8.5px Poppins", color: "#EF5B94", background: "#FCE7F0", padding: "3px 9px", borderRadius: 999, letterSpacing: ".4px" }}>TOTAL UTILIZADO</span><div style={{ font: "700 17px Poppins", color: "#3A3A42", marginTop: 8 }}>{fmt(fin.utilizado)}</div><div style={{ font: "500 9.5px Poppins", color: "#a0a0a8" }}>En {fin.wpUsos} pagos</div></div>
            </div>
            {isOwner && <button onClick={() => setDepOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", marginTop: 12, height: 42, border: "none", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", cursor: "pointer", boxShadow: "0 6px 14px rgba(239,91,148,.26)" }}>＋ Registrar nuevo depósito</button>}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}><div style={{ font: "600 16px Poppins", color: "#3A3A42" }}>{fin.nPagos}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>Pagos hechos</div></div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}><div style={{ font: "600 16px Poppins", color: "#B4801F" }}>{proximos.length}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>Pendientes</div></div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}><div style={{ font: "600 16px Poppins", color: "#2FB37E" }}>{fmt(pagado)}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>Abonado</div></div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}>
            <div style={{ font: "700 14px Poppins", color: "#3A3A42", marginBottom: 10 }}>Próximos pagos</div>
            {proximos.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 0", borderBottom: "1px solid #f5f5f7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, flex: "none", borderRadius: 10, background: "#FBF0DA", display: "flex", alignItems: "center", justifyContent: "center", color: "#C99A3B" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
                  <div style={{ minWidth: 0 }}><div style={{ font: "500 12px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>{p.cat}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                  <span style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>{fmt(p.monto)}</span>
                  <div onClick={() => { const c = cats.find((x) => x._id === p.catId); if (c) openCategory(c); }} style={{ font: "600 10.5px Poppins", color: "#EF5B94", background: "#FCE7F0", padding: "6px 12px", borderRadius: 999, cursor: "pointer" }}>Ver</div>
                </div>
              </div>
            ))}
            {proximos.length === 0 && <div style={{ textAlign: "center", padding: "18px 0 8px", font: "500 12px Poppins", color: "#a0a0a8" }}>No tienes pagos pendientes 🎉</div>}
          </div>
        </div>
      )}

      {/* ══════ SHEETS (portal) ══════ */}
      {mounted && catDetail && createPortal(
        <div>
          <div onClick={() => setCatSheet(null)} style={sheetBackdrop} />
          <div className="psm-hs" style={sheetBox}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e3e3e6", margin: "0 auto 14px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{catDetail.nombre}</div>
              <div onClick={() => setCatSheet(null)} style={{ width: 30, height: 30, borderRadius: "50%", background: "#f4f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6b72", cursor: "pointer", font: "600 13px Poppins" }}>✕</div>
            </div>
            <div style={{ font: "500 11px Poppins", color: "#a0a0a8", marginBottom: 12 }}>{fmt(catDetail.coste_final || 0)} · {(catDetail.gastos_array || []).filter((g: any) => g?.estatus !== false).length} gastos</div>
            {(catDetail.gastos_array || []).filter((g: any) => g?.estatus !== false).map((r: any) => {
              const pgd = gastoEstaPagado(r);
              return (
                <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 0", borderBottom: "1px solid #f5f5f7" }}>
                  <div style={{ minWidth: 0 }}><div style={{ font: "500 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nombre}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>{fmt(gastoPagado(r))} pagado</div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                    <span style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>{fmt(r.coste_final || 0)}</span>
                    <span style={{ font: "600 9.5px Poppins", color: pgd ? "#2FB37E" : "#B4801F", background: pgd ? "#E4F5EE" : "#FBF0DA", padding: "3px 9px", borderRadius: 999 }}>{pgd ? "Pagado" : "Pendiente"}</span>
                  </div>
                </div>
              );
            })}
            {(catDetail.gastos_array || []).filter((g: any) => g?.estatus !== false).length === 0 && <div style={{ textAlign: "center", padding: "16px 0", font: "500 12px Poppins", color: "#a0a0a8" }}>Sin gastos todavía en esta categoría</div>}
            {isOwner && <button onClick={() => { setGastoForm({ catId: catDetail._id, nombre: "", coste: "" }); }} style={{ display: "block", width: "100%", marginTop: 14, height: 44, border: "none", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", cursor: "pointer", boxShadow: "0 6px 14px rgba(239,91,148,.26)" }}>＋ Añadir gasto</button>}
          </div>
        </div>, document.body)}

      {mounted && editBudgetOpen && createPortal(
        <div>
          <div onClick={() => setEditBudgetOpen(false)} style={sheetBackdrop} />
          <div style={sheetBox}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e3e3e6", margin: "0 auto 14px" }} />
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 12 }}>Editar presupuesto total</div>
            <input type="number" inputMode="decimal" autoFocus value={budgetVal} onChange={(e) => setBudgetVal(e.target.value)} placeholder="0" style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setEditBudgetOpen(false)} style={{ flex: 1, height: 44, borderRadius: 12, background: "#f4f4f6", color: "#6b6b72", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={saveBudget} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 12, background: busy ? "#f4b8d1" : "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>, document.body)}

      {mounted && addCatOpen && createPortal(
        <div>
          <div onClick={() => setAddCatOpen(false)} style={sheetBackdrop} />
          <div style={sheetBox}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e3e3e6", margin: "0 auto 14px" }} />
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 12 }}>Nueva categoría</div>
            <input autoFocus value={addCatName} onChange={(e) => setAddCatName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }} placeholder="Ej. Catering, Flores, Música…" style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setAddCatOpen(false)} style={{ flex: 1, height: 44, borderRadius: 12, background: "#f4f4f6", color: "#6b6b72", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={addCategory} disabled={busy || !addCatName.trim()} style={{ flex: 1, height: 44, borderRadius: 12, background: (busy || !addCatName.trim()) ? "#f4b8d1" : "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Crear</button>
            </div>
          </div>
        </div>, document.body)}

      {mounted && gastoForm && createPortal(
        <div>
          <div onClick={() => setGastoForm(null)} style={sheetBackdrop} />
          <div style={sheetBox}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e3e3e6", margin: "0 auto 14px" }} />
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 12 }}>Añadir gasto</div>
            <div style={{ font: "700 10px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Concepto</div>
            <input autoFocus value={gastoForm.nombre} onChange={(e) => setGastoForm((f) => f && { ...f, nombre: e.target.value })} placeholder="Ej. Menú adultos" style={inputStyle} />
            <div style={{ font: "700 10px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 6px" }}>Coste ({cur || "€"})</div>
            <input type="number" inputMode="decimal" value={gastoForm.coste} onChange={(e) => setGastoForm((f) => f && { ...f, coste: e.target.value })} placeholder="0" style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setGastoForm(null)} style={{ flex: 1, height: 44, borderRadius: 12, background: "#f4f4f6", color: "#6b6b72", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={addGasto} disabled={busy || !gastoForm.nombre.trim()} style={{ flex: 1, height: 44, borderRadius: 12, background: (busy || !gastoForm.nombre.trim()) ? "#f4b8d1" : "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Añadir</button>
            </div>
          </div>
        </div>, document.body)}

      {mounted && depOpen && createPortal(
        <div>
          <div onClick={() => setDepOpen(false)} style={sheetBackdrop} />
          <div style={sheetBox}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e3e3e6", margin: "0 auto 14px" }} />
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 12 }}>Registrar depósito</div>
            <div style={{ font: "700 10px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Monto ({cur || "€"})</div>
            <input type="number" inputMode="decimal" autoFocus value={depMonto} onChange={(e) => setDepMonto(e.target.value)} placeholder="0" style={inputStyle} />
            <div style={{ font: "700 10px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 6px" }}>Método (opcional)</div>
            <input value={depMetodo} onChange={(e) => setDepMetodo(e.target.value)} placeholder="Transferencia, efectivo…" style={inputStyle} />
            <div style={{ font: "700 10px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 6px" }}>Referencia (opcional)</div>
            <input value={depRef} onChange={(e) => setDepRef(e.target.value)} placeholder="Nº de operación…" style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setDepOpen(false)} style={{ flex: 1, height: 44, borderRadius: 12, background: "#f4f4f6", color: "#6b6b72", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={addDeposito} disabled={busy || !depMonto} style={{ flex: 1, height: 44, borderRadius: 12, background: (busy || !depMonto) ? "#f4b8d1" : "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer" }}>Registrar</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
};

export default PresupuestoStudioMovil;
