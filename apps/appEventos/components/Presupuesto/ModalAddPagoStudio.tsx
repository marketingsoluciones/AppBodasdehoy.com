import { FC, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";

const cap1 = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s || "");
const parseEs = (s: string) => {
  const n = parseFloat(String(s).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};

interface Props { categoriaId: string; gastoId: string; onClose: () => void; pago?: any; }

const ModalAddPagoStudio: FC<Props> = ({ categoriaId, gastoId, onClose, pago }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const { config } = AuthContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = !!pago;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tab, setTab] = useState<"pago" | "prox">(pago?.estado === "pendiente" ? "prox" : "pago");
  const [importe, setImporte] = useState(pago ? String(pago.importe ?? "") : "");
  const [fecha, setFecha] = useState(() => pago ? (pago.fecha_pago || pago.fecha_vencimiento || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10));
  const [detOpen, setDetOpen] = useState(!!pago);
  const [medioPago, setMedioPago] = useState(pago?.medio_pago || "");
  const [pagadoPor, setPagadoPor] = useState(pago?.pagado_por && pago.pagado_por !== "wedding planer" ? pago.pagado_por : "");
  const [wp, setWp] = useState(pago?.pagado_por === "wedding planer");
  const [concepto, setConcepto] = useState(pago?.concepto || "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const cur = event?.presupuesto_objeto?.currency;
  const categoria = event?.presupuesto_objeto?.categorias_array?.find((c: any) => c._id === categoriaId);
  const gasto = categoria?.gastos_array?.find((g: any) => g._id === gastoId);
  const costeFinal = gasto?.coste_final || 0;
  const pagado = gasto?.pagado || 0;
  const porPagar = costeFinal - pagado;
  const esPago = tab === "pago";

  const save = async () => {
    if (!isAllowed()) { ht(); return; }
    const imp = parseEs(importe);
    if (!imp) { toast("error", t("Importe requerido")); return; }
    if (!fecha) { toast("error", t("Selecciona una fecha")); return; }
    if (saving) return;
    setSaving(true);
    try {
      let soporte: any = null;
      if (esPago && file) {
        try {
          const up: any = await fetchApiBodas({
            query: queries.singleUpload,
            variables: { file, development: config?.development || "bodasdehoy", eventId: event?._id, category: "payment" },
            type: "formData",
          });
          const url = up?.file?.publicUrls?.optimized400w ?? up?.file?.publicUrls?.optimized800w ?? up?.file?.publicUrls?.original ?? null;
          if (url) soporte = { image_url: url, medium_url: url, thumb_url: url };
        } catch { toast("error", t("Error al subir la imagen")); }
      }
      const pagoObj = {
        ...(editing ? pago : {}),
        importe: imp,
        estado: esPago ? "pagado" : "pendiente",
        fecha_pago: esPago ? fecha : "",
        fecha_vencimiento: esPago ? "" : fecha,
        pagado_por: esPago ? (wp ? "wedding planer" : pagadoPor) : "",
        medio_pago: esPago ? medioPago : "",
        concepto,
        ...(soporte ? { soporte } : {}),
      };
      const result: any = editing
        ? await fetchApiEventos({ query: queries.editPago, variables: { evento_id: event._id, categoria_id: categoriaId, gasto_id: gastoId, pago_id: pago._id, pagos_array: [pagoObj] } })
        : await fetchApiEventos({ query: queries.nuevoPago, variables: { evento_id: event._id, categoria_id: categoriaId, gasto_id: gastoId, pagos_array: [pagoObj] } });
      if (result?.success === false && result?.errors?.length) { toast("error", t("Ha ocurrido un error")); setSaving(false); return; }
      const po = result?.evento?.presupuesto_objeto;
      if (po) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po }));
      toast("success", editing ? t("Pago actualizado") : esPago ? t("Pago registrado") : t("Próximo pago programado"));
      onClose();
    } catch (e) {
      toast("error", t("Ha ocurrido un error"));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || typeof document === "undefined" || !gasto) return null;

  const chips = [
    { l: t("Coste final"), v: getCurrency(costeFinal, cur), bg: "#faf9fb", bd: "#f0f0f2", fg: "#3A3A42", lc: "#a0a0a8" },
    { l: t("Pagado"), v: getCurrency(pagado, cur), bg: "#E4F5EE", bd: "#B7E3CE", fg: "#1E8F63", lc: "#1E8F63" },
    { l: t("Por pagar"), v: getCurrency(porPagar, cur), bg: "#FBE4EF", bd: "#F6C4DB", fg: "#D83E7C", lc: "#D83E7C" },
  ];

  const Toggle: FC<{ on: boolean }> = ({ on }) => (
    <span style={{ width: 26, height: 14, borderRadius: 999, background: on ? "#EF5B94" : "#d8d8dd", position: "relative", display: "inline-block", transition: "background .15s", flex: "none" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 14 : 2, width: 10, height: 10, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
    </span>
  );

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,30,40,.38)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".ap-in:focus{border-color:#EF5B94!important;}.ap-close:hover{background:#faf9fb!important;color:#3A3A42!important;}.ap-pill:hover{background:#FBE4EF!important;}.ap-link:hover{color:#D83E7C!important;}.ap-cta:hover{background:#D83E7C!important;}.ap-drop:hover{border-color:#EF5B94!important;color:#EF5B94!important;background:#FEF7FA!important;}" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,.2)", width: "min(540px,92vw)", maxHeight: "86vh", overflow: "auto", padding: "24px 26px", animation: "grow .25s ease" }}>
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 11.5px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cap1(categoria?.nombre)} · {gasto?.nombre}</div>
            <div style={{ font: "700 18px Poppins", color: "#3A3A42", marginTop: 2 }}>{editing ? t("Editar pago") : esPago ? t("Añadir pago") : t("Añadir próximo pago")}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", flex: "none", marginTop: 2 }}>
            <button onClick={() => setTab("pago")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, font: "600 12px Poppins", color: esPago ? "#3A3A42" : "#a0a0a8", whiteSpace: "nowrap" }}><Toggle on={esPago} />{t("Añadir pago")}</button>
            <button onClick={() => setTab("prox")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, font: "600 12px Poppins", color: !esPago ? "#3A3A42" : "#a0a0a8", whiteSpace: "nowrap" }}><Toggle on={!esPago} />{t("Añadir próximo pago")}</button>
          </div>
          <button className="ap-close" title={t("Cerrar")} onClick={onClose} style={{ width: 30, height: 30, flex: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>

        {/* Resumen chips */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {chips.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 12, padding: "10px 14px" }}>
              <div style={{ font: "600 11px Poppins", color: c.lc }}>{c.l}</div>
              <div style={{ font: "700 14px Poppins", color: c.fg, marginTop: 2 }}>{c.v}</div>
            </div>
          ))}
        </div>

        {/* Importe + fecha */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12, marginTop: 16 }}>
          <div>
            <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Importe")}</div>
            <input className="ap-in" autoFocus value={importe} onChange={(e) => setImporte(e.target.value)} placeholder="0,00 €" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "700 16px Poppins", color: "#3A3A42", outline: "none" }} />
            {porPagar > 0 && (
              <button className="ap-pill" onClick={() => setImporte(String(porPagar))} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "#FCE7F0", border: "none", borderRadius: 999, padding: "6px 14px", font: "600 11.5px Poppins", color: "#D83E7C", cursor: "pointer", whiteSpace: "nowrap" }}>{t("Pagar todo lo pendiente")} ({getCurrency(porPagar, cur)})</button>
            )}
          </div>
          <div>
            <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{esPago ? t("Fecha de pago") : t("Fecha de futuro pago")}</div>
            <input className="ap-in" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: "100%", padding: "12px 12px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />
          </div>
        </div>

        {/* Detalles opcionales */}
        <button className="ap-link" onClick={() => setDetOpen((v) => !v)} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", font: "600 12.5px Poppins", color: "#EF5B94", padding: 0, whiteSpace: "nowrap" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: detOpen ? "rotate(90deg)" : "none", transition: "transform .18s" }}><path d="M9 6l6 6-6 6" /></svg>
          {t("Añadir detalles (opcional)")}
        </button>
        {detOpen && (
          <div>
            {esPago && (
              <div style={{ marginTop: 14 }}>
                <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Modo de pago")}</div>
                <input className="ap-in" value={medioPago} onChange={(e) => setMedioPago(e.target.value)} placeholder={t("Transferencia, tarjeta, efectivo…") as string} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />
              </div>
            )}
            {esPago && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ font: "600 12px Poppins", color: "#6b6b72" }}>{t("Pagado por")}</span>
                  <label onClick={() => setWp((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", background: wp ? "#EF5B94" : "#fff", border: `1.5px solid ${wp ? "#EF5B94" : "#d8d8dd"}`, color: "#fff", fontSize: 11 }}>{wp ? "✓" : ""}</span>
                    <span style={{ font: "500 12px Poppins", color: "#6b6b72" }}>{t("Wedding Planner")}</span>
                  </label>
                </div>
                {!wp && <input className="ap-in" value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)} placeholder={t("Nombre de quien paga") as string} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 6 }}>{t("Concepto del pago")}</div>
              <input className="ap-in" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder={t("Ej. Reserva, primer plazo…") as string} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E7E7EA", font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" }} />
            </div>
            {esPago && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ font: "600 12px Poppins", color: "#6b6b72" }}>{t("Cargar documento")}</span>
                  <span style={{ font: "600 10px Poppins", color: "#1E8F63", background: "#E4F5EE", borderRadius: 999, padding: "2px 8px" }}>PRO</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div className="ap-drop" onClick={() => fileRef.current?.click()} style={{ border: "1.5px dashed #d8d8dd", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: file ? "#EF5B94" : "#a0a0a8", font: "500 12px Poppins", cursor: "pointer", textAlign: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3M7 8l5-5 5 5M4 21h16" /></svg>
                  {file ? file.name : t("Arrastra o haz clic para subir el justificante")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <button className="ap-cta" onClick={save} disabled={saving} style={{ width: "100%", marginTop: 20, padding: 13, borderRadius: 10, background: "#EF5B94", color: "#fff", border: "none", font: "600 13.5px Poppins", cursor: saving ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", opacity: saving ? 0.7 : 1 }}>{editing ? t("Guardar cambios") : esPago ? t("Añadir pago") : t("Añadir próximo pago")}</button>
      </div>
    </div>,
    document.body
  );
};

export default ModalAddPagoStudio;
