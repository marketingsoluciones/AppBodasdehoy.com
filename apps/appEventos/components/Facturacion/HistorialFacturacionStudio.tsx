import { FC, useEffect, useState } from "react";
import { AuthContextProvider } from "../../context";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { getCurrency } from "../../utils/Funciones";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const fmtFecha = (created: any) => {
  if (!created) return "—";
  try { const d = new Date(created < 1e12 ? created * 1000 : created); return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; } catch { return "—"; }
};
const ST: Record<string, { st: string; bg: string; dot: string; fg: string }> = {
  paid: { st: "Pagada", bg: "#E4F5EE", dot: "#2FB37E", fg: "#1E8F63" },
  open: { st: "Pendiente", bg: "#FBF0DA", dot: "#E0A32B", fg: "#B07E14" },
  draft: { st: "Borrador", bg: "#f2f2f4", dot: "#a0a0a8", fg: "#8a8a90" },
  void: { st: "Anulada", bg: "#f2f2f4", dot: "#a0a0a8", fg: "#8a8a90" },
  uncollectible: { st: "Incobrable", bg: "#FBE4EF", dot: "#D83E7C", fg: "#D83E7C" },
};
const COLS = "1fr 170px 150px 150px 130px";

const HistorialFacturacionStudio: FC = () => {
  const { config } = AuthContextProvider() as any;
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiBodas({ query: queries.getInvoices, variables: {}, development: config?.development })
      .then((result: any) => setInvoices(result?.results || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  const docIcon = (size: number, stroke: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
  );

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#a0a0a8", font: "500 13px Poppins", fontFamily: "'Poppins',sans-serif" }}>Cargando…</div>;

  if (invoices.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 16, fontFamily: "'Poppins',sans-serif" }}>
        <section style={{ background: "#fff", border: "1px solid #ececef", borderRadius: 16, padding: "44px 50px", maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{docIcon(26, 1.9)}</div>
          <div style={{ font: "700 18px Poppins", color: "#3A3A42", marginBottom: 8 }}>Aún no hay facturas disponibles</div>
          <div style={{ font: "500 13px Poppins", color: "#8a8a90", lineHeight: 1.6, maxWidth: 340 }}>Cuando se genere tu primera factura aparecerá aquí y podrás descargarla en PDF.</div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16, fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ border: "1px solid #f0f0f2", borderRadius: 15, overflow: "hidden", background: "#fff" }}>
        <div style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "15px 20px", background: "#faf9fb", borderBottom: "1px solid #f0f0f2", font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".5px", textTransform: "uppercase" }}>
          <div>Factura</div><div>Fecha</div><div>Importe</div><div>Estado</div><div>Acción</div>
        </div>
        {invoices.map((r: any, i: number) => {
          const st = ST[r.status] || ST.open;
          return (
            <div key={r.number || i} style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #f6f6f8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FCE7F0", flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>{docIcon(15, 2)}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", font: "600 13.5px Poppins", color: "#3A3A42", lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.number || "Factura"}</span>
                  <span style={{ display: "block", font: "500 12px Poppins", color: "#a0a0a8", lineHeight: 1.35 }}>Suscripción</span>
                </span>
              </div>
              <div style={{ font: "500 13px Poppins", color: "#6b6b72" }}>{fmtFecha(r.created)}</div>
              <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{getCurrency((r.amount || 0) / 100, r.currency)}</div>
              <div><span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 999, background: st.bg }}><span style={{ width: 7, height: 7, borderRadius: 999, background: st.dot }} /><span style={{ font: "600 12px Poppins", color: st.fg }}>{st.st}</span></span></div>
              <div>
                <button onClick={() => { const url = r.invoicePdf || r.hostedInvoiceUrl; if (url) window.open(url, "_blank"); }} disabled={!r.invoicePdf && !r.hostedInvoiceUrl} style={{ padding: "9px 20px", borderRadius: 999, border: "1.5px solid #EF5B94", background: "#fff", font: "600 12.5px Poppins", color: "#EF5B94", cursor: (r.invoicePdf || r.hostedInvoiceUrl) ? "pointer" : "default", opacity: (r.invoicePdf || r.hostedInvoiceUrl) ? 1 : 0.5 }}>Descargar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistorialFacturacionStudio;
