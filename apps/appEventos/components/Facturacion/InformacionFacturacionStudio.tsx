import { FC, useEffect, useState } from "react";
import { AuthContextProvider } from "../../context";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";
import { flags } from "../../utils/flags";

const InformacionFacturacionStudio: FC = () => {
  const { t } = useTranslation();
  const { user, geoInfo, config } = AuthContextProvider() as any;
  const toast = useToast();
  const [v, setV] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApiBodas({ query: queries.getCustomer, variables: {}, development: config?.development }).then((result: any) => {
      setV({
        name: result?.name ?? user?.displayName ?? "",
        line1: result?.line1 ?? "",
        line2: result?.line2 ?? "",
        postalCode: result?.postalCode ?? "",
        city: result?.city ?? "",
        country: result?.country ?? flags.find((e: any) => e.pre?.toLowerCase() === geoInfo?.ipcountry?.toLowerCase())?.name?.toLowerCase() ?? "",
        email: result?.email ?? user?.email ?? "",
      });
    }).catch(() => setV({ name: user?.displayName ?? "", line1: "", line2: "", postalCode: "", city: "", country: "", email: user?.email ?? "" }));
  }, []);

  const set = (k: string, val: string) => setV((o: any) => ({ ...o, [k]: val }));

  const save = async () => {
    if (saving || !v) return;
    setSaving(true);
    try {
      const result: any = await fetchApiBodas({ query: queries.updateCustomer, variables: { args: { ...v } }, development: config?.development });
      if (result === "ok") toast("success", t("savecorrect"));
      else toast("success", t("savecorrect"));
    } catch { toast("error", t("Ha ocurrido un error")); } finally { setSaving(false); }
  };

  const inputSt: any = { width: "100%", padding: "12px 16px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", font: "500 13.5px Poppins", color: "#3A3A42", outline: "none" };
  const lblSt: any = { font: "600 12px Poppins", color: "#6b6b72", marginBottom: 7 };
  const opciones = flags.map((f: any) => f.name).sort();

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 16, width: "100%" }}>
      <style dangerouslySetInnerHTML={{ __html: ".if-in:focus{border-color:#EF5B94!important;}" }} />
      <section style={{ background: "#fff", border: "1px solid #ececef", borderRadius: 16, padding: "32px 36px", maxWidth: 680, width: "100%", fontFamily: "'Poppins',sans-serif" }}>
        <div style={{ font: "700 16px Poppins", color: "#3A3A42", marginBottom: 6 }}>{t("Información de facturación")}</div>
        <div style={{ font: "500 12.5px Poppins", color: "#8a8a90", lineHeight: 1.6, marginBottom: 24 }}>{t("Tu información de facturación puede ser diferente de la información de perfil de tu cuenta. La información de facturación aparece en las facturas.")}</div>
        {!v ? (
          <div style={{ padding: 40, textAlign: "center", color: "#a0a0a8", font: "500 13px Poppins" }}>{t("Cargando…")}</div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><div style={lblSt}>{t("Nombre y apellido o empresa")}</div><input className="if-in" value={v.name} onChange={(e) => set("name", e.target.value)} style={inputSt} /></div>
              <div><div style={lblSt}>{t("Dirección línea 1")}</div><input className="if-in" value={v.line1} onChange={(e) => set("line1", e.target.value)} placeholder={t("Calle y número") as string} style={inputSt} /></div>
              <div><div style={lblSt}>{t("Dirección línea 2")} <span style={{ font: "500 11px Poppins", color: "#b3b3ba" }}>({t("opcional")})</span></div><input className="if-in" value={v.line2} onChange={(e) => set("line2", e.target.value)} placeholder={t("Piso, oficina, urbanización…") as string} style={inputSt} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="if-grid">
                <div><div style={lblSt}>{t("Código postal")}</div><input className="if-in" value={v.postalCode} onChange={(e) => set("postalCode", e.target.value)} style={inputSt} /></div>
                <div><div style={lblSt}>{t("Ciudad")}</div><input className="if-in" value={v.city} onChange={(e) => set("city", e.target.value)} style={inputSt} /></div>
                <div><div style={lblSt}>{t("País")}</div><select className="if-in" value={v.country} onChange={(e) => set("country", e.target.value)} style={{ ...inputSt, cursor: "pointer", textTransform: "capitalize" }}><option value="">{t("Seleccionar país")}</option>{opciones.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><div style={lblSt}>{t("Email del destinatario de la factura")}</div><input className="if-in" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} style={inputSt} /></div>
            </div>
            <button onClick={save} disabled={saving} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", border: "none", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{t("Confirmar información de facturación")}</button>
          </>
        )}
      </section>
    </div>
  );
};

export default InformacionFacturacionStudio;
