import { FC, useMemo, useRef, useState } from "react";
import { EventContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";
import ClickAwayListener from "react-click-away-listener";
import ModalAddPagoStudio from "./ModalAddPagoStudio";

const cap1 = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s || "");
const parseEs = (s: string) => { const n = parseFloat(String(s).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".")); return Number.isNaN(n) ? 0 : n; };

interface Props { categorias: any[]; onAddCategoria: () => void; }

const menuBtn: any = { display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", font: "500 12.5px Poppins", color: "#3A3A42", textAlign: "left", width: "100%" };

const PresupuestoDetalladoStudio: FC<Props> = ({ categorias, onAddCategoria }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const cur = event?.presupuesto_objeto?.currency;

  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const [pagoTarget, setPagoTarget] = useState<{ cat: string; gasto: string } | null>(null);
  const [panel, setPanel] = useState<"filtros" | "info" | "columnas" | null>(null);
  const [columnConfig, setColumnConfig] = useState<any>({ categoria: { visible: true }, gasto: { visible: true }, unidad: { visible: true }, cantidad: { visible: true }, nombre: { visible: true }, valor_unitario: { visible: true }, coste_final: { visible: true }, coste_estimado: { visible: true }, pagado: { visible: true }, pendiente_pagar: { visible: true }, options: { visible: true } });
  const toggleColumnVisibility = (key: any) => setColumnConfig((c: any) => ({ ...c, [key]: { visible: !c[key]?.visible } }));
  const EMPTY_FILTERS = { categories: [], paymentStatus: "all", visibilityStatus: "all", amountRange: { min: "", max: "" } };
  const [filters, setFilters] = useState<any>(EMPTY_FILTERS);
  const onFilterChange = (type: any, value: any) => setFilters((f: any) => ({ ...f, [type]: value }));
  const onClearFilters = () => setFilters(EMPTY_FILTERS);
  const [viewLevel, setViewLevel] = useState(3);
  const [guestMode, setGuestMode] = useState<"conf" | "est">("conf");
  const [editRow, setEditRow] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<{ nombre: string; coste_estimado: string; coste_final: string }>({ nombre: "", coste_estimado: "", coste_final: "" });
  const filRef = useRef<HTMLButtonElement>(null);
  const infRef = useRef<HTMLButtonElement>(null);
  const colRef = useRef<HTMLButtonElement>(null);
  // Ancla un panel debajo de su botón (relativo al contenedor position:relative del componente).
  const anchorPos = (ref: any, w: number, alignRight = false) => {
    const b = ref.current;
    if (!b) return { top: 48, left: 12 };
    const top = b.offsetTop + b.offsetHeight + 10;
    const left = alignRight ? Math.max(8, b.offsetLeft + b.offsetWidth - w) : Math.max(8, b.offsetLeft);
    return { top, left };
  };

  const cats = Array.isArray(categorias) ? categorias : [];
  const isOpen = (id: string) => open[id] !== false;
  // Checkbox custom (rosa garantizado, sin depender de accent-color del navegador)
  const chkBox = (on: boolean): any => ({ width: 16, height: 16, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? "#EF5B94" : "#fff", border: `1.5px solid ${on ? "#EF5B94" : "#d8d8dd"}`, color: "#fff", fontSize: 11, flex: "none" });

  // Columnas (algunas ocultables desde "Columnas")
  const ALL_COLS = [
    { key: "partida", label: t("Partida de gasto"), w: "minmax(180px,2.2fr)", always: true, align: "left" },
    { key: "unidad", label: t("Unidad"), w: "60px", align: "center" },
    { key: "cantidad", label: t("Cantidad"), w: "68px", align: "center" },
    { key: "valor", label: t("Valor unit."), w: "92px", align: "center" },
    { key: "coste", label: t("Coste total"), w: "100px", always: true, align: "center" },
    { key: "estimado", label: t("Estimado"), w: "96px", align: "center" },
    { key: "pagado", label: t("Pagado"), w: "90px", always: true, align: "center" },
    { key: "pendiente", label: t("Pendiente"), w: "100px", always: true, align: "center" },
    { key: "menu", label: "", w: "38px", always: true, align: "center" },
  ];
  const COLMAP: any = { partida: "gasto", unidad: "unidad", cantidad: "cantidad", valor: "valor_unitario", coste: "coste_final", estimado: "coste_estimado", pagado: "pagado", pendiente: "pendiente_pagar", menu: "options" };
  const visibleCols = ALL_COLS.filter((c) => columnConfig[COLMAP[c.key]]?.visible !== false);
  const gridTemplate = visibleCols.map((c) => c.w).join(" ");

  const totals = useMemo(() => {
    let tot = 0, pag = 0, est = 0, nP = 0;
    cats.forEach((c) => (c.gastos_array || []).filter((g: any) => g?.estatus !== false).forEach((g: any) => { tot += g.coste_final || 0; pag += g.pagado || 0; est += g.coste_estimado || 0; nP++; }));
    return { tot, pag, est, pen: tot - pag, nCat: cats.length, nPart: nP };
  }, [cats]);
  const tableTotals = { estimado: totals.est, total: totals.tot, pagado: totals.pag };
  const rmin = parseEs(filters.amountRange.min), rmax = parseEs(filters.amountRange.max);
  const noFilters = filters.categories.length === 0 && filters.paymentStatus === "all" && filters.visibilityStatus === "all" && !filters.amountRange.min && !filters.amountRange.max;

  const ql = q.trim().toLowerCase();
  const filtered = cats.map((c) => {
    if (filters.categories.length && !filters.categories.includes(c._id)) return { c, gastos: [] as any[] };
    const catMatch = String(c.nombre || "").toLowerCase().includes(ql);
    let gastos = (c.gastos_array || []).filter((g: any) => filters.visibilityStatus === "hidden" ? g?.estatus === false : g?.estatus !== false);
    gastos = gastos.filter((g: any) => {
      const ct = g.coste_final || 0, pag = g.pagado || 0, pen = ct - pag;
      if (filters.paymentStatus === "paid") return ct > 0 && pen <= 0;
      if (filters.paymentStatus === "pending") return pen > 0 && pag <= 0;
      if (filters.paymentStatus === "partial") return pag > 0 && pen > 0;
      return true;
    });
    gastos = gastos.filter((g: any) => { const ct = g.coste_final || 0; if (filters.amountRange.min && ct < rmin) return false; if (filters.amountRange.max && ct > rmax) return false; return true; });
    gastos = gastos.filter((g: any) => !ql || catMatch || String(g.nombre || "").toLowerCase().includes(ql));
    return { c, gastos };
  }).filter((x) => x.gastos.length > 0 || (!ql && noFilters));

  const allOpen = cats.every((c) => isOpen(c._id));
  const toggleAll = () => { const next: Record<string, boolean> = {}; cats.forEach((c) => (next[c._id] = !allOpen)); setOpen(next); };
  const applyPO = (result: any) => { const po = result?.evento?.presupuesto_objeto; if (po) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po })); };

  const addPartida = async (cat: any) => { if (!isAllowed()) { ht(); return; } try { applyPO(await fetchApiEventos({ query: queries.nuevoGasto, variables: { evento_id: event._id, categoria_id: cat._id, nombre: t("Nueva partida de gasto") } })); } catch { toast("error", t("Ha ocurrido un error")); } };
  const addItem = async (cat: any, gasto: any) => { if (!isAllowed()) { ht(); return; } try { applyPO(await fetchApiEventos({ query: queries.nuevoItemGasto, variables: { evento_id: event._id, categoria_id: cat._id, gasto_id: gasto._id, itemGasto: { nombre: t("Nuevo item"), cantidad: 1, unidad: "unidad", valor_unitario: 0, total: 0 } } })); } catch { toast("error", t("Ha ocurrido un error")); } };
  const delGasto = async (cat: any, gasto: any) => { if (!isAllowed()) { ht(); return; } try { applyPO(await fetchApiEventos({ query: queries.borrarGasto, variables: { evento_id: event._id, categoria_id: cat._id, gasto_id: gasto._id } })); toast("success", t("Partida eliminada")); } catch { toast("error", t("Ha ocurrido un error")); } };

  const startEdit = (cat: any, g: any, key: string) => { if (!isAllowed()) { ht(); return; } setMenuAt(null); setEditRow(key); setEditVals({ nombre: g.nombre || "", coste_estimado: String(g.coste_estimado || 0), coste_final: String(g.coste_final || 0) }); };
  const saveEdit = async (cat: any, g: any) => {
    try {
      const changes: [string, string][] = [];
      if (editVals.nombre.trim() && editVals.nombre.trim() !== (g.nombre || "")) changes.push(["nombre", editVals.nombre.trim()]);
      const est = parseEs(editVals.coste_estimado); if (est !== (g.coste_estimado || 0)) changes.push(["coste_estimado", String(est)]);
      const fin = parseEs(editVals.coste_final); if (fin !== (g.coste_final || 0)) changes.push(["coste_final", String(fin)]);
      let last: any = null;
      for (const [variable, valor] of changes) {
        last = await fetchApiEventos({ query: queries.editGasto, variables: { evento_id: event._id, categoria_id: cat._id, gasto_id: g._id, variable_reemplazar: variable, valor_reemplazar: valor } });
      }
      if (last) applyPO(last);
      setEditRow(null);
      if (changes.length) toast("success", t("Cambios guardados"));
    } catch { toast("error", t("Ha ocurrido un error")); }
  };

  const cellStyle = (align: string): any => ({ textAlign: align === "left" ? "left" : align, minWidth: 0 });
  const editInput: any = { width: "100%", padding: "5px 7px", borderRadius: 7, border: "1.5px solid #EF5B94", font: "500 12px Poppins", color: "#3A3A42", outline: "none", boxSizing: "border-box" };
  const filtersActive = filters.categories.length > 0 || filters.paymentStatus !== "all";

  // Info evento
  const confAdults = (Array.isArray(event?.invitados_array) ? event.invitados_array : []).filter((i: any) => !i.edad || i.edad >= 18 || i.tipo === "adulto").length;
  const confChildren = (Array.isArray(event?.invitados_array) ? event.invitados_array : []).filter((i: any) => (i.edad && i.edad < 18) || i.tipo === "niño").length;
  const estAdults = event?.presupuesto_objeto?.totalStimatedGuests?.adults || 0;
  const estChildren = event?.presupuesto_objeto?.totalStimatedGuests?.children || 0;
  const guests = guestMode === "conf"
    ? { n: confAdults + confChildren, ad: confAdults, kid: confChildren, label: t("Invitados confirmados") }
    : { n: estAdults + estChildren, ad: estAdults, kid: estChildren, label: t("Invitados estimados") };
  const pct = totals.tot > 0 ? Math.round((totals.pag / totals.tot) * 100) : 0;
  const totalGastos = cats.reduce((a, c) => a + ((c.gastos_array?.length) || 0), 0);
  const COLUMNAS = [
    { k: "gasto", l: t("Partida de gasto") }, { k: "unidad", l: t("Unidad") }, { k: "cantidad", l: t("Cantidad") },
    { k: "valor_unitario", l: t("Valor unitario") }, { k: "coste_final", l: t("Coste total") }, { k: "coste_estimado", l: t("Coste estimado") },
    { k: "pagado", l: t("Pagado") }, { k: "pendiente_pagar", l: t("Pendiente") }, { k: "options", l: t("Acciones") },
  ];

  return (
    <div style={{ position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .pd-tool:hover{color:#EF5B94!important;}
        .pd-row:hover{background:#faf9fb;}
        .pd-ghead:hover{background:#f4f3f6!important;}
        .pd-dots:hover{background:#faf9fb!important;color:#6b6b72!important;}
        .pd-menu button:hover{background:#FCE7F0;color:#D83E7C;}
        .pd-menu .pd-del:hover{background:#FBE4EF;}
        .pd-collapse:hover{color:#EF5B94!important;background:#faf9fb!important;}
        .pd-scrollx{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
        .pd-scrollx::-webkit-scrollbar{display:none;}
        .pd-pop label:hover{background:#faf9fb;}
        .pd-search:focus,.pd-search:focus-visible{outline:none!important;box-shadow:none!important;border:none!important;}
        .pd-fsel:focus,.pd-fin:focus{border-color:#EF5B94!important;}
        .pd-cat:hover{background:#faf9fb;}
        .pd-limpiar:hover{color:#D83E7C!important;}
        .pd-x:hover{background:#faf9fb!important;color:#3A3A42!important;}
      `}} />

      {pagoTarget && <ModalAddPagoStudio categoriaId={pagoTarget.cat} gastoId={pagoTarget.gasto} onClose={() => setPagoTarget(null)} />}

      <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", overflow: "hidden", fontFamily: "'Poppins',sans-serif" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid #f2f2f4", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 1 250px", minWidth: 150, maxWidth: 250, border: "1px solid #E7E7EA", borderRadius: 999, padding: "5px 13px", color: "#a0a0a8" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b3b3ba" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input className="pd-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar…") as string} style={{ border: "none", background: "none", flex: 1, minWidth: 0, font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />
          </div>

          <button ref={filRef} className="pd-tool" onClick={() => setPanel(panel === "filtros" ? null : "filtros")} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12.5px Poppins", color: filtersActive ? "#EF5B94" : "#6b6b72", cursor: "pointer", background: "none", border: "none", padding: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>{t("Filtros")}</button>
          <button ref={infRef} className="pd-tool" onClick={() => setPanel(panel === "info" ? null : "info")} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12.5px Poppins", color: panel === "info" ? "#EF5B94" : "#6b6b72", cursor: "pointer", background: "none", border: "none", padding: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h0" /></svg>{t("Info evento")}</button>
          <button ref={colRef} className="pd-tool" onClick={() => setPanel(panel === "columnas" ? null : "columnas")} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12.5px Poppins", color: panel === "columnas" ? "#EF5B94" : "#6b6b72", cursor: "pointer", background: "none", border: "none", padding: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 4v16M14 4v16" /></svg>{t("Columnas")}</button>

          <div style={{ display: "flex", alignItems: "center", gap: 28, marginLeft: "auto" }}>
            <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><div style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>{t("Total")}</div><div style={{ font: "700 13px Poppins", color: "#3A3A42" }}>{getCurrency(totals.tot, cur)}</div></div>
            <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><div style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>{t("Pagado")}</div><div style={{ font: "700 13px Poppins", color: "#2FB37E" }}>{getCurrency(totals.pag, cur)}</div></div>
            <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><div style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>{t("Pendiente")}</div><div style={{ font: "700 13px Poppins", color: "#D83E7C" }}>{getCurrency(totals.pen, cur)}</div></div>
          </div>
        </div>

        {/* Contraer / expandir todo */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 22px", borderBottom: "1px solid #f2f2f4" }}>
          <button className="pd-collapse" onClick={toggleAll} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", font: "600 12px Poppins", color: "#8a8a90", padding: "4px 8px", borderRadius: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 8l5-5 5 5M7 16l5 5 5-5" /></svg>
            {allOpen ? t("Contraer todo") : t("Expandir todo")}
          </button>
        </div>

        {/* Tabla */}
        <div className="pd-scrollx">
          <div style={{ minWidth: 820 }}>
            <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 8, padding: "14px 20px 14px 22px", background: "#faf9fb", borderBottom: "1px solid #f2f2f4", font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".5px", textTransform: "uppercase" }}>
              {visibleCols.map((c) => <div key={c.key} style={{ textAlign: c.align === "left" ? "left" : c.align } as any}>{c.label}</div>)}
            </div>

            {filtered.length === 0 && <div style={{ padding: "34px 22px", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>{t("Sin resultados")}</div>}

            {filtered.map(({ c, gastos }) => {
              const tot = gastos.reduce((a: number, g: any) => a + (g.coste_final || 0), 0);
              const abierto = isOpen(c._id);
              return (
                <div key={c._id}>
                  <div className="pd-ghead" onClick={() => setOpen((o) => ({ ...o, [c._id]: !abierto }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 22px", background: "#faf9fb", borderBottom: "1px solid #f6f6f8", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: abierto ? "none" : "rotate(-90deg)", transition: "transform .15s" }}><path d="M6 9l6 6 6-6" /></svg>
                    <span style={{ font: "500 14px Poppins", color: "#5a5a62" }}>{cap1(c.nombre)}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "#ecebef", color: "#6b6b72", font: "700 11px Poppins" }}>{gastos.length}</span>
                    <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "baseline", gap: 7, whiteSpace: "nowrap" }}><span style={{ font: "500 10.5px Poppins", color: "#a0a0a8", textTransform: "uppercase", letterSpacing: ".4px" }}>{t("Coste total")}</span><span style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{getCurrency(tot, cur)}</span></span>
                  </div>
                  {abierto && gastos.map((g: any) => {
                    const it = (g.items_array || [])[0];
                    const ct = g.coste_final || 0, pag = g.pagado || 0, pen = ct - pag;
                    const key = c._id + "|" + g._id;
                    const editing = editRow === key;
                    const render: Record<string, any> = {
                      partida: editing
                        ? <input autoFocus value={editVals.nombre} onChange={(e) => setEditVals((v) => ({ ...v, nombre: e.target.value }))} style={editInput} />
                        : <div style={{ font: "600 13.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={g.nombre}>{g.nombre}</div>,
                      unidad: <span style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{it?.unidad || "—"}</span>,
                      cantidad: <span style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{it?.cantidad ?? "—"}</span>,
                      valor: <span style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{it ? getCurrency(it.valor_unitario || 0, cur) : "—"}</span>,
                      coste: editing
                        ? <input value={editVals.coste_final} onChange={(e) => setEditVals((v) => ({ ...v, coste_final: e.target.value }))} style={{ ...editInput, textAlign: "right" }} />
                        : <span style={{ font: "700 12.5px Poppins", color: "#3A3A42" }}>{getCurrency(ct, cur)}</span>,
                      estimado: editing
                        ? <input value={editVals.coste_estimado} onChange={(e) => setEditVals((v) => ({ ...v, coste_estimado: e.target.value }))} style={{ ...editInput, textAlign: "right" }} />
                        : <span style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{getCurrency(g.coste_estimado || 0, cur)}</span>,
                      pagado: <span style={{ font: "600 12.5px Poppins", color: "#2FB37E" }}>{getCurrency(pag, cur)}</span>,
                      pendiente: <span style={{ font: "700 12.5px Poppins", color: pen > 0 ? "#D83E7C" : "#8a8a90" }}>{getCurrency(pen, cur)}</span>,
                      menu: editing ? (
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button title={t("Guardar")} onClick={() => saveEdit(c, g)} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#2FB37E", background: "none", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></button>
                          <button title={t("Cancelar")} onClick={() => setEditRow(null)} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
                          <button className="pd-dots" onClick={(e) => { e.stopPropagation(); setMenuAt(menuAt === key ? null : key); }} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c8c8ce", background: "none", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg></button>
                          {menuAt === key && (
                            <ClickAwayListener onClickAway={() => setMenuAt(null)}>
                              <div className="pd-menu" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: -8, right: "calc(100% + 6px)", zIndex: 45, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, boxShadow: "0 14px 36px rgba(0,0,0,.16)", padding: 14, width: 210, textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                  <span style={{ font: "700 13px Poppins", color: "#3A3A42", whiteSpace: "nowrap" }}>{t("Opciones disponibles")}</span>
                                  <button onClick={() => setMenuAt(null)} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer", padding: 0 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                                </div>
                                <button style={menuBtn} onClick={() => startEdit(c, g, key)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>{t("Editar")}</button>
                                <div style={{ height: 1, background: "#f2f2f4", margin: "8px 0" }} />
                                <div style={{ font: "600 11px Poppins", color: "#a0a0a8", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{t("Agregar")}</div>
                                <button style={menuBtn} onClick={() => { setMenuAt(null); onAddCategoria(); }}>{t("Categoría")}</button>
                                <button style={menuBtn} onClick={() => { setMenuAt(null); addPartida(c); }}>{t("Partida")}</button>
                                <button style={menuBtn} onClick={() => { setMenuAt(null); addItem(c, g); }}>{t("Item")}</button>
                                <div style={{ height: 1, background: "#f2f2f4", margin: "8px 0" }} />
                                <button style={menuBtn} onClick={() => { setMenuAt(null); if (!isAllowed()) { ht(); return; } setPagoTarget({ cat: c._id, gasto: g._id }); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>{t("Relacionar pago")}</button>
                                <button className="pd-del" style={{ ...menuBtn, color: "#D83E7C" }} onClick={() => { setMenuAt(null); delGasto(c, g); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>{t("Borrar")}</button>
                              </div>
                            </ClickAwayListener>
                          )}
                        </div>
                      ),
                    };
                    return (
                      <div key={g._id} className="pd-row" style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 8, alignItems: "center", padding: "11px 20px 11px 22px", borderBottom: "1px solid #f4f4f6" }}>
                        {visibleCols.map((col) => <div key={col.key} style={cellStyle(col.align)}>{render[col.key]}</div>)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modales (fuera del overflow del card; se posicionan absolute top-12 left-3) */}
      {panel === "filtros" && (() => {
        const selFsel: any = { width: "100%", padding: "9px 12px", border: "1.5px solid #E7E7EA", borderRadius: 10, font: "500 12.5px Poppins", color: "#3A3A42", background: "#fff", outline: "none" };
        const helpTxt: any = { font: "500 11px Poppins", color: "#a0a0a8", marginTop: 5 };
        const lblTxt: any = { font: "600 13px Poppins", color: "#3A3A42", marginBottom: 7 };
        const allChecked = cats.length > 0 && filters.categories.length === cats.length;
        return (
          <div style={{ position: "absolute", ...anchorPos(filRef, 320), zIndex: 50, width: 320, background: "#fff", border: "1px solid #ececef", borderRadius: 16, boxShadow: "0 16px 40px rgba(0,0,0,.14)", overflow: "hidden", fontFamily: "'Poppins',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #f2f2f4" }}>
              <div style={{ font: "700 15px Poppins", color: "#3A3A42", flex: 1 }}>{t("Filtros")}</div>
              <button className="pd-limpiar" onClick={() => { onClearFilters(); setViewLevel(3); }} style={{ font: "600 12.5px Poppins", color: "#EF5B94", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>{t("Limpiar")}</button>
              <button className="pd-x" onClick={() => setPanel(null)} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            </div>
            <div className="pd-scrollx" style={{ maxHeight: 420, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Vista de detalle */}
              <div>
                <div style={lblTxt}>{t("Vista de detalle")}</div>
                <select className="pd-fsel" value={viewLevel} onChange={(e) => setViewLevel(Number(e.target.value))} style={selFsel}>
                  <option value={3}>{t("Detalle completo")}</option><option value={1}>{t("Solo categorías")}</option><option value={2}>{t("Categorías y gastos")}</option>
                </select>
                <div style={helpTxt}>{viewLevel === 1 ? t("Mostrar únicamente las categorías principales") : viewLevel === 2 ? t("Mostrar categorías y sus gastos asociados") : t("Mostrar todos los elementos: categorías, gastos e ítems")}</div>
              </div>
              {/* Filtrar por categorías */}
              <div>
                <div style={lblTxt}>{t("Filtrar por categorías")} ({filters.categories.length} {t("seleccionadas")})</div>
                <div className="pd-scrollx" style={{ border: "1.5px solid #E7E7EA", borderRadius: 10, maxHeight: 150, overflowY: "auto" }}>
                  <label onClick={() => onFilterChange("categories", allChecked ? [] : cats.map((c) => c._id))} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderBottom: "1px solid #f4f4f6", cursor: "pointer", font: "600 12.5px Poppins", color: "#EF5B94" }}>
                    <span style={chkBox(allChecked)}>{allChecked ? "✓" : ""}</span>{t("Seleccionar todas")}
                  </label>
                  {cats.map((c) => {
                    const checked = filters.categories.includes(c._id);
                    return (
                      <label key={c._id} className="pd-cat" onClick={() => onFilterChange("categories", checked ? filters.categories.filter((id: string) => id !== c._id) : [...filters.categories, c._id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderBottom: "1px solid #f8f8fa", cursor: "pointer", font: "500 12.5px Poppins", color: "#6b6b72" }}>
                        <span style={chkBox(checked)}>{checked ? "✓" : ""}</span>{cap1(c.nombre)}
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Estado de pago */}
              <div>
                <div style={lblTxt}>{t("Estado de pago")}</div>
                <select className="pd-fsel" value={filters.paymentStatus} onChange={(e) => onFilterChange("paymentStatus", e.target.value)} style={selFsel}>
                  <option value="all">{t("Todos los estados")}</option><option value="paid">{t("Pagado")}</option><option value="pending">{t("Pendiente")}</option><option value="partial">{t("Pago parcial")}</option>
                </select>
                <div style={helpTxt}>{t("Mostrar elementos con cualquier estado de pago")}</div>
              </div>
              {/* Estado de visibilidad */}
              <div>
                <div style={lblTxt}>{t("Estado de visibilidad")}</div>
                <select className="pd-fsel" value={filters.visibilityStatus} onChange={(e) => onFilterChange("visibilityStatus", e.target.value)} style={selFsel}>
                  <option value="all">{t("Todos (visibles y ocultos)")}</option><option value="visible">{t("Solo visibles")}</option><option value="hidden">{t("Solo ocultos")}</option>
                </select>
                <div style={helpTxt}>{t("Mostrar todos los elementos sin filtrar por visibilidad")}</div>
              </div>
              {/* Rango de montos */}
              <div>
                <div style={lblTxt}>{t("Rango de montos (coste total)")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input className="pd-fin" type="text" value={filters.amountRange.min} onChange={(e) => onFilterChange("amountRange", { ...filters.amountRange, min: e.target.value })} placeholder={t("Mínimo") as string} style={{ flex: 1, minWidth: 0, padding: "9px 12px", border: "1.5px solid #E7E7EA", borderRadius: 10, font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />
                  <span style={{ font: "500 12px Poppins", color: "#a0a0a8" }}>{t("a")}</span>
                  <input className="pd-fin" type="text" value={filters.amountRange.max} onChange={(e) => onFilterChange("amountRange", { ...filters.amountRange, max: e.target.value })} placeholder={t("Máximo") as string} style={{ flex: 1, minWidth: 0, padding: "9px 12px", border: "1.5px solid #E7E7EA", borderRadius: 10, font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />
                </div>
                <div style={helpTxt}>{t("Ingresa valores para filtrar por rango de montos")}</div>
              </div>
            </div>
          </div>
        );
      })()}
      {panel === "info" && (
        <div style={{ position: "absolute", ...anchorPos(infRef, 340), zIndex: 50, width: 340, background: "#fff", border: "1px solid #ececef", borderRadius: 16, boxShadow: "0 16px 40px rgba(0,0,0,.14)", overflow: "hidden", fontFamily: "'Poppins',sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #f2f2f4" }}>
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", flex: 1 }}>{t("Información del evento")}</div>
            <button className="pd-x" onClick={() => setPanel(null)} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Resumen de invitados */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
                <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{t("Resumen de invitados")}</div>
                <div style={{ display: "flex", background: "#faf9fb", border: "1px solid #ececef", borderRadius: 10, padding: 3 }}>
                  {[{ k: "conf", l: t("Confirmados") }, { k: "est", l: t("Estimados") }].map((m) => {
                    const on = guestMode === m.k;
                    return <button key={m.k} onClick={() => setGuestMode(m.k as any)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", font: "600 11.5px Poppins", background: on ? "#fff" : "transparent", color: on ? "#EF5B94" : "#8a8a90", boxShadow: on ? "0 2px 6px rgba(0,0,0,.08)" : "none" }}>{m.l}</button>;
                  })}
                </div>
              </div>
              <div style={{ border: "1.5px solid #ececef", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ font: "700 26px Poppins", color: "#EF5B94" }}>{guests.n}</div>
                <div style={{ font: "700 10px Poppins", color: "#8a8a90", letterSpacing: ".8px", textTransform: "uppercase", marginTop: 2 }}>{guests.label}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 34, marginTop: 12 }}>
                  <div><div style={{ font: "600 16px Poppins", color: "#3A3A42" }}>{guests.ad}</div><div style={{ font: "500 11px Poppins", color: "#a0a0a8" }}>{t("Adultos")}</div></div>
                  <div style={{ width: 1, background: "#ececef" }} />
                  <div><div style={{ font: "600 16px Poppins", color: "#3A3A42" }}>{guests.kid}</div><div style={{ font: "500 11px Poppins", color: "#a0a0a8" }}>{t("Niños")}</div></div>
                </div>
              </div>
            </div>
            {/* Detalles del evento */}
            <div>
              <div style={{ font: "600 13px Poppins", color: "#3A3A42", marginBottom: 8 }}>{t("Detalles del evento")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, font: "500 12.5px Poppins" }}>
                {[
                  { l: t("Nombre"), v: event?.nombre || "—" },
                  { l: t("Moneda"), v: (cur || "eur").toUpperCase() },
                  { l: t("Categorías"), v: String(cats.length) },
                  { l: t("Total gastos"), v: String(totalGastos) },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#a0a0a8" }}>{r.l}</span><span style={{ color: "#3A3A42", fontWeight: 600 }}>{r.v}</span></div>
                ))}
              </div>
            </div>
            {/* Progreso del presupuesto */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{t("Progreso del presupuesto")}</div>
                <div style={{ font: "700 13px Poppins", color: "#3A3A42" }}>{pct}%</div>
              </div>
              <div style={{ height: 8, borderRadius: 8, background: "#f0f0f2", overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: "#EF5B94", borderRadius: 8 }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, font: "600 11.5px Poppins" }}>
                <span style={{ color: "#2FB37E" }}>{t("Pagado")}: {getCurrency(totals.pag, cur)}</span>
                <span style={{ color: "#D83E7C" }}>{t("Pendiente")}: {getCurrency(totals.pen, cur)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {panel === "columnas" && (() => {
        const allChecked = COLUMNAS.every((c) => columnConfig[c.k]?.visible !== false);
        return (
          <div style={{ position: "absolute", ...anchorPos(colRef, 280, true), zIndex: 50, width: 280, background: "#fff", border: "1px solid #ececef", borderRadius: 16, boxShadow: "0 16px 40px rgba(0,0,0,.14)", overflow: "hidden", fontFamily: "'Poppins',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #f2f2f4" }}>
              <div style={{ font: "700 15px Poppins", color: "#3A3A42", flex: 1 }}>{t("Columnas")}</div>
              <button className="pd-x" onClick={() => setPanel(null)} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            </div>
            <label className="pd-cat" onClick={() => setColumnConfig((cc: any) => { const next = { ...cc }; COLUMNAS.forEach((c) => (next[c.k] = { visible: !allChecked })); return next; })} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 18px", borderBottom: "1px solid #f2f2f4", cursor: "pointer", font: "600 13px Poppins", color: "#3A3A42" }}>
              <span style={chkBox(allChecked)}>{allChecked ? "✓" : ""}</span>{t("Seleccionar todo")}
            </label>
            <div className="pd-scrollx" style={{ maxHeight: 400, overflowY: "auto", padding: "4px 0" }}>
              {COLUMNAS.map((c) => {
                const vis = columnConfig[c.k]?.visible !== false;
                return (
                  <label key={c.k} className="pd-cat" onClick={() => toggleColumnVisibility(c.k)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 18px", cursor: "pointer", font: "500 12.5px Poppins", color: "#3A3A42" }}>
                    <span style={chkBox(vis)}>{vis ? "✓" : ""}</span>{c.l}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PresupuestoDetalladoStudio;
