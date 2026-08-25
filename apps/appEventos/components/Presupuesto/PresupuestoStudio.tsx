import { FC, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";
import ClickAwayListener from "react-click-away-listener";
import BlockTitle from "../Utils/BlockTitle";
import StudioNotesSection from "./StudioNotesSection";
import PresupuestoDetalladoStudio from "./PresupuestoDetalladoStudio";
import DashboardStudio from "./DashboardStudio";
import ExportExcelPresupuesto from "./ExportExcelPresupuesto";
import ModalImportarStudio from "./ModalImportarStudio";

interface Props {
  categorias: any[];
}

// Nombre de categoría: iniciar SIEMPRE con mayúscula (solo la primera letra, resto tal cual).
const cap1 = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s || "");

const PresupuestoStudio: FC<Props> = ({ categorias }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const { user } = AuthContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();

  const [active, setActive] = useState("resumen");
  const [showCategoria, setShowCategoria] = useState<{ state: boolean; _id: string }>({ state: false, _id: "" });
  const [getId, setGetId] = useState<any>();
  const [showCreateCat, setShowCreateCat] = useState(false);
  const [ncName, setNcName] = useState("");
  const [ncEst, setNcEst] = useState("");
  const [ncSaving, setNcSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [totOpen, setTotOpen] = useState(false);
  const [totDraft, setTotDraft] = useState("");
  const [showZero, setShowZero] = useState(false);
  const [curOpen, setCurOpen] = useState(false);
  const [donutOpen, setDonutOpen] = useState(false);
  const [confirmCat, setConfirmCat] = useState<any>(null);
  const [focusCat, setFocusCat] = useState<string | null>(null); // categoría a enfocar al saltar Resumen→Gastos
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const p = event?.presupuesto_objeto || {};
  const cur = p.currency;
  const cats = Array.isArray(categorias) ? categorias : [];

  const { total, pagado, costeFinal, porPagar, disponible, paidW, dueW, catsActive, catsZero, sumEst, sumFinal } = useMemo(() => {
    const total = typeof p.presupuesto_total === "number" ? p.presupuesto_total : (p.coste_estimado || 0);
    const pagado = p.pagado || 0;
    const costeFinal = p.coste_final || 0;
    const porPagar = Math.max(0, costeFinal - pagado);
    const disponible = total - costeFinal;
    const paidW = total > 0 ? Math.min(100, (pagado / total) * 100) : 0;
    const dueW = total > 0 ? Math.min(100 - paidW, (porPagar / total) * 100) : 0;
    const active = cats.filter((c) => (c.coste_final || 0) > 0 || (c.coste_estimado || 0) > 0);
    const zero = cats.filter((c) => !((c.coste_final || 0) > 0 || (c.coste_estimado || 0) > 0));
    const sumEst = cats.reduce((s, c) => s + (c.coste_estimado || 0), 0);
    const sumFinal = cats.reduce((s, c) => s + (c.coste_final || 0), 0);
    return { total, pagado, costeFinal, porPagar, disponible, paidW, dueW, catsActive: active, catsZero: zero, sumEst, sumFinal };
  }, [p, cats]);

  // Donut "¿Cuánto cuesta mi evento?" — distribución del gasto real (coste_final) por categoría.
  const donut = useMemo(() => {
    const COLORS = ["#EF5B94", "#5FBE8E", "#F4A26B", "#5EC0C4", "#8E8CE0", "#C58BD8", "#E7C24B", "#7BC67E", "#F0885A", "#6AA9E0", "#E0728F", "#9BD07B"];
    const CIRC = 490.09; // 2·π·78
    const data = cats.filter((c) => (c.coste_final || 0) > 0).map((c) => ({ nombre: c.nombre, val: c.coste_final || 0 })).sort((a, b) => b.val - a.val);
    const totalG = data.reduce((s, d) => s + d.val, 0);
    let off = 0;
    const segs = data.map((d, i) => {
      const frac = totalG > 0 ? d.val / totalG : 0;
      const arc = frac * CIRC;
      const seg = { color: COLORS[i % COLORS.length], arc, offset: -off, pct: Math.round(frac * 100), val: d.val, nombre: d.nombre };
      off += arc;
      return seg;
    });
    return { segs, totalG, CIRC };
  }, [cats]);

  const excedido = disponible < 0;
  const frMsgBg = total === 0 ? "#FBF0DA" : excedido ? "#FBF0DA" : "#E4F5EE";
  const frMsgFg = total === 0 ? "#B4801F" : excedido ? "#B4801F" : "#2FB37E";
  const fraseResumen = total === 0
    ? t("Define tu presupuesto total para empezar")
    : excedido
      ? `${t("Te has excedido")} ${getCurrency(Math.abs(disponible), cur)}`
      : `${t("Vas por buen camino")} · ${getCurrency(disponible, cur)} ${t("disponibles")}`;

  const isOwner = event?.usuario_id === user?.uid;

  const tabs = [
    { key: "resumen", label: t("Resumen", { defaultValue: "Resumen" }) },
    { key: "excelView", label: t("Gastos", { defaultValue: "Gastos" }) },
    ...(isOwner ? [{ key: "dashboard", label: t("Panel del planner", { defaultValue: "Panel del planner" }) }] : []),
  ];

  const saveTotal = async () => {
    if (!isAllowed()) { ht(); return; }
    const val = parseFloat(String(totDraft).replace(/[^0-9.,]/g, "").replace(",", "."));
    if (Number.isNaN(val)) { setTotOpen(false); return; }
    try {
      const result: any = await fetchApiEventos({
        query: queries.editPresupuesto,
        variables: { evento_id: event._id, datos: { presupuesto_total: val } },
      });
      const po = result?.evento?.presupuesto_objeto;
      setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po || { ...prev.presupuesto_objeto, presupuesto_total: val } }));
      setTotOpen(false);
    } catch (e) {
      toast("error", t("Ha ocurrido un error"));
    }
  };

  const CURRENCIES = [
    { v: "eur", l: "EUR" }, { v: "usd", l: "USD" }, { v: "mxn", l: "MXN" },
    { v: "cop", l: "COP" }, { v: "ars", l: "ARS" }, { v: "ves", l: "VES" }, { v: "uyu", l: "UYU" },
  ];

  const changeCurrency = (moneda: string) => {
    setCurOpen(false);
    if (!isAllowed()) { ht(); return; }
    if (!event?._id) return;
    fetchApiEventos({
      query: `mutation($evento_id:ID!,$moneda:String!){ editCurrency(evento_id:$evento_id, moneda:$moneda){ success errors{ field message code } evento{ _id presupuesto_objeto } } }`,
      variables: { evento_id: event._id, moneda },
    }).then((result: any) => {
      const po = result?.evento?.presupuesto_objeto;
      setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po || { ...prev.presupuesto_objeto, currency: moneda } }));
    }).catch(() => { });
  };

  // Parseo de importe en formato español: "1.500" -> 1500, "1500,50" -> 1500.5
  const parseEs = (s: string) => {
    const n = parseFloat(String(s).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
    return Number.isNaN(n) ? 0 : n;
  };

  const closeCreateCat = () => { setShowCreateCat(false); setNcName(""); setNcEst(""); };

  const createCategoria = async () => {
    const nombre = ncName.trim();
    if (!nombre || ncSaving) return;
    if (!isAllowed()) { ht(); return; }
    setNcSaving(true);
    try {
      const prevIds = new Set((event?.presupuesto_objeto?.categorias_array || []).map((c: any) => c._id));
      const result: any = await fetchApiEventos({
        query: queries.nuevoCategoria,
        variables: { evento_id: event._id, nombre },
      });
      if (result?.success === false && Array.isArray(result?.errors) && result.errors.length) {
        setNcSaving(false);
        toast("error", t("Ha ocurrido un error"));
        return;
      }
      let po = result?.evento?.presupuesto_objeto;
      const est = parseEs(ncEst);
      if (est > 0 && Array.isArray(po?.categorias_array)) {
        const nueva = po.categorias_array.find((c: any) => !prevIds.has(c._id))
          || [...po.categorias_array].reverse().find((c: any) => String(c.nombre || "").toLowerCase() === nombre.toLowerCase());
        if (nueva?._id) {
          const r2: any = await fetchApiEventos({
            query: queries.editCategoria,
            variables: { evento_id: event._id, categoria_id: nueva._id, updates: { coste_estimado: est } },
          });
          if (r2?.evento?.presupuesto_objeto) po = r2.evento.presupuesto_objeto;
        }
      }
      if (po) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po }));
      closeCreateCat();
      toast("success", t("Categoría creada"));
    } catch (e) {
      toast("error", t("Ha ocurrido un error"));
    } finally {
      setNcSaving(false);
    }
  };

  const deleteCat = async (categoria: any) => {
    try {
      await fetchApiEventos({
        query: queries.borraCategoria,
        variables: { evento_id: event._id, categoria_id: categoria._id },
      });
      setEvent((prev: any) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: (prev.presupuesto_objeto?.categorias_array || []).filter((c: any) => c._id !== categoria._id),
        },
      }));
      if (showCategoria._id === categoria._id) setShowCategoria({ state: false, _id: "" });
      toast("success", t("Categoría eliminada"));
    } catch (e) {
      toast("error", t("Ha ocurrido un error"));
    } finally {
      setConfirmCat(null);
    }
  };

  const selectCat = (c: any) => setShowCategoria({ state: true, _id: c._id });

  const CATSTYLE = `
    .ps-seg:hover{background:#faf9fb!important;}
    .ps-cur:hover{background:#faf9fb!important;color:#6b6b72!important;}
    .ps-curtog:hover{color:#6b6b72!important;}
    .ps-row:hover{background:#faf9fb!important;}
    .ps-del:hover{background:#FBE4EF!important;color:#D83E7C!important;}
    .ps-btn2:hover{background:#faf9fb!important;color:#3A3A42!important;}
    .ps-mod:hover{color:#EF5B94!important;}
    .ps-ncinput:focus{border-color:#EF5B94!important;}
    .ps-close:hover{background:#faf9fb!important;color:#3A3A42!important;}
    .ps-scroll{scrollbar-width:none;-ms-overflow-style:none;}
    .ps-scroll::-webkit-scrollbar{display:none;}
    @keyframes grow{from{opacity:0;transform:scale(.96);}to{opacity:1;transform:scale(1);}}
  `;

  const catRow = (c: any, faded = false) => {
    const est = c.coste_estimado || 0;
    const fin = c.coste_final || 0;
    const barW = est > 0 ? Math.min(100, (fin / est) * 100) : (fin > 0 ? 100 : 0);
    const stColor = fin === 0 ? "#d6d6dc" : fin > est ? "#D83E7C" : "#2FB37E";
    const stTitle = fin === 0 ? t("Sin gasto") : fin > est ? t("Excedido") : t("Dentro del estimado");
    const totCol = fin > est && fin > 0 ? "#D83E7C" : "#3A3A42";
    return (
      <div key={c._id} className="ps-row" onClick={() => selectCat(c)} style={{ display: "grid", gridTemplateColumns: "minmax(60px,1fr) 106px 106px 14px", gap: 8, alignItems: "center", padding: faded ? "9px 18px" : "12px 18px", borderBottom: "1px solid #f6f6f8", cursor: "pointer", background: showCategoria._id === c._id ? "#FCE7F0" : "#fff" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: faded ? "500 12.5px Poppins" : "600 13px Poppins", color: faded ? "#a0a0a8" : "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cap1(c.nombre)}</div>
          {!faded && <div style={{ height: 4, borderRadius: 4, background: "#f0f0f2", marginTop: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${barW}%`, background: fin > est ? "#D83E7C" : "#EF5B94", borderRadius: 4, transition: "width .8s cubic-bezier(.2,.7,.2,1)" }} /></div>}
        </div>
        <div style={{ textAlign: "right", font: faded ? "500 12px Poppins" : "600 12.5px Poppins", color: faded ? "#b3b3ba" : "#8a8a90" }}>{getCurrency(est, cur)}</div>
        <div style={{ textAlign: "right", font: faded ? "500 12px Poppins" : "700 12.5px Poppins", color: faded ? "#c0c0c8" : totCol }}>{getCurrency(fin, cur)}</div>
        <div style={{ display: "flex", justifyContent: "center" }} title={stTitle}><span style={{ width: 9, height: 9, borderRadius: "50%", background: stColor }} /></div>
      </div>
    );
  };

  // Detalle de categoría (solo lectura) fiel al definitivo: cabecera + tabla
  // Partida/Coste real/Pagado/Pendiente + "Editar en Gastos" + Total + Notas.
  const catDetailRO = () => {
    const selCat = (cats || []).find((c: any) => c._id === showCategoria._id);
    if (!selCat) return null;
    const rows = (selCat.gastos_array || []).filter((g: any) => g?.estatus !== false);
    const selTot = selCat.coste_final || 0;
    const selPag = selCat.pagado || 0;
    const selPen = Math.max(0, selTot - selPag);
    const GRID = "minmax(110px,1.3fr) 74px 72px 74px";
    return (
      <>
        <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", overflow: "hidden", marginBottom: 18 }}>
          <div style={{ position: "relative", padding: "18px 20px 14px", borderBottom: "1px solid #f2f2f4" }}>
            <div style={{ textAlign: "center", font: "700 16px Poppins", color: "#EF5B94" }}>{cap1(selCat.nombre)}</div>
            <button className="ps-close" onClick={() => setShowCategoria({ state: false, _id: "" })} title={t("Cerrar")} style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 6, padding: "11px 16px", background: "#faf9fb", borderBottom: "1px solid #f2f2f4", font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".4px", textTransform: "uppercase" }}>
            <div>{t("Partida de gasto", { defaultValue: "Partida de gasto" })}</div>
            <div style={{ textAlign: "right" }}>{t("Coste real", { defaultValue: "Coste real" })}<div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", textTransform: "none", letterSpacing: 0 }}>{getCurrency(selTot, cur)}</div></div>
            <div style={{ textAlign: "right" }}>{t("Pagado", { defaultValue: "Pagado" })}<div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", textTransform: "none", letterSpacing: 0 }}>{getCurrency(selPag, cur)}</div></div>
            <div style={{ textAlign: "right" }}>{t("Pendiente", { defaultValue: "Pendiente" })}<div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", textTransform: "none", letterSpacing: 0 }}>{getCurrency(selPen, cur)}</div></div>
          </div>
          {rows.length === 0 && <div style={{ padding: "22px 16px", textAlign: "center", font: "500 12px Poppins", color: "#a0a0a8" }}>{t("Sin partidas todavía", { defaultValue: "Sin partidas todavía" })}</div>}
          {rows.map((g: any, i: number) => {
            const tot = g.coste_final || 0; const pag = g.pagado || 0; const pen = Math.max(0, tot - pag);
            return (
              <div key={g._id || i} className="ps-row" style={{ display: "grid", gridTemplateColumns: GRID, gap: 6, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f4f4f6" }}>
                <div style={{ font: "500 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={g.nombre}>{g.nombre}</div>
                <div style={{ textAlign: "right", font: "600 12px Poppins", color: "#3A3A42" }}>{getCurrency(tot, cur)}</div>
                <div style={{ textAlign: "right", font: "600 12px Poppins", color: "#2FB37E" }}>{getCurrency(pag, cur)}</div>
                <div style={{ textAlign: "right", font: "600 12px Poppins", color: pen > 0 ? "#B4801F" : "#a0a0a8" }}>{getCurrency(pen, cur)}</div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 20px", borderBottom: "1px solid #f2f2f4" }}>
            <button onClick={() => { setFocusCat(selCat._id); setShowCategoria({ state: false, _id: "" }); setActive("excelView"); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EF5B94", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", font: "600 12.5px Poppins", cursor: "pointer", whiteSpace: "nowrap" }}>{t("Editar en Gastos", { defaultValue: "Editar en Gastos" })}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 6, alignItems: "center", padding: "13px 16px", background: "#faf9fb", borderTop: "1px solid #ececef" }}>
            <div style={{ font: "700 13px Poppins", color: "#5a5a62" }}>{t("Total")}</div>
            <div style={{ textAlign: "right", font: "700 12px Poppins", color: "#5a5a62" }}>{getCurrency(selTot, cur)}</div>
            <div style={{ textAlign: "right", font: "700 12px Poppins", color: "#2FB37E" }}>{getCurrency(selPag, cur)}</div>
            <div style={{ textAlign: "right", font: "700 12px Poppins", color: "#B4801F" }}>{getCurrency(selPen, cur)}</div>
          </div>
        </div>
        {selCat._id && <StudioNotesSection entityId={selCat._id} entityName={selCat?.nombre || "Categoría"} />}
      </>
    );
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#faf9fb", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CATSTYLE }} />

      {showCreateCat && mounted && typeof document !== "undefined" && createPortal(
        <div onClick={closeCreateCat} style={{ position: "fixed", inset: 0, background: "rgba(30,30,40,.38)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, fontFamily: "'Poppins',sans-serif" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,.2)", width: "min(420px,92vw)", padding: "26px 28px", animation: "grow .25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Nueva categoría")}</div>
              <button className="ps-close" title={t("Cerrar")} onClick={closeCreateCat} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
            </div>
            <div style={{ font: "500 12px Poppins", color: "#8a8a90", marginBottom: 18 }}>{t("Crea una categoría para organizar los gastos de tu evento.")}</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Nombre de la categoría")}</div>
              <input className="ps-ncinput" autoFocus value={ncName} onChange={(e) => setNcName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createCategoria(); }} placeholder={t("Ej. Transporte") as string} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 13.5px Poppins", color: "#3A3A42", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Presupuesto estimado")} <span style={{ fontWeight: 500, color: "#a0a0a8" }}>({t("opcional")})</span></div>
              <input className="ps-ncinput" value={ncEst} onChange={(e) => setNcEst(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createCategoria(); }} placeholder="0 €" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 13.5px Poppins", color: "#3A3A42", outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="ps-btn2" onClick={closeCreateCat} style={{ padding: "10px 18px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>{t("Cancelar")}</button>
              <button onClick={createCategoria} disabled={!ncName.trim() || ncSaving} style={{ padding: "10px 20px", borderRadius: 10, background: ncName.trim() ? "#EF5B94" : "#c8c8ce", border: "none", color: "#fff", font: "600 12.5px Poppins", cursor: ncName.trim() ? "pointer" : "default", boxShadow: "0 6px 16px rgba(239,91,148,.25)", transition: "background .15s" }}>{t("createcategory")}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showImport && <ModalImportarStudio onClose={() => setShowImport(false)} />}

      {/* Confirmación borrar categoría */}
      {confirmCat && mounted && typeof document !== "undefined" && createPortal(
        <div onClick={() => setConfirmCat(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(43,43,48,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Poppins',sans-serif" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 16, boxShadow: "0 30px 80px rgba(0,0,0,.3)", padding: "22px 22px 18px", textAlign: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FBE4EF", display: "flex", alignItems: "center", justifyContent: "center", color: "#D83E7C", margin: "0 auto 12px" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" /></svg></div>
            <div style={{ font: "600 14.5px Poppins", color: "#3A3A42", marginBottom: 6 }}>{t("¿Borrar")} "{confirmCat.nombre}"?</div>
            <div style={{ font: "400 12px/1.55 Poppins", color: "#8a8a90", marginBottom: 18 }}>{t("Se eliminará la categoría y sus gastos.")} <b style={{ color: "#D83E7C", fontWeight: 600 }}>{t("Es definitivo")}</b>.</div>
            <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
              <button onClick={() => setConfirmCat(null)} style={{ flex: 1, padding: 10, borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12px Poppins", cursor: "pointer" }}>{t("Cancelar")}</button>
              <button onClick={() => deleteCat(confirmCat)} style={{ flex: 1, padding: 10, borderRadius: 10, background: "#D83E7C", border: "none", color: "#fff", font: "600 12px Poppins", cursor: "pointer", boxShadow: "0 6px 16px rgba(216,62,124,.3)" }}>{t("Borrar")}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Scroll único: título + secciones + contenido bajan juntos, mismo ancho (max-w-screen-lg) */}
      <div className="ps-scroll" style={{ overflowY: "auto", flex: 1 }}>
      <div className="max-w-screen-lg mx-auto" style={{ padding: "12px 16px 40px" }}>

        <BlockTitle title={"Presupuesto"} />

        {/* BARRA DE SECCIONES (tarjeta blanca, fiel al HTML) */}
        <div className="ps-scroll" style={{ display: "flex", gap: 6, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, padding: 6, boxShadow: "0 4px 14px rgba(0,0,0,.05)", marginTop: 16, marginBottom: 16, overflowX: "auto" }}>
          {tabs.map((tb) => {
            const on = active === tb.key;
            return (
              <button key={tb.key} className="ps-seg" onClick={() => { setActive(tb.key); setShowCategoria({ state: false, _id: "" }); }} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 10, font: "600 13px Poppins", cursor: "pointer", background: "transparent", color: on ? "#EF5B94" : "#6b6b72", border: "none", whiteSpace: "nowrap", transition: "all .15s" }}>
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* ===== RESUMEN ===== */}
        {active === "resumen" && (
          <div>
            {/* SUMMARY CARD */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "22px 24px", boxShadow: "0 4px 14px rgba(0,0,0,.05)", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", flex: "none" }}>
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" /><path d="M2 9v1c0 1.1.9 2 2 2h1" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ font: "600 12px Poppins", color: "#8a8a90" }}>{t("Presupuesto total")}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ font: "700 28px Poppins", color: "#3A3A42" }}>{getCurrency(total, cur)}</div>
                    <span style={{ position: "relative", display: "inline-block" }}>
                      <button className="ps-mod" onClick={() => { if (!isAllowed()) { ht(); return; } setTotDraft(String(total || "")); setTotOpen((v) => !v); }} style={{ font: "600 12px Poppins", color: "#6b6b72", textDecoration: "underline", textUnderlineOffset: 3, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t("Modificar")}</button>
                      {totOpen && (
                        <div style={{ position: "absolute", top: 22, left: 0, zIndex: 40, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,.14)", padding: 14, width: 230 }}>
                          <div style={{ font: "600 11.5px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Nuevo presupuesto total")}</div>
                          <input value={totDraft} onChange={(e) => setTotDraft(e.target.value)} placeholder="42000" style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "600 13px Poppins", color: "#3A3A42", outline: "none" }} />
                          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setTotOpen(false)} style={{ padding: "8px 12px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12px Poppins", cursor: "pointer" }}>{t("Cancelar")}</button>
                            <button onClick={saveTotal} style={{ padding: "8px 14px", borderRadius: 10, background: "#EF5B94", border: "none", color: "#fff", font: "600 12px Poppins", cursor: "pointer" }}>{t("Guardar")}</button>
                          </div>
                        </div>
                      )}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <div className="ps-curtog" onClick={() => { if (!isAllowed()) { ht(); return; } setCurOpen((v) => !v); }} title={t("Cambiar moneda")} style={{ display: "flex", alignItems: "center", gap: 4, font: "600 11.5px Poppins", color: "#a0a0a8", cursor: "pointer" }}>
                      {(cur || "eur").toUpperCase()}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                    {curOpen && (
                      <ClickAwayListener onClickAway={() => setCurOpen(false)}>
                        <div style={{ position: "absolute", top: 22, right: 0, zIndex: 40, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,.14)", padding: 6, minWidth: 92 }}>
                          {CURRENCIES.map((c) => (
                            <div key={c.v} className="ps-cur" onClick={() => changeCurrency(c.v)} style={{ padding: "7px 12px", borderRadius: 8, font: "600 12px Poppins", color: (cur || "eur") === c.v ? "#EF5B94" : "#6b6b72", cursor: "pointer" }}>{c.l}</div>
                          ))}
                        </div>
                      </ClickAwayListener>
                    )}
                  </div>
                  <button className="ps-btn2" onClick={() => { if (!isAllowed()) { ht(); return; } setShowImport(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12px Poppins", cursor: "pointer", whiteSpace: "nowrap" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>{t("import")}</button>
                  <ExportExcelPresupuesto studio />
                </div>
              </div>

              {/* Aviso + progreso */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: frMsgBg, borderRadius: 999, padding: "9px 16px", font: "500 12.5px Poppins", color: frMsgFg, marginBottom: 14, maxWidth: "100%" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M20 6L9 17l-5-5" /></svg>
                  <span>{fraseResumen}</span>
                </div>
                <div style={{ height: 14, borderRadius: 999, background: "#f0f0f2", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${paidW}%`, background: "#EF5B94", transition: "width .8s cubic-bezier(.2,.7,.2,1)" }} />
                  <div style={{ width: `${dueW}%`, background: "#F8A9C6", transition: "width .8s cubic-bezier(.2,.7,.2,1)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 12, flexWrap: "wrap" }}>
                  {[
                    { c: "#EF5B94", l: t("Ya pagado"), v: getCurrency(pagado, cur), col: "#3A3A42" },
                    { c: "#F8A9C6", l: t("Comprometido sin pagar"), v: getCurrency(porPagar, cur), col: "#3A3A42" },
                    { c: "#e4e4e8", l: t("Aún libre"), v: getCurrency(disponible, cur), col: excedido ? "#D83E7C" : "#2FB37E" },
                  ].map((it, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: it.c, flex: "none" }} />
                      <div><div style={{ font: "600 11px Poppins", color: "#8a8a90" }}>{it.l}</div><div style={{ font: "700 14px Poppins", color: it.col }}>{it.v}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CATEGORÍAS + DONUT/DETALLE */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 1.15fr", gap: 18, alignItems: "start" }} className="ps-grid">
              {/* TABLA CATEGORÍAS */}
              <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #f2f2f4" }}>
                  <div style={{ font: "700 15px Poppins", color: "#3A3A42", whiteSpace: "nowrap" }}>{t("¿Cómo va tu presupuesto?", { defaultValue: "¿Cómo va tu presupuesto?" })}</div>
                </div>
                {(() => {
                  const over = (cats || []).filter((c: any) => (c.coste_final || 0) > (c.coste_estimado || 0) && (c.coste_estimado || 0) > 0);
                  if (!over.length) return null;
                  const txt = over.length === 1
                    ? `${t("Atención:", { defaultValue: "Atención:" })} ${cap1(over[0].nombre)} ${t("supera su estimado", { defaultValue: "supera su estimado" })}`
                    : `${t("Atención:", { defaultValue: "Atención:" })} ${over.length} ${t("categorías superan su estimado", { defaultValue: "categorías superan su estimado" })}`;
                  return (
                    <div style={{ padding: "12px 18px 0" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#FBF0DA", borderRadius: 999, padding: "8px 15px", font: "500 11.5px Poppins", color: "#B4801F", maxWidth: "100%" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M13 2L4.5 12.5c-.4.5 0 1.2.6 1.2H11l-1 8.3 8.5-10.5c.4-.5 0-1.2-.6-1.2H12l1-8.1z" /></svg>
                        <span>{txt}</span>
                      </span>
                    </div>
                  );
                })()}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(60px,1fr) 106px 106px 14px", gap: 8, padding: "11px 18px", font: "700 10.5px Poppins", color: "#b3b3ba", letterSpacing: ".6px", textTransform: "uppercase", borderBottom: "1px solid #f2f2f4" }}>
                  <div>{t("category", { defaultValue: "Categoría" })}</div><div style={{ textAlign: "right" }}>{t("Estimado", { defaultValue: "Estimado" })}</div><div style={{ textAlign: "right" }}>{t("Coste real", { defaultValue: "Coste real" })}</div><div />
                </div>
                {catsActive.length === 0 && catsZero.length === 0 && (
                  <div style={{ padding: "34px 18px", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>{t("Aún no hay categorías")}</div>
                )}
                {catsActive.map((c) => catRow(c))}
                {catsZero.length > 0 && (
                  <>
                    <div className="ps-row" onClick={() => setShowZero((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderBottom: "1px solid #f6f6f8", cursor: "pointer", font: "600 12.5px Poppins", color: "#8a8a90" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: showZero ? "rotate(180deg)" : "none", transition: "transform .15s" }}><path d="M6 9l6 6 6-6" /></svg>
                      {showZero ? t("Ocultar categorías sin gasto") : `${t("Ver")} ${catsZero.length} ${catsZero.length === 1 ? t("categoría sin gasto") : t("categorías sin gasto")}`}
                    </div>
                    {showZero && catsZero.map((c) => catRow(c, true))}
                  </>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(60px,1fr) 106px 106px 14px", gap: 8, padding: "14px 18px", background: "#faf9fb" }}>
                  <div style={{ font: "700 13px Poppins", color: "#3A3A42" }}>{t("Total")}</div>
                  <div style={{ textAlign: "right", font: "700 13px Poppins", color: "#3A3A42" }}>{getCurrency(sumEst, cur)}</div>
                  <div style={{ textAlign: "right", font: "700 13px Poppins", color: "#EF5B94" }}>{getCurrency(sumFinal, cur)}</div>
                  <div />
                </div>
              </div>

              {/* DERECHA: DETALLE o DONUT */}
              <div className="min-w-0">
                {showCategoria.state ? (
                  catDetailRO()
                ) : (
                  <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", padding: 20 }}>
                    {/* Cabecera clicable → alterna abierto/cerrado */}
                    <div onClick={() => setDonutOpen((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{t("¿Cuánto cuesta mi evento?")}</div>
                        <div style={{ font: "500 11.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>{t("Distribución del gasto real por categoría")}</div>
                      </div>
                      <span style={{ font: "600 12px Poppins", color: "#EF5B94", whiteSpace: "nowrap", textDecoration: "underline", textUnderlineOffset: 3, flex: "none" }}>{donutOpen ? t("Ocultar") : t("Ver distribución")}</span>
                    </div>

                    {donutOpen && (donut.totalG > 0 ? (
                      <>
                        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 220, animation: "grow .5s ease" }}>
                          <svg width="200" height="200" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="78" fill="none" stroke="#f2f2f4" strokeWidth="26" />
                            {donut.segs.map((s, i) => (
                              <circle key={i} cx="100" cy="100" r="78" fill="none" stroke={s.color} strokeWidth="26" strokeDasharray={`${s.arc} ${donut.CIRC}`} strokeDashoffset={s.offset} transform="rotate(-90 100 100)" />
                            ))}
                          </svg>
                          <div style={{ position: "absolute", textAlign: "center" }}>
                            <div style={{ font: "600 10.5px Poppins", color: "#a0a0a8" }}>{t("Gastado")}</div>
                            <div style={{ font: "700 20px Poppins", color: "#3A3A42" }}>{getCurrency(donut.totalG, cur)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
                          {donut.segs.map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 3, flex: "none", background: s.color }} />
                              <div style={{ flex: 1, font: "600 12px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{cap1(s.nombre)}</div>
                              <div style={{ font: "600 11.5px Poppins", color: "#a0a0a8" }}>{s.pct}%</div>
                              <div style={{ font: "700 12px Poppins", color: "#3A3A42", width: 64, textAlign: "right" }}>{getCurrency(s.val, cur)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: "26px 6px 6px", textAlign: "center", font: "500 12px Poppins", color: "#a0a0a8" }}>{t("Aún no hay gasto registrado")}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== OTRAS VISTAS (existentes, se rediseñan en fases siguientes) ===== */}
        {active === "excelView" && <PresupuestoDetalladoStudio categorias={cats} onAddCategoria={() => setShowCreateCat(true)} focusCatId={focusCat} onFocusHandled={() => setFocusCat(null)} />}
        {active === "dashboard" && isOwner && <DashboardStudio categorias={cats} />}
      </div>
      </div>
    </div>
  );
};

export default PresupuestoStudio;
