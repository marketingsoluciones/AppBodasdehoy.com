import { FC, useMemo, useState } from "react";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";
import ExportExcelPresupuesto from "./ExportExcelPresupuesto";

const cap1 = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s || "");
const parseEs = (s: string) => { const n = parseFloat(String(s).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".")); return Number.isNaN(n) ? 0 : n; };
const WP = "wedding planer";
const fmtFecha = (f: any) => { if (!f) return "—"; try { const d = new Date(f); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; } catch { return String(f); } };

interface Props { categorias: any[]; }

const DashboardStudio: FC<Props> = ({ categorias }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const { user } = AuthContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const cur = event?.presupuesto_objeto?.currency;

  const [tab, setTab] = useState<"main" | "hist">("main");
  const [depOpen, setDepOpen] = useState(false);
  const [depMonto, setDepMonto] = useState("");
  const [depMetodo, setDepMetodo] = useState("");
  const [depRef, setDepRef] = useState("");
  const [saving, setSaving] = useState(false);

  const cats = Array.isArray(categorias) ? categorias : [];
  const deposits = event?.presupuesto_objeto?.weddingPlannerIngresos || [];

  // Contrato REAL api-mcp: pago = { monto, fecha, metodo, referencia, notas } (sin importe/estado/
  // pagado_por). Item = { cantidad, coste_final }. Coherente con la tabla y el resumen.
  const montoOf = (p: any) => Number(p?.monto ?? p?.importe) || 0;
  const costeRealGasto = (g: any) => { const items = (g?.items_array || []); return items.length ? items.reduce((a: number, it: any) => a + (Number(it?.coste_final) || 0), 0) : (Number(g?.coste_final) || 0); };
  const costeRealCat = (c: any) => (c?.gastos_array || []).filter((g: any) => g?.estatus !== false).reduce((s: number, g: any) => s + costeRealGasto(g), 0);
  const data = useMemo(() => {
    const allPagos: any[] = [];
    cats.forEach((c) => (c.gastos_array || []).filter((g: any) => g?.estatus !== false).forEach((g: any) => (g.pagos_array || []).filter((p: any) => p?.estatus !== false && montoOf(p) > 0).forEach((p: any) => allPagos.push({ ...p, catName: c.nombre, gastoName: g.nombre }))));
    // WP vs directo se marca por pagado_por/metodo (api-mcp aún no guarda un flag propio → por ahora
    // casi todo cae en "directos"; ver nota al usuario sobre separar WP en backend).
    const isWP = (p: any) => (p.pagado_por || "") === WP || String(p.metodo || "").toLowerCase().includes("wedding");
    const directos = allPagos.filter((p) => !isWP(p));
    const wpPagos = allPagos.filter((p) => isWP(p));
    const recibido = deposits.reduce((a: number, d: any) => a + (Number(d.monto) || 0), 0);
    const totalDirectos = directos.reduce((a, p) => a + montoOf(p), 0);
    const totalWP = wpPagos.reduce((a, p) => a + montoOf(p), 0);
    const presupuestoTotal = cats.reduce((a, c) => a + (c.gastos_array || []).filter((g: any) => g?.estatus !== false).reduce((s: number, g: any) => s + costeRealGasto(g), 0), 0);
    const totalPagado = allPagos.reduce((a, p) => a + montoOf(p), 0);
    const utilizado = totalWP;
    const disponible = recibido - utilizado;
    return { allPagos, directos, wpPagos, recibido, totalDirectos, totalWP, presupuestoTotal, totalPagado, utilizado, disponible };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats, deposits]);

  const pctDisp = data.recibido > 0 ? Math.round((data.disponible / data.recibido) * 100) : 0;
  const pctPag = data.presupuestoTotal > 0 ? Math.round((data.totalPagado / data.presupuestoTotal) * 100) : 0;

  const kpis = [
    { label: t("Total recibido"), val: data.recibido, sub: t("Del presupuesto total"), tone: "#2FB37E", bg: "#E4F5EE" },
    { label: t("Fondos disponibles"), val: data.disponible, sub: `${pctDisp}% ${t("del total")}`, tone: "#3A3A42", bg: "#faf9fb" },
    { label: t("Total utilizado"), val: data.utilizado, sub: `${t("En")} ${data.wpPagos.length} ${t("pagos")}`, tone: "#B4801F", bg: "#FBF0DA" },
    { label: t("Pagos directos"), val: data.totalDirectos, sub: `${data.directos.length} ${t("pagos")}`, tone: "#EF5B94", bg: "#FCE7F0" },
  ];
  const finStats = [
    { label: t("Presupuesto total"), val: data.presupuestoTotal, sub: t("Todos los gastos incluidos"), tone: "#3A3A42", bg: "#faf9fb" },
    { label: t("Total pagado"), val: data.totalPagado, sub: `${pctPag}% ${t("completado")}`, tone: "#1E8F63", bg: "#E4F5EE" },
    { label: t("Pagos directos"), val: data.totalDirectos, sub: t("Fuera de la plataforma"), tone: "#B4801F", bg: "#FBF0DA" },
    { label: t("Por Wedding Planner"), val: data.totalWP, sub: t("Total pagado"), tone: "#D83E7C", bg: "#FBE4EF" },
  ];

  const applyPO = (result: any) => { const po = result?.evento?.presupuesto_objeto; if (po) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po })); };

  const submitDep = async () => {
    if (!isAllowed()) { ht(); return; }
    const monto = parseEs(depMonto);
    if (!monto || saving) return;
    setSaving(true);
    try {
      const result: any = await fetchApiEventos({
        query: queries.addWeddingPlannerIngreso,
        variables: { evento_id: event._id, ingreso: { fecha: new Date(), monto, metodo: depMetodo, referencia: depRef, registrado_por: user?.displayName || user?.email || "" } },
      });
      applyPO(result);
      toast("success", t("Depósito registrado"));
      setDepOpen(false); setDepMonto(""); setDepMetodo(""); setDepRef("");
    } catch { toast("error", t("Ha ocurrido un error")); } finally { setSaving(false); }
  };

  const delDep = async (dep: any) => {
    if (!isAllowed()) { ht(); return; }
    try { applyPO(await fetchApiEventos({ query: queries.deleteWeddingPlannerIngreso, variables: { evento_id: event._id, ingreso_id: dep._id } })); toast("success", t("Depósito eliminado")); }
    catch { toast("error", t("Ha ocurrido un error")); }
  };

  // Informe imprimible AUTÓNOMO (ventana propia con su HTML/estilos) — window.print() de la app salía
  // en blanco porque su CSS no está pensado para imprimir. Aquí replicamos el "Resumen financiero
  // detallado" (KPIs + distribución por categorías) para que se vea bien y se pueda guardar como PDF.
  const generarReporte = () => {
    try {
      const w = window.open("", "_blank");
      if (!w) { toast("error", t("Permite ventanas emergentes para generar el reporte", { defaultValue: "Permite ventanas emergentes para generar el reporte" })); return; }
      const esc = (s: any) => String(s ?? "").replace(/[&<>"]/g, (m: string) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m] || m));
      const money = (n: number) => esc(getCurrency(n, cur));
      const hoy = new Date().toLocaleDateString("es-ES");
      const kpi = (label: string, val: number, tone: string, bg: string) => `<div style="flex:1;min-width:160px;background:${bg};border-radius:14px;padding:16px 18px"><div style="font-size:10.5px;color:#6b6b72;text-transform:uppercase;letter-spacing:.5px;font-weight:700">${esc(label)}</div><div style="font-size:22px;font-weight:800;color:${tone};margin-top:8px">${money(val)}</div></div>`;
      const catRows = cats
        .map((c: any) => ({ n: c.nombre || "—", real: costeRealCat(c) }))
        .sort((a: any, b: any) => b.real - a.real)
        .map((c: any) => `<tr><td style="padding:9px 14px;border-bottom:1px solid #f2f2f4;font-weight:600;color:#3A3A42">${esc(c.n)}</td><td style="padding:9px 14px;border-bottom:1px solid #f2f2f4;text-align:right;font-weight:700;color:${c.real > 0 ? "#3A3A42" : "#b3b3ba"}">${money(c.real)}</td></tr>`)
        .join("");
      const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc("Reporte financiero — " + (event?.nombre || ""))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>@page{margin:16mm} *{font-family:'Poppins',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif} body{font-family:'Poppins',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3A3A42;margin:0;padding:24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1{font-size:20px;margin:0}.sub{color:#8a8a90;font-size:12px;margin-top:4px}.kpis{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}table{width:100%;border-collapse:collapse;font-size:13px}.sec{font-size:15px;font-weight:700;margin:22px 0 8px}.brand{color:#EF5B94;font-weight:800;font-size:18px}</style></head>
<body>
<div class="brand">Bodasdehoy.com</div>
<h1>${esc("Resumen financiero detallado")}</h1>
<div class="sub">${esc(event?.nombre || "")} · ${esc(hoy)}</div>
<div class="kpis">
${kpi("Presupuesto total", data.presupuestoTotal, "#3A3A42", "#faf9fb")}
${kpi("Total pagado", data.totalPagado, "#2FB37E", "#E4F5EE")}
${kpi("Pagos directos", data.totalDirectos, "#B4801F", "#FBF0DA")}
${kpi("Por Wedding Planner", data.totalWP, "#D83E7C", "#FBE4EF")}
</div>
<div class="sec">${esc("Distribución por categorías")}</div>
<table><thead><tr><th style="text-align:left;padding:9px 14px;border-bottom:2px solid #eee;font-size:11px;color:#8a8a90;text-transform:uppercase">${esc("Categoría")}</th><th style="text-align:right;padding:9px 14px;border-bottom:2px solid #eee;font-size:11px;color:#8a8a90;text-transform:uppercase">${esc("Coste real")}</th></tr></thead><tbody>${catRows}</tbody></table>
<script>window.onload=function(){var done=false;var go=function(){if(done)return;done=true;window.print();};if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){setTimeout(go,200);});setTimeout(go,1500);}else{setTimeout(go,600);}};<\/script>
</body></html>`;
      w.document.open(); w.document.write(html); w.document.close();
    } catch { toast("error", t("Ha ocurrido un error")); }
  };

  const card: any = { background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)" };
  const canConfirm = !!depMonto.trim() && !saving;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".ds-in:focus{border-color:#EF5B94!important;}.ds-ghost:hover{border-color:#EF5B94!important;color:#EF5B94!important;}" }} />

      {/* Cabecera (sin repetir el nombre del evento — ya está en el holder de la página) */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", flexWrap: "wrap" }}>
        <div><div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Gestión financiera")}</div><div style={{ font: "500 12px Poppins", color: "#a0a0a8", marginTop: 2 }}>{t("Depósitos, pagos directos y pagos por Wedding Planner")}</div></div>
      </div>

      {/* 4 KPI (sin "Presupuesto total", redundante con el holder) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {kpis.map((d, i) => (
          <div key={i} style={{ ...card, padding: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "4px 11px", font: "700 9.5px Poppins", letterSpacing: ".4px", textTransform: "uppercase", background: d.bg, color: d.tone, whiteSpace: "nowrap" }}>{d.label}</div>
            <div style={{ font: "700 19px Poppins", color: d.tone, marginTop: 11, whiteSpace: "nowrap" }}>{getCurrency(d.val, cur)}</div>
            <div style={{ font: "500 11px Poppins", color: "#a0a0a8", marginTop: 3 }}>{d.sub}</div>
          </div>
        ))}
      </div>

      {/* Registrar nuevo depósito */}
      <div>
        <button onClick={() => { if (!isAllowed()) { ht(); return; } setDepOpen((v) => !v); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, background: "#EF5B94", border: "none", color: "#fff", font: "600 13px Poppins", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}><span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>{t("Registrar nuevo depósito")}</button>
      </div>
      {depOpen && (
        <div style={{ ...card, padding: "20px 22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: 14 }}>
            <div><div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Monto del depósito")}</div><input className="ds-in" value={depMonto} onChange={(e) => setDepMonto(e.target.value)} placeholder="0,00" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 13.5px Poppins", color: "#3A3A42", outline: "none" }} /></div>
            <div><div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Método de pago")}</div><select className="ds-in" value={depMetodo} onChange={(e) => setDepMetodo(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 13.5px Poppins", color: "#3A3A42", outline: "none", background: "#fff" }}><option value="">{t("Seleccionar método")}</option><option>{t("Efectivo")}</option><option>{t("Transferencia")}</option><option>{t("Tarjeta")}</option><option>{t("Ingreso en cuenta")}</option></select></div>
            <div><div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Referencia")}</div><input className="ds-in" value={depRef} onChange={(e) => setDepRef(e.target.value)} placeholder={t("Número de referencia o descripción") as string} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 13.5px Poppins", color: "#3A3A42", outline: "none" }} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button onClick={() => setDepOpen(false)} style={{ padding: "10px 18px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>{t("Cancelar")}</button>
            <button onClick={submitDep} disabled={!canConfirm} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, background: canConfirm ? "#EF5B94" : "#f3c4d8", border: "none", color: "#fff", font: "600 12.5px Poppins", cursor: canConfirm ? "pointer" : "default" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>{t("Confirmar depósito")}</button>
          </div>
        </div>
      )}

      {/* Pestañas internas */}
      <div style={{ display: "flex", gap: 22, borderBottom: "1.5px solid #ececef", padding: "0 4px" }}>
        {[{ k: "main", l: t("Dashboard principal") }, { k: "hist", l: t("Historial de depósitos") }].map((tb) => {
          const on = tab === tb.k;
          return <button key={tb.k} onClick={() => setTab(tb.k as any)} style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 2px 12px", font: "600 13px Poppins", whiteSpace: "nowrap", marginBottom: "-1.5px", color: on ? "#EF5B94" : "#8a8a90", borderBottom: `2.5px solid ${on ? "#EF5B94" : "transparent"}` }}>{tb.l}</button>;
        })}
      </div>

      {tab === "main" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
            {/* Pagos directos */}
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: "1px solid #f2f2f4" }}>
                <div style={{ font: "700 14.5px Poppins", color: "#3A3A42" }}>{t("Pagos directos")}</div>
                <div style={{ textAlign: "right" }}><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8" }}>{t("Total en pagos directos")}</div><div style={{ font: "700 15px Poppins", color: "#EF5B94" }}>{getCurrency(data.totalDirectos, cur)}</div></div>
              </div>
              {data.directos.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", font: "500 12px Poppins", color: "#a0a0a8" }}>{t("No hay pagos directos")}</div>}
              {data.directos.map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", borderBottom: "1px solid #f6f6f8" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "600 13.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.gastoName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, font: "500 11.5px Poppins", color: "#a0a0a8", flexWrap: "wrap" }}>
                      <span>{fmtFecha(p.fecha || p.fecha_pago)}</span>
                      <span style={{ background: "#faf9fb", border: "1px solid #ececef", borderRadius: 999, padding: "2px 9px", font: "600 10.5px Poppins", color: "#6b6b72" }}>{cap1(p.catName)}</span>
                      {p.pagado_por && <span>{t("Por")}: {p.pagado_por}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ font: "700 13.5px Poppins", color: "#3A3A42" }}>{getCurrency(montoOf(p), cur)}</div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#E4F5EE", color: "#2FB37E", borderRadius: 999, padding: "3px 10px", font: "600 10.5px Poppins", marginTop: 4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2FB37E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>{t("Pagado")}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagos por Wedding Planner */}
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: "1px solid #f2f2f4" }}>
                <div style={{ font: "700 14.5px Poppins", color: "#3A3A42" }}>{t("Pagos por Wedding Planner")}</div>
                <div style={{ textAlign: "right" }}><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8" }}>{t("Total pagado")}</div><div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{getCurrency(data.totalWP, cur)}</div></div>
              </div>
              {data.wpPagos.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", textAlign: "center" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#faf9fb", display: "flex", alignItems: "center", justifyContent: "center", color: "#c8c8ce", marginBottom: 12 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 13h6" /></svg></div>
                  <div style={{ font: "600 13.5px Poppins", color: "#6b6b72" }}>{t("No hay pagos realizados")}</div>
                  <div style={{ font: "500 12px Poppins", color: "#a0a0a8", marginTop: 3 }}>{t("Los pagos por Wedding Planner aparecerán aquí")}</div>
                </div>
              ) : data.wpPagos.map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", borderBottom: "1px solid #f6f6f8" }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.gastoName}</div><div style={{ font: "500 11.5px Poppins", color: "#a0a0a8", marginTop: 3 }}>{fmtFecha(p.fecha || p.fecha_pago)} · {cap1(p.catName)}</div></div>
                  <div style={{ font: "700 13.5px Poppins", color: "#3A3A42" }}>{getCurrency(montoOf(p), cur)}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Resumen financiero detallado */}
          <div style={{ ...card, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{t("Resumen financiero detallado")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="ds-ghost" onClick={generarReporte} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12px Poppins", cursor: "pointer" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>{t("Generar reporte")}</button>
                <ExportExcelPresupuesto studio />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {finStats.map((f, i) => (
                <div key={i} style={{ background: f.bg, borderRadius: 14, padding: "15px 16px" }}>
                  <div style={{ font: "600 11px Poppins", color: f.tone }}>{f.label}</div>
                  <div style={{ font: "700 18px Poppins", color: f.tone, marginTop: 6 }}>{getCurrency(f.val, cur)}</div>
                  <div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>{f.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ font: "600 13px Poppins", color: "#3A3A42", marginBottom: 10 }}>{t("Distribución por categorías")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px" }}>
              {cats.map((c) => (
                <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#faf9fb", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ flex: 1, font: "500 12.5px Poppins", color: "#5a5a62", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cap1(c.nombre)}</div>
                  <div style={{ font: "700 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap" }}>{getCurrency(c.coste_final || 0, cur)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px 140px 40px", gap: 8, padding: "14px 22px", background: "#faf9fb", borderBottom: "1px solid #f2f2f4", font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".5px", textTransform: "uppercase" }}>
            <div>{t("Fecha")}</div><div>{t("Concepto")}</div><div style={{ textAlign: "right" }}>{t("Importe")}</div><div>{t("Registrado por")}</div><div />
          </div>
          {deposits.length === 0 && <div style={{ padding: "40px 22px", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>{t("Aún no hay depósitos registrados")}</div>}
          {deposits.map((d: any, i: number) => (
            <div key={d._id || i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px 140px 40px", gap: 8, alignItems: "center", padding: "13px 22px", borderBottom: "1px solid #f6f6f8" }}>
              <div style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{fmtFecha(d.fecha)}</div>
              <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{d.referencia || d.concepto || t("Depósito")}</div>
              <div style={{ textAlign: "right", font: "700 13px Poppins", color: "#2FB37E" }}>{getCurrency(Number(d.monto) || 0, cur)}</div>
              <div style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{d.registrado_por || d.por || "—"}</div>
              <div style={{ display: "flex", justifyContent: "center" }}><button title={t("Eliminar")} onClick={() => delDep(d)} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c8c8ce", background: "none", border: "none", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg></button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardStudio;
