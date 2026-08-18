import { FC, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

interface Props {
  categorias: any[];
  onAddCategoria: () => void;
  focusCatId?: string | null;              // categoría a enfocar tras "Editar en Gastos"
  onFocusHandled?: () => void;             // aviso al padre de que ya consumimos el foco
}

const menuBtn: any = { display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", font: "500 12.5px Poppins", color: "#3A3A42", textAlign: "left", width: "100%" };

const PresupuestoDetalladoStudio: FC<Props> = ({ categorias, onAddCategoria, focusCatId, onFocusHandled }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const cur = event?.presupuesto_objeto?.currency;

  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const [pagoTarget, setPagoTarget] = useState<{ cat: string; gasto: string; pago?: any } | null>(null);
  const [payOpen, setPayOpen] = useState<Record<string, boolean>>({}); // partidas con panel de pagos desplegado
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
  const [wide, setWide] = useState(false);       // "Expandir": ensancha la tabla a casi todo el viewport
  const [hintOff, setHintOff] = useState(false); // pastilla "Haz clic en cualquier celda…" (se cierra o tras 1ª edición)
  const [highlight, setHighlight] = useState<string | null>(null);            // barra rosa 4s tras "Editar en Gastos"
  const [catEdit, setCatEdit] = useState<{ id: string; name: string } | null>(null); // rename inline de categoría
  const [catMenuAt, setCatMenuAt] = useState<string | null>(null);            // menú ⋮ de categoría abierto
  const [itemEdit, setItemEdit] = useState<{ key: string; field: "unidad" | "cantidad" | "valor"; val: string } | null>(null); // edición por celda de item
  const [mounted, setMounted] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ kind: "cat" | "gasto" | "pago"; c: any; g?: any; p?: any } | null>(null); // modal "¿Borrar…?"
  const [undo, setUndo] = useState<{ kind: "cat" | "gasto" | "pago"; c: any; g?: any; p?: any; label: string } | null>(null); // toast deshacer
  const undoRef = useRef<any>(null);
  const undoTimer = useRef<any>(null);
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
    { key: "estimado", label: t("Estimado"), w: "96px", align: "center" },
    { key: "coste", label: t("Coste real", { defaultValue: "Coste real" }), w: "100px", always: true, align: "center" },
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

  // Oculta de la vista la categoría/partida en borrado-diferido mientras el toast "Deshacer" está activo.
  const filteredVis = filtered
    .filter((x) => !(undo?.kind === "cat" && undo.c?._id === x.c._id))
    .map((x) => (undo?.kind === "gasto" && undo.c?._id === x.c._id) ? { ...x, gastos: x.gastos.filter((g: any) => g._id !== undo.g?._id) } : x);

  const allOpen = cats.every((c) => isOpen(c._id));
  const toggleAll = () => { const next: Record<string, boolean> = {}; cats.forEach((c) => (next[c._id] = !allOpen)); setOpen(next); };
  const applyPO = (result: any) => { const po = result?.evento?.presupuesto_objeto; if (po) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po })); };

  // "Editar en Gastos": aterrizar con SOLO esa categoría abierta y su fila resaltada 4s.
  useEffect(() => {
    if (!focusCatId) return;
    const next: Record<string, boolean> = {};
    cats.forEach((c) => (next[c._id] = c._id === focusCatId));
    setOpen(next);
    setHighlight(focusCatId);
    onFocusHandled?.();
    const tmr = setTimeout(() => setHighlight(null), 4000);
    return () => clearTimeout(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCatId]);

  const saveCatName = async (cat: any) => {
    const name = (catEdit?.name || "").trim();
    setCatEdit(null);
    if (!name || name === (cat.nombre || "")) return;
    try { applyPO(await fetchApiEventos({ query: queries.editCategoria, variables: { evento_id: event._id, categoria_id: cat._id, updates: { nombre: name } } })); setHintOff(true); toast("success", t("Categoría actualizada")); }
    catch { toast("error", t("Ha ocurrido un error")); }
  };

  // Edición inline de item (unidad/cantidad/valor). El backend recalcula coste_final y devuelve el
  // presupuesto_objeto, así que NO recalculamos a mano. Regla de negocio (idéntica a ExcelView):
  // 'xUni.' = cantidad manual; el resto se deriva del nº de invitados estimados.
  const UNIDADES = ["xUni.", "xNiños.", "xAdultos.", "xInvitados."];
  const stGuests = event?.presupuesto_objeto?.totalStimatedGuests || {};
  const effCantidad = (it: any) => !it ? undefined : it.unidad === "xUni." ? it.cantidad : it.unidad === "xNiños." ? (stGuests.children || 0) : it.unidad === "xAdultos." ? (stGuests.adults || 0) : ((stGuests.children || 0) + (stGuests.adults || 0));
  const saveItem = async (c: any, g: any, it: any, field: "unidad" | "cantidad" | "valor") => {
    const raw = itemEdit?.val ?? "";
    setItemEdit(null);
    if (!it?._id) return;
    const variable = field === "valor" ? "valor_unitario" : field;
    const valor: any = field === "unidad" ? raw : parseEs(raw);
    const current = field === "valor" ? (it.valor_unitario || 0) : field === "cantidad" ? (it.cantidad || 0) : (it.unidad || "");
    if (String(valor) === String(current)) return;
    try { applyPO(await fetchApiEventos({ query: queries.editItemGasto, variables: { evento_id: event._id, categoria_id: c._id, gasto_id: g._id, itemGasto_id: it._id, variable, valor } })); setHintOff(true); toast("success", t("Cambios guardados")); }
    catch { toast("error", t("Ha ocurrido un error")); }
  };

  // Borrado diferido con "Deshacer": ocultamos la entidad ~6s y solo entonces confirmamos en backend.
  // borrarGasto devuelve presupuesto_objeto (applyPO); borraCategoria NO → filtramos local (igual que el padre).
  const commitDelete = async (target: any) => {
    if (!target) return;
    try {
      if (target.kind === "gasto") {
        applyPO(await fetchApiEventos({ query: queries.borrarGasto, variables: { evento_id: event._id, categoria_id: target.c._id, gasto_id: target.g._id } }));
      } else if (target.kind === "pago") {
        applyPO(await fetchApiEventos({ query: queries.deletepayment, variables: { evento_id: event._id, categoria_id: target.c._id, gasto_id: target.g._id, pago_id: target.p._id } }));
      } else {
        await fetchApiEventos({ query: queries.borraCategoria, variables: { evento_id: event._id, categoria_id: target.c._id } });
        setEvent((prev: any) => ({ ...prev, presupuesto_objeto: { ...prev.presupuesto_objeto, categorias_array: (prev.presupuesto_objeto?.categorias_array || []).filter((x: any) => x._id !== target.c._id) } }));
      }
    } catch { toast("error", t("Ha ocurrido un error")); }
  };
  const flushUndo = () => { if (undoTimer.current) { clearTimeout(undoTimer.current); undoTimer.current = null; } const prev = undoRef.current; undoRef.current = null; setUndo(null); if (prev) commitDelete(prev); };
  const startDelete = (target: { kind: "cat" | "gasto" | "pago"; c: any; g?: any; p?: any }) => {
    flushUndo(); // si había otro borrado en cola, confírmalo antes de encolar el nuevo
    const label = target.kind === "cat" ? `${t("Categoría")} "${cap1(target.c?.nombre)}" ${t("borrada", { defaultValue: "borrada" })}`
      : target.kind === "pago" ? t("Pago borrado", { defaultValue: "Pago borrado" }) as string
      : `${t("Partida")} "${target.g?.nombre}" ${t("borrada", { defaultValue: "borrada" })}`;
    const u = { ...target, label };
    undoRef.current = u; setUndo(u);
    undoTimer.current = setTimeout(() => { undoRef.current = null; setUndo(null); commitDelete(u); }, 6000);
  };
  const undoDelete = () => { if (undoTimer.current) { clearTimeout(undoTimer.current); undoTimer.current = null; } undoRef.current = null; setUndo(null); };

  // "Agregar partida" (menú categoría): crea la partida, abre la categoría y enfoca su nombre para editar.
  const addPartidaFocus = async (cat: any) => {
    if (!isAllowed()) { ht(); return; }
    try {
      const res: any = await fetchApiEventos({ query: queries.nuevoGasto, variables: { evento_id: event._id, categoria_id: cat._id, nombre: t("Nueva partida de gasto") } });
      applyPO(res);
      const po = res?.evento?.presupuesto_objeto;
      const newCat = (po?.categorias_array || []).find((x: any) => x._id === cat._id);
      const list = (newCat?.gastos_array || []).filter((g: any) => g?.estatus !== false);
      const ng = list[list.length - 1];
      setOpen((o) => ({ ...o, [cat._id]: true }));
      if (ng?._id) startEdit(cat, ng, cat._id + "|" + ng._id);
    } catch { toast("error", t("Ha ocurrido un error")); }
  };

  useEffect(() => { setMounted(true); return () => { if (undoTimer.current) clearTimeout(undoTimer.current); if (undoRef.current) commitDelete(undoRef.current); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPartida = async (cat: any) => { if (!isAllowed()) { ht(); return; } try { applyPO(await fetchApiEventos({ query: queries.nuevoGasto, variables: { evento_id: event._id, categoria_id: cat._id, nombre: t("Nueva partida de gasto") } })); } catch { toast("error", t("Ha ocurrido un error")); } };

  const startEdit = (cat: any, g: any, key: string) => { if (!isAllowed()) { ht(); return; } setHintOff(true); setMenuAt(null); setEditRow(key); setEditVals({ nombre: g.nombre || "", coste_estimado: String(g.coste_estimado || 0), coste_final: String(g.coste_final || 0) }); };
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
    <div style={{ position: "relative", transition: "margin .3s ease, width .3s ease", ...(wide ? { width: "94vw", marginLeft: "calc(-47vw + 50%)" } : {}) }}>
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
        .pd-addpartida:hover{background:#FCE7F0!important;}
      `}} />

      {pagoTarget && <ModalAddPagoStudio categoriaId={pagoTarget.cat} gastoId={pagoTarget.gasto} pago={pagoTarget.pago} onClose={() => setPagoTarget(null)} />}

      <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", overflow: "hidden", fontFamily: "'Poppins',sans-serif" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid #f2f2f4", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 1 250px", minWidth: 150, maxWidth: 250, border: "1px solid #E7E7EA", borderRadius: 999, padding: "5px 13px", color: "#a0a0a8" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b3b3ba" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input className="pd-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar…") as string} style={{ border: "none", background: "none", flex: 1, minWidth: 0, font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />
          </div>

          <button ref={filRef} className="pd-tool" onClick={() => setPanel(panel === "filtros" ? null : "filtros")} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12.5px Poppins", color: filtersActive ? "#EF5B94" : "#6b6b72", cursor: "pointer", background: "none", border: "none", padding: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>{t("category", { defaultValue: "Categorías" })}</button>
          <div style={{ width: 1, height: 20, background: "#ececef", flex: "none" }} />

          <button ref={colRef} className="pd-tool" onClick={() => setPanel(panel === "columnas" ? null : "columnas")} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12.5px Poppins", color: panel === "columnas" ? "#EF5B94" : "#6b6b72", cursor: "pointer", background: "none", border: "none", padding: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 4v16M14 4v16" /></svg>{t("Columnas")}</button>
          <button className="pd-tool" onClick={() => setWide((w) => !w)} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12.5px Poppins", color: wide ? "#EF5B94" : "#6b6b72", cursor: "pointer", background: "none", border: "none", padding: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{wide ? <path d="M9 9L4 4M4 4v4M4 4h4M15 9l5-5M20 4v4M20 4h-4M9 15l-5 5M4 20v-4M4 20h4M15 15l5 5M20 20v-4M20 20h-4" /> : <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />}</svg>{wide ? t("Contraer", { defaultValue: "Contraer" }) : t("Expandir", { defaultValue: "Expandir" })}</button>
          <button ref={infRef} className="pd-tool" onClick={() => setPanel(panel === "info" ? null : "info")} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12.5px Poppins", color: panel === "info" ? "#EF5B94" : "#6b6b72", cursor: "pointer", background: "none", border: "none", padding: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h0" /></svg>{t("Info evento")}</button>

          <button onClick={() => { if (!isAllowed()) { ht(); return; } onAddCategoria(); }} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, background: "#EF5B94", color: "#fff", border: "none", borderRadius: 12, padding: "9px 16px", font: "600 12.5px Poppins", cursor: "pointer", whiteSpace: "nowrap" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Nueva categoría", { defaultValue: "Nueva categoría" })}</button>
        </div>

        {/* Fila 2: pills de filtro de pago + totales (al filtrar por Pagado/Pendiente se ocultan los totales no aplicables) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "10px 20px", borderBottom: "1px solid #f2f2f4", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", gap: 4, background: "#f4f3f6", borderRadius: 999, padding: 3 }}>
            {[{ k: "all", l: t("Todo", { defaultValue: "Todo" }) }, { k: "paid", l: t("Pagado") }, { k: "pending", l: t("Pendiente") }].map((p) => {
              const on = filters.paymentStatus === p.k;
              return <button key={p.k} onClick={() => onFilterChange("paymentStatus", p.k)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 15px", font: "600 12px Poppins", background: on ? "#fff" : "transparent", color: on ? (p.k === "paid" ? "#2FB37E" : p.k === "pending" ? "#B4801F" : "#6b6b72") : "#8a8a90", boxShadow: on ? "0 1px 3px rgba(0,0,0,.09)" : "none" }}>{p.l}</button>;
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><div style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>{t("Total")}</div><div style={{ font: "700 13px Poppins", color: "#3A3A42" }}>{getCurrency(totals.tot, cur)}</div></div>
            {filters.paymentStatus !== "pending" && <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><div style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>{t("Pagado")}</div><div style={{ font: "700 13px Poppins", color: "#2FB37E" }}>{getCurrency(totals.pag, cur)}</div></div>}
            {filters.paymentStatus !== "paid" && <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><div style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>{t("Pendiente")}</div><div style={{ font: "700 13px Poppins", color: "#B4801F" }}>{getCurrency(totals.pen, cur)}</div></div>}
          </div>
        </div>

        {/* Fila 3: pastilla-hint de edición (se cierra o desaparece tras la 1ª edición) + expandir/contraer todo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 20px", borderBottom: "1px solid #f2f2f4", flexWrap: "wrap" }}>
          {!hintOff ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FCE7F0", border: "1px solid #F6C6DC", borderRadius: 999, padding: "6px 8px 6px 14px", font: "500 11.5px Poppins", color: "#D83E7C" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
              {t("Haz clic en cualquier celda para editarla", { defaultValue: "Haz clic en cualquier celda para editarla" })}
              <button onClick={() => setHintOff(true)} title={t("Cerrar", { defaultValue: "Cerrar" }) as string} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, background: "none", border: "none", color: "#D83E7C", cursor: "pointer" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
            </div>
          ) : <span />}
          <button className="pd-collapse" onClick={toggleAll} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", font: "600 12px Poppins", color: "#8a8a90", padding: "4px 8px", borderRadius: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 8l5-5 5 5M7 16l5 5 5-5" /></svg>
            {allOpen ? t("Contraer todo") : t("Expandir todo")}
          </button>
        </div>

        {/* Tabla */}
        <div className="pd-scrollx">
          <div style={{ minWidth: 820 }}>
            <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 8, padding: "14px 20px 14px 22px", background: "#faf9fb", borderBottom: "1px solid #f2f2f4", font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".5px", textTransform: "uppercase" }}>
              {visibleCols.map((c) => <div key={c.key} style={{ textAlign: c.align === "left" ? "left" : c.align, display: "flex", alignItems: "center", gap: 4, justifyContent: c.align === "left" ? "flex-start" : c.align === "center" ? "center" : "flex-end" } as any}>{c.label}{c.key === "estimado" && <span title={t("Lo que planeabas gastar en esta partida.", { defaultValue: "Lo que planeabas gastar en esta partida." }) as string} style={{ display: "inline-flex", cursor: "help", color: "#b3b3ba" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h0" /></svg></span>}</div>)}
            </div>

            {filteredVis.length === 0 && <div style={{ padding: "34px 22px", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>{t("Sin resultados")}</div>}

            {filteredVis.map(({ c, gastos }) => {
              const tot = gastos.reduce((a: number, g: any) => a + (g.coste_final || 0), 0);
              const abierto = ql ? true : isOpen(c._id);
              return (
                <div key={c._id}>
                  <div className="pd-ghead" onClick={() => { if (catEdit?.id === c._id) return; setOpen((o) => ({ ...o, [c._id]: !abierto })); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 22px 12px 18px", background: highlight === c._id ? "#FCE7F0" : "#faf9fb", borderBottom: "1px solid #f6f6f8", borderLeft: `4px solid ${highlight === c._id ? "#EF5B94" : "transparent"}`, cursor: "pointer", transition: "background .3s, border-color .3s" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: abierto ? "none" : "rotate(-90deg)", transition: "transform .15s", flex: "none" }}><path d="M6 9l6 6 6-6" /></svg>
                    {catEdit?.id === c._id ? (
                      <input autoFocus value={catEdit.name} onClick={(e) => e.stopPropagation()} onChange={(e) => setCatEdit({ id: c._id, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCatName(c); } else if (e.key === "Escape") setCatEdit(null); }} onBlur={() => saveCatName(c)} style={{ ...editInput, maxWidth: 260, font: "600 13.5px Poppins" }} />
                    ) : (
                      <span title={t("Clic para renombrar") as string} onClick={(e) => { e.stopPropagation(); if (!isAllowed()) { ht(); return; } setCatMenuAt(null); setCatEdit({ id: c._id, name: c.nombre || "" }); }} style={{ font: "500 14px Poppins", color: "#5a5a62", cursor: "text" }}>{cap1(c.nombre)}</span>
                    )}
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "#ecebef", color: "#6b6b72", font: "700 11px Poppins", flex: "none" }}>{gastos.length}</span>
                    <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "baseline", gap: 7, whiteSpace: "nowrap" }}><span style={{ font: "500 10.5px Poppins", color: "#a0a0a8", textTransform: "uppercase", letterSpacing: ".4px" }}>{t("Coste total")}</span><span style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{getCurrency(tot, cur)}</span></span>
                    <div style={{ position: "relative", flex: "none" }}>
                      <button className="pd-dots" onClick={(e) => { e.stopPropagation(); setMenuAt(null); setCatMenuAt(catMenuAt === c._id ? null : c._id); }} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#b3b3ba", background: "none", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg></button>
                      {catMenuAt === c._id && (
                        <ClickAwayListener onClickAway={() => setCatMenuAt(null)}>
                          <div className="pd-menu" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 45, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.12)", padding: 10, width: 200, textAlign: "left" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                              <span style={{ font: "700 13px Poppins", color: "#3A3A42", whiteSpace: "nowrap" }}>{t("Opciones disponibles")}</span>
                              <button onClick={() => setCatMenuAt(null)} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer", padding: 0 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                            </div>
                            <button style={menuBtn} onClick={() => { setCatMenuAt(null); addPartidaFocus(c); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Agregar partida", { defaultValue: "Agregar partida" })}</button>
                            <button style={menuBtn} onClick={() => { setCatMenuAt(null); if (!isAllowed()) { ht(); return; } setCatEdit({ id: c._id, name: c.nombre || "" }); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>{t("Editar")}</button>
                            <button className="pd-del" style={{ ...menuBtn, color: "#D83E7C" }} onClick={() => { setCatMenuAt(null); if (!isAllowed()) { ht(); return; } setConfirmDel({ kind: "cat", c }); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>{t("Borrar categoría", { defaultValue: "Borrar categoría" })}</button>
                          </div>
                        </ClickAwayListener>
                      )}
                    </div>
                  </div>
                  {abierto && gastos.map((g: any) => {
                    const it = (g.items_array || [])[0];
                    const ct = g.coste_final || 0, pag = g.pagado || 0, pen = ct - pag;
                    const key = c._id + "|" + g._id;
                    const editing = editRow === key;
                    const items = (g.items_array || []);
                    const hasItems = items.length > 0;                 // con items: coste = Σ(cant×valor), derivado (no editable a mano)
                    const singleItem = items.length === 1;             // solo la fila única representa fielmente su item
                    const iEd = (f: string) => itemEdit?.key === key && itemEdit?.field === f;
                    const openItem = (f: "unidad" | "cantidad" | "valor", v: string) => { if (!isAllowed()) { ht(); return; } setEditRow(null); setMenuAt(null); setHintOff(true); setItemEdit({ key, field: f, val: v }); };
                    const itemKD = (f: "unidad" | "cantidad" | "valor") => (e: any) => { if (e.key === "Enter") { e.preventDefault(); saveItem(c, g, it, f); } else if (e.key === "Escape") setItemEdit(null); };
                    const render: Record<string, any> = {
                      partida: editing
                        ? <input autoFocus value={editVals.nombre} onChange={(e) => setEditVals((v) => ({ ...v, nombre: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(c, g); } else if (e.key === "Escape") setEditRow(null); }} style={editInput} />
                        : <div style={{ font: "600 13.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={g.nombre}>{g.nombre}</div>,
                      unidad: iEd("unidad")
                        ? <select autoFocus value={itemEdit!.val} onChange={(e) => setItemEdit({ key, field: "unidad", val: e.target.value })} onBlur={() => saveItem(c, g, it, "unidad")} onKeyDown={itemKD("unidad")} style={{ ...editInput, padding: "4px 4px", textAlign: "center" }}>{UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                        : <span onClick={singleItem ? () => openItem("unidad", it?.unidad || "xUni.") : undefined} style={{ font: "500 12.5px Poppins", color: "#6b6b72", cursor: singleItem ? "pointer" : "default" }}>{it?.unidad || "—"}</span>,
                      cantidad: iEd("cantidad")
                        ? <input autoFocus value={itemEdit!.val} onChange={(e) => setItemEdit({ key, field: "cantidad", val: e.target.value })} onBlur={() => saveItem(c, g, it, "cantidad")} onKeyDown={itemKD("cantidad")} style={{ ...editInput, textAlign: "center" }} />
                        : <span onClick={(singleItem && it?.unidad === "xUni.") ? () => openItem("cantidad", String(it?.cantidad ?? 0)) : undefined} title={(it && it.unidad !== "xUni." && it.unidad) ? t("Derivada del nº de invitados", { defaultValue: "Derivada del nº de invitados" }) as string : undefined} style={{ font: "500 12.5px Poppins", color: "#6b6b72", cursor: (singleItem && it?.unidad === "xUni.") ? "text" : "default" }}>{it ? (effCantidad(it) ?? "—") : "—"}</span>,
                      valor: iEd("valor")
                        ? <input autoFocus value={itemEdit!.val} onChange={(e) => setItemEdit({ key, field: "valor", val: e.target.value })} onBlur={() => saveItem(c, g, it, "valor")} onKeyDown={itemKD("valor")} style={{ ...editInput, textAlign: "center" }} />
                        : <span onClick={singleItem ? () => openItem("valor", String(it?.valor_unitario ?? 0)) : undefined} style={{ font: "500 12.5px Poppins", color: "#6b6b72", cursor: singleItem ? "text" : "default" }}>{it ? getCurrency(it.valor_unitario || 0, cur) : "—"}</span>,
                      coste: (editing && !hasItems)
                        ? <input value={editVals.coste_final} onChange={(e) => setEditVals((v) => ({ ...v, coste_final: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(c, g); } else if (e.key === "Escape") setEditRow(null); }} style={{ ...editInput, textAlign: "right" }} />
                        : <span title={hasItems ? t("Suma de las partidas (cantidad × valor)", { defaultValue: "Suma de las partidas (cantidad × valor)" }) as string : undefined} style={{ font: "700 12.5px Poppins", color: "#3A3A42" }}>{getCurrency(ct, cur)}</span>,
                      estimado: editing
                        ? <input value={editVals.coste_estimado} onChange={(e) => setEditVals((v) => ({ ...v, coste_estimado: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(c, g); } else if (e.key === "Escape") setEditRow(null); }} style={{ ...editInput, textAlign: "right" }} />
                        : <span style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{getCurrency(g.coste_estimado || 0, cur)}</span>,
                      pagado: <button onClick={(e) => { e.stopPropagation(); setPayOpen((o) => ({ ...o, [key]: !o[key] })); }} title={t("Ver pagos", { defaultValue: "Ver pagos" }) as string} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", font: "600 12.5px Poppins", color: "#2FB37E", padding: 0 }}>{getCurrency(pag, cur)}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: payOpen[key] ? "rotate(180deg)" : "none", transition: "transform .15s", opacity: .65 }}><path d="M6 9l6 6 6-6" /></svg></button>,
                      pendiente: pen > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FBF0DA", color: "#B4801F", borderRadius: 999, padding: "4px 5px 4px 11px", font: "700 12px Poppins", whiteSpace: "nowrap" }}>
                          {getCurrency(pen, cur)}
                          <button title={t("Añadir pago", { defaultValue: "Añadir pago" }) as string} onClick={(e) => { e.stopPropagation(); if (!isAllowed()) { ht(); return; } setPagoTarget({ cat: c._id, gasto: g._id }); }} style={{ width: 18, height: 18, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(180,128,31,.16)", color: "#B4801F", border: "none", cursor: "pointer", padding: 0, flex: "none" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
                        </span>
                      ) : <span style={{ font: "700 12.5px Poppins", color: "#8a8a90" }}>{getCurrency(pen, cur)}</span>,
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
                              <div className="pd-menu" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: -8, right: "calc(100% + 6px)", zIndex: 45, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.12)", padding: 10, width: 200, textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                  <span style={{ font: "700 13px Poppins", color: "#3A3A42", whiteSpace: "nowrap" }}>{t("Opciones disponibles")}</span>
                                  <button onClick={() => setMenuAt(null)} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer", padding: 0 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                                </div>
                                <button style={menuBtn} onClick={() => { setMenuAt(null); if (!isAllowed()) { ht(); return; } setPagoTarget({ cat: c._id, gasto: g._id }); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>{t("Relacionar pago")}</button>
                                <button style={menuBtn} onClick={() => startEdit(c, g, key)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>{t("Editar")}</button>
                                <button className="pd-del" style={{ ...menuBtn, color: "#D83E7C" }} onClick={() => { setMenuAt(null); setConfirmDel({ kind: "gasto", c, g }); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>{t("Borrar")}</button>
                              </div>
                            </ClickAwayListener>
                          )}
                        </div>
                      ),
                    };
                    return (
                      <div key={g._id}>
                        <div className="pd-row" style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 8, alignItems: "center", padding: "11px 20px 11px 22px", borderBottom: payOpen[key] ? "none" : "1px solid #f4f4f6" }}>
                          {visibleCols.map((col) => {
                            const editable = !editing && (col.key === "partida" || (col.key === "coste" && !hasItems) || col.key === "estimado");
                            return <div key={col.key} onClick={editable ? () => startEdit(c, g, key) : undefined} style={{ ...cellStyle(col.align), ...(editable ? { cursor: "text" } : {}) }}>{render[col.key]}</div>;
                          })}
                        </div>
                        {payOpen[key] && (() => {
                          const pagos = (g.pagos_array || []).filter((p: any) => p?.estatus !== false && !(undo?.kind === "pago" && undo.p?._id === p._id));
                          const fmtF = (f: any) => { if (!f) return "—"; try { const d = new Date(f); return isNaN(d.getTime()) ? String(f) : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; } catch { return String(f); } };
                          return (
                            <div style={{ padding: "8px 20px 12px 46px", background: "#fbfbfc", borderBottom: "1px solid #f4f4f6" }}>
                              {pagos.length === 0 && <div style={{ font: "500 12px Poppins", color: "#a0a0a8", padding: "6px 0 10px" }}>{t("Sin pagos registrados", { defaultValue: "Sin pagos registrados" })}</div>}
                              {pagos.map((p: any, pi: number) => {
                                const pagado = p.estado !== "pendiente";
                                return (
                                  <div key={p._id || pi} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f4f4f6" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: pagado ? "#E4F5EE" : "#FBF0DA", color: pagado ? "#2FB37E" : "#B4801F", borderRadius: 999, padding: "3px 10px", font: "600 10.5px Poppins", flex: "none" }}>
                                      {pagado
                                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>}
                                      {pagado ? t("Pagado") : t("Próximo", { defaultValue: "Próximo" })}
                                    </span>
                                    <span style={{ font: "500 11.5px Poppins", color: "#8a8a90", flex: "none" }}>{fmtF(pagado ? p.fecha_pago : p.fecha_vencimiento)}</span>
                                    <span style={{ flex: 1, minWidth: 0, font: "500 12px Poppins", color: "#6b6b72", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.concepto || p.medio_pago || (p.pagado_por === "wedding planer" ? "Wedding Planner" : p.pagado_por) || ""}</span>
                                    <span style={{ font: "700 12.5px Poppins", color: "#3A3A42", flex: "none" }}>{getCurrency(p.importe || 0, cur)}</span>
                                    <button title={t("Editar") as string} onClick={() => { if (!isAllowed()) { ht(); return; } setPagoTarget({ cat: c._id, gasto: g._id, pago: p }); }} style={{ width: 26, height: 26, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer", flex: "none" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg></button>
                                    <button title={t("Borrar") as string} onClick={() => { if (!isAllowed()) { ht(); return; } setConfirmDel({ kind: "pago", c, g, p }); }} style={{ width: 26, height: 26, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#c8c8ce", background: "none", border: "none", cursor: "pointer", flex: "none" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg></button>
                                  </div>
                                );
                              })}
                              <button onClick={() => { if (!isAllowed()) { ht(); return; } setPagoTarget({ cat: c._id, gasto: g._id }); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 10, background: "none", border: "none", cursor: "pointer", font: "600 12px Poppins", color: "#EF5B94", padding: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Añadir pago", { defaultValue: "Añadir pago" })}</button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                  {abierto && (
                    <div className="pd-addpartida" onClick={() => addPartida(c)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px 10px 22px", borderBottom: "1px solid #f4f4f6", cursor: "pointer", font: "600 12px Poppins", color: "#EF5B94" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Añadir partida", { defaultValue: "Añadir partida" })}
                    </div>
                  )}
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

      {/* Confirmación de borrado (categoría o partida) — nunca se borra en un clic */}
      {mounted && confirmDel && createPortal(
        <div onClick={() => setConfirmDel(null)} style={{ position: "fixed", inset: 0, background: "rgba(30,30,40,.38)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 20, fontFamily: "'Poppins',sans-serif" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,.2)", width: "min(340px,92vw)", padding: 24 }}>
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 6 }}>{confirmDel.kind === "pago" ? t("¿Borrar este pago?", { defaultValue: "¿Borrar este pago?" }) : <>{t("¿Borrar")} &quot;{cap1(confirmDel.kind === "cat" ? confirmDel.c?.nombre : confirmDel.g?.nombre)}&quot;?</>}</div>
            <div style={{ font: "400 12.5px Poppins", color: "#6b6b72", marginBottom: 18 }}>{confirmDel.kind === "cat" ? t("Se eliminarán también sus partidas y pagos asociados. Esta acción se puede deshacer durante unos segundos.", { defaultValue: "Se eliminarán también sus partidas y pagos asociados. Esta acción se puede deshacer durante unos segundos." }) : confirmDel.kind === "pago" ? t("Se eliminará este pago. Esta acción se puede deshacer durante unos segundos.", { defaultValue: "Se eliminará este pago. Esta acción se puede deshacer durante unos segundos." }) : t("Se eliminará esta partida y sus pagos. Esta acción se puede deshacer durante unos segundos.", { defaultValue: "Se eliminará esta partida y sus pagos. Esta acción se puede deshacer durante unos segundos." })}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setConfirmDel(null)} style={{ padding: "10px 18px", borderRadius: 12, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>{t("Cancelar")}</button>
              <button onClick={() => { const tgt = confirmDel; setConfirmDel(null); startDelete(tgt); }} style={{ padding: "10px 20px", borderRadius: 12, background: "#D83E7C", border: "none", color: "#fff", font: "600 12.5px Poppins", cursor: "pointer" }}>{t("Borrar")}</button>
            </div>
          </div>
        </div>, document.body)}

      {/* Toast "Deshacer" (pastilla oscura, abajo-centro, ~6 s) */}
      {mounted && undo && createPortal(
        <div style={{ position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 10001, display: "inline-flex", alignItems: "center", gap: 12, background: "#3A3A42", color: "#fff", borderRadius: 999, padding: "11px 18px", font: "500 12.5px Poppins", boxShadow: "0 8px 24px rgba(0,0,0,.25)", fontFamily: "'Poppins',sans-serif", maxWidth: "92vw" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{undo.label}</span>
          <button onClick={undoDelete} style={{ background: "none", border: "none", color: "#F5A8C7", font: "700 12.5px Poppins", cursor: "pointer", textDecoration: "underline", flex: "none" }}>{t("Deshacer", { defaultValue: "Deshacer" })}</button>
        </div>, document.body)}
    </div>
  );
};

export default PresupuestoDetalladoStudio;
