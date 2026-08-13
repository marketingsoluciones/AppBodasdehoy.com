import { FC, useState } from "react";
import { EventContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";
import { EntityNotesSection } from "../Notes/EntityNotesSection";
import ModalLeft from "../Utils/ModalLeft";
import FormAddPago from "../Forms/FormAddPago";

// Nombre de categoría: iniciar con mayúscula (solo primera letra).
const cap1 = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s || "");

interface Props {
  categoriaId: string;
  onClose: () => void;
}

const DetalleCategoriaStudio: FC<Props> = ({ categoriaId, onClose }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const [pagoGasto, setPagoGasto] = useState<string | null>(null);

  const cur = event?.presupuesto_objeto?.currency;
  const categoria = event?.presupuesto_objeto?.categorias_array?.find((c: any) => c._id === categoriaId);
  const gastos: any[] = (categoria?.gastos_array || []).filter((g: any) => g?.estatus !== false);

  if (!categoria) return null;

  const catTot = categoria.coste_final || 0;
  const catPag = categoria.pagado || 0;
  const catPen = catTot - catPag;

  const applyPO = (result: any, fallback?: (prev: any) => any) => {
    const po = result?.evento?.presupuesto_objeto;
    if (po) setEvent((prev: any) => ({ ...prev, presupuesto_objeto: po }));
    else if (fallback) setEvent(fallback);
  };

  const addServicio = async () => {
    if (!isAllowed()) { ht(); return; }
    try {
      const result: any = await fetchApiEventos({
        query: queries.nuevoGasto,
        variables: { evento_id: event._id, categoria_id: categoria._id, nombre: t("Nueva partida de gasto") },
      });
      if (result?.success === false && result?.errors?.length) { toast("error", t("Ha ocurrido un error")); return; }
      applyPO(result);
    } catch (e) { toast("error", t("Ha ocurrido un error")); }
  };

  const deleteGasto = async (gasto: any) => {
    if (!isAllowed()) { ht(); return; }
    try {
      const result: any = await fetchApiEventos({
        query: queries.borrarGasto,
        variables: { evento_id: event._id, categoria_id: categoria._id, gasto_id: gasto._id },
      });
      applyPO(result, (prev: any) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map((c: any) => c._id !== categoria._id ? c : { ...c, gastos_array: (c.gastos_array || []).filter((g: any) => g._id !== gasto._id) }),
        },
      }));
      toast("success", t("Partida eliminada"));
    } catch (e) { toast("error", t("Ha ocurrido un error")); }
  };

  const openPago = (gasto: any) => {
    if (!isAllowed()) { ht(); return; }
    setPagoGasto(gasto._id);
  };

  const COL = "minmax(110px,1.3fr) 74px 72px 74px 58px";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .dc-row:hover{background:#faf9fb;}
        .dc-pag:hover{background:#E4F5EE;text-decoration:underline;}
        .dc-add:hover{background:#E4F5EE!important;color:#1E8F63!important;}
        .dc-del:hover{background:#FBE4EF!important;color:#D83E7C!important;}
        .dc-close:hover{background:#faf9fb!important;color:#3A3A42!important;}
        .dc-link:hover{color:#D83E7C!important;}
      `}} />

      {/* Modal Añadir pago (reusa el form existente) */}
      {pagoGasto && (
        <ModalLeft state={!!pagoGasto} set={() => setPagoGasto(null)}>
          <FormAddPago GastoID={pagoGasto} cate={categoria._id} setGastoID={() => setPagoGasto(null)} />
        </ModalLeft>
      )}

      {/* TARJETA DETALLE */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", overflow: "hidden", marginBottom: 18, fontFamily: "'Poppins',sans-serif" }}>
        {/* Cabecera */}
        <div style={{ position: "relative", padding: "18px 20px 14px", borderBottom: "1px solid #f2f2f4" }}>
          <div style={{ textAlign: "center", font: "700 16px Poppins", color: "#EF5B94" }}>{cap1(categoria.nombre)}</div>
          <button className="dc-close" title={t("Cerrar")} onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>

        {/* Encabezado columnas con totales */}
        <div style={{ display: "grid", gridTemplateColumns: COL, gap: 6, padding: "11px 16px", background: "#faf9fb", borderBottom: "1px solid #f2f2f4", font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".4px", textTransform: "uppercase" }}>
          <div>{t("Partida de gasto")}</div>
          <div style={{ textAlign: "right" }}>{t("Coste total")}<div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", textTransform: "none", letterSpacing: 0 }}>{getCurrency(catTot, cur)}</div></div>
          <div style={{ textAlign: "right" }}>{t("Pagado")}<div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", textTransform: "none", letterSpacing: 0 }}>{getCurrency(catPag, cur)}</div></div>
          <div style={{ textAlign: "right" }}>{t("Por pagar")}<div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", textTransform: "none", letterSpacing: 0 }}>{getCurrency(catPen, cur)}</div></div>
          <div />
        </div>

        {/* Filas de partidas */}
        {gastos.length === 0 && (
          <div style={{ padding: "26px 16px", textAlign: "center", font: "500 12px Poppins", color: "#a0a0a8" }}>{t("Aún no hay partidas de gasto")}</div>
        )}
        {gastos.map((g: any) => {
          const tot = g.coste_final || 0;
          const pag = g.pagado || 0;
          const pen = tot - pag;
          return (
            <div key={g._id} className="dc-row" style={{ display: "grid", gridTemplateColumns: COL, gap: 6, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f4f4f6" }}>
              <div style={{ font: "500 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={g.nombre}>{g.nombre}</div>
              <div style={{ textAlign: "right", font: "600 12px Poppins", color: "#3A3A42" }}>{getCurrency(tot, cur)}</div>
              <div className="dc-pag" title={t("Añadir pago")} onClick={() => openPago(g)} style={{ textAlign: "right", font: "600 12px Poppins", color: "#2FB37E", cursor: "pointer", borderRadius: 6, padding: "2px 4px", margin: "-2px -4px" }}>{getCurrency(pag, cur)}</div>
              <div style={{ textAlign: "right", font: "600 12px Poppins", color: pen === 0 ? "#8a8a90" : "#D83E7C" }}>{getCurrency(pen, cur)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                <button className="dc-add" title={t("Añadir pago")} onClick={() => openPago(g)} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c8c8ce", background: "none", border: "none", cursor: "pointer", font: "700 14px Poppins", lineHeight: 1 }}>＋</button>
                <button className="dc-del" title={t("Eliminar partida")} onClick={() => deleteGasto(g)} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c8c8ce", background: "none", border: "none", cursor: "pointer" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg></button>
              </div>
            </div>
          );
        })}

        {/* Añadir servicio */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f2f2f4" }}>
          <button className="dc-link" onClick={addServicio} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", font: "600 12.5px Poppins", color: "#EF5B94", padding: 0, whiteSpace: "nowrap" }}><span style={{ width: 18, height: 18, borderRadius: "50%", background: "#FCE7F0", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1 }}>＋</span>{t("Añadir servicio")}</button>
        </div>

        {/* Total */}
        <div style={{ display: "grid", gridTemplateColumns: COL, gap: 6, alignItems: "center", padding: "13px 16px", background: "#EF5B94" }}>
          <div style={{ font: "700 13px Poppins", color: "#fff" }}>{t("Total")}</div>
          <div style={{ textAlign: "right", font: "700 12px Poppins", color: "#fff" }}>{getCurrency(catTot, cur)}</div>
          <div style={{ textAlign: "right", font: "700 12px Poppins", color: "#fff" }}>{getCurrency(catPag, cur)}</div>
          <div style={{ textAlign: "right", font: "700 12px Poppins", color: "#fff" }}>{getCurrency(catPen, cur)}</div>
          <div />
        </div>
      </div>

      {/* NOTAS INTERNAS (colapsable, backend real) */}
      {categoria._id && (
        <EntityNotesSection entityType="ENTITY" entityId={categoria._id} entityName={categoria?.nombre || "Categoría"} />
      )}
    </>
  );
};

export default DetalleCategoriaStudio;
