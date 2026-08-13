import { FC, useState } from "react";
import { EventContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";
import ClickAwayListener from "react-click-away-listener";
import ModalAddPagoStudio from "./ModalAddPagoStudio";

const cap1 = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s || "");
// Pago (pagado): Registro·Estado·Fecha de pago·Importe·(sep)·Modo de pago·Concepto·⋮
const COLS_PAGADO = "2.4fr 112px 105px 100px 18px 1.1fr 1.1fr 40px";
// Pagos pendientes: Registro·Estado·Fecha futuro pago·Concepto·⋮
const COLS_PEND = "1.2fr 130px 150px 1.6fr 40px";

interface Props { categorias: any[]; estado: "pagado" | "pendiente"; }

const PagosStudio: FC<Props> = ({ categorias, estado }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const cur = event?.presupuesto_objeto?.currency;

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<{ cat: string; gasto: string; pago: any } | null>(null);

  const cats = Array.isArray(categorias) ? categorias : [];
  const isOpen = (id: string) => open[id] !== false;
  const isPagado = estado === "pagado";
  const COLS = isPagado ? COLS_PAGADO : COLS_PEND;
  const minW = isPagado ? 820 : 620;

  // Agrupar pagos por categoría (cada fila = un pago del estado pedido).
  const grupos = cats.map((c) => {
    const rows: any[] = [];
    (c.gastos_array || []).filter((g: any) => g?.estatus !== false).forEach((g: any) => {
      (g.pagos_array || []).filter((p: any) => p?.estado === estado).forEach((p: any) => rows.push({ gasto: g, pago: p }));
    });
    return { c, rows };
  }).filter((x) => x.rows.length > 0);

  const applyPO = (result: any) => { const po = result?.evento?.presupuesto_objeto; if (po) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po })); };

  const delPago = async (cat: any, gasto: any, pago: any) => {
    if (!isAllowed()) { ht(); return; }
    try { applyPO(await fetchApiEventos({ query: queries.deletepayment, variables: { evento_id: event._id, categoria_id: cat._id, gasto_id: gasto._id, pago_id: pago._id } })); toast("success", t("Pago eliminado")); }
    catch { toast("error", t("Ha ocurrido un error")); }
  };

  const chip = estado === "pagado"
    ? { bg: "#E4F5EE", fg: "#2FB37E", label: t("Pagado"), icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2FB37E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> }
    : { bg: "#FBF0DA", fg: "#B4801F", label: t("Pendiente"), icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B4801F" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg> };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .pg-row:hover{background:#faf9fb;}
        .pg-ghead:hover{background:#f4f3f6!important;}
        .pg-dots:hover{background:#faf9fb!important;color:#6b6b72!important;}
        .pg-menu button:hover{background:#FCE7F0;color:#D83E7C;}
        .pg-menu .pg-del:hover{background:#FBE4EF;}
        .pg-scrollx{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
        .pg-scrollx::-webkit-scrollbar{display:none;}
      `}} />

      {modalTarget && <ModalAddPagoStudio categoriaId={modalTarget.cat} gastoId={modalTarget.gasto} pago={modalTarget.pago} onClose={() => setModalTarget(null)} />}

      <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", overflow: "hidden", fontFamily: "'Poppins',sans-serif" }}>
        <div className="pg-scrollx">
          <div style={{ minWidth: minW }}>
            <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, padding: "14px 22px", background: "#faf9fb", borderBottom: "1px solid #f2f2f4", font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".5px", textTransform: "uppercase" }}>
              {isPagado
                ? <><div>{t("Registro")}</div><div>{t("Estado")}</div><div>{t("Fecha de pago")}</div><div style={{ textAlign: "right" }}>{t("Importe")}</div><div /><div>{t("Modo de pago")}</div><div>{t("Concepto")}</div><div /></>
                : <><div>{t("Registro")}</div><div>{t("Estado")}</div><div>{t("Fecha futuro pago")}</div><div>{t("Concepto")}</div><div /></>}
            </div>

            {grupos.length === 0 && (
              <div style={{ padding: "40px 22px", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>{estado === "pagado" ? t("Aún no hay pagos registrados") : t("No hay pagos pendientes")}</div>
            )}

            {grupos.map(({ c, rows }) => {
              const abierto = isOpen(c._id);
              return (
                <div key={c._id}>
                  <div className="pg-ghead" onClick={() => setOpen((o) => ({ ...o, [c._id]: !abierto }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 22px", background: "#faf9fb", borderBottom: "1px solid #f6f6f8", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: abierto ? "none" : "rotate(-90deg)", transition: "transform .15s" }}><path d="M6 9l6 6 6-6" /></svg>
                    <span style={{ font: "500 14px Poppins", color: "#5a5a62" }}>{cap1(c.nombre)}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "#ecebef", color: "#8a8a90", font: "700 11px Poppins" }}>{rows.length}</span>
                  </div>
                  {abierto && rows.map(({ gasto, pago }: any) => {
                    const key = c._id + "|" + gasto._id + "|" + pago._id;
                    return (
                      <div key={key} className="pg-row" onClick={() => setModalTarget({ cat: c._id, gasto: gasto._id, pago: null })} style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, alignItems: "center", padding: "12px 22px", borderBottom: "1px solid #f6f6f8", cursor: "pointer" }}>
                        <div style={{ font: "600 13.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={gasto.nombre}>{gasto.nombre}</div>
                        <div><span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: chip.bg, color: chip.fg, borderRadius: 999, padding: "5px 12px", font: "600 11.5px Poppins", whiteSpace: "nowrap" }}>{chip.icon}{chip.label}</span></div>
                        {isPagado ? (
                          <>
                            <div style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{pago.fecha_pago || "—"}</div>
                            <div style={{ textAlign: "right", font: "700 13px Poppins", color: "#3A3A42" }}>{getCurrency(pago.importe || 0, cur)}</div>
                            <div />
                            <div style={{ font: "500 12.5px Poppins", color: "#6b6b72", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={pago.medio_pago}>{pago.medio_pago || "—"}</div>
                            <div style={{ font: "500 12.5px Poppins", color: "#6b6b72", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={pago.concepto}>{pago.concepto || "—"}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{pago.fecha_vencimiento || pago.fecha_pago || "—"}</div>
                            <div style={{ font: "500 12.5px Poppins", color: "#6b6b72", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={pago.concepto}>{pago.concepto || "—"}</div>
                          </>
                        )}
                        <div style={{ position: "relative", display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                          <button className="pg-dots" onClick={(e) => { e.stopPropagation(); setMenuAt(menuAt === key ? null : key); }} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c8c8ce", background: "none", border: "none", cursor: "pointer" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg></button>
                          {menuAt === key && (
                            <ClickAwayListener onClickAway={() => setMenuAt(null)}>
                              <div className="pg-menu" style={{ position: "absolute", top: -6, right: "calc(100% + 6px)", zIndex: 45, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 12, boxShadow: "0 14px 36px rgba(0,0,0,.16)", padding: 8, width: 150, textAlign: "left" }}>
                                <button onClick={() => { setMenuAt(null); if (!isAllowed()) { ht(); return; } setModalTarget({ cat: c._id, gasto: gasto._id, pago }); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", font: "500 12.5px Poppins", color: "#3A3A42", textAlign: "left" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>{t("Editar")}</button>
                                <button className="pg-del" onClick={() => { setMenuAt(null); delPago(c, gasto, pago); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", font: "500 12.5px Poppins", color: "#D83E7C", textAlign: "left" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>{t("Eliminar")}</button>
                              </div>
                            </ClickAwayListener>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagosStudio;
