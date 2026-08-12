import { FC, ReactNode, useState } from "react";
import Head from "next/head";
import BlockTitle from "../Utils/BlockTitle";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";

/**
 * ListaRegalosStudio — rediseño de "Lista de regalos" IDÉNTICO al HTML "Lista de regalos.dc.html"
 * (mismos iconos, botones, textos, grid). Es la capa VISUAL/prototipo: los datos de regalos y los
 * importes son de muestra (como el HTML) hasta que exista backend de aportaciones/ítems — se
 * conectará después (decisión del owner: "no le prestes atención al backend, ya luego conectamos").
 * Gated tras ?studio=1.
 */
const AMAZON_CREATE_URL = "https://www.amazon.com/-/es/registries/create-registry?ref_=gr_universal_landing";

// Iconos EXACTOS del HTML
const amazon = (color: string, size: number): ReactNode => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M13.2 4.2c-2.6 0-4.6 1.2-5 3.4l2.6.3c.3-1 1.1-1.6 2.2-1.6 1.3 0 2 .7 2 1.9v.4c-.9.1-2.4.2-3.6.6-1.7.5-3 1.5-3 3.4 0 2 1.5 3.2 3.5 3.2 1.4 0 2.5-.5 3.3-1.5.4.8 1 1.4 1.2 1.4l1.8-1.5c-.5-.6-.8-1.3-.8-2.3V8.4c0-2.7-1.7-4.2-4.2-4.2zm1.8 6.6c0 1.9-1 3-2.5 3-.9 0-1.5-.5-1.5-1.4 0-1.5 1.9-1.9 4-2.1v.5z" />
    <path d="M19.9 17.4c-2.1 1.6-5 2.4-7.6 2.4-3.5 0-6.7-1.3-9.1-3.5-.2-.2 0-.4.2-.3 2.6 1.5 5.9 2.5 9.2 2.5 2.3 0 4.8-.5 7-1.4.4-.2.7.2.3.3z" />
  </svg>
);
const icoLista = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.3" /><circle cx="3.5" cy="12" r="1.3" /><circle cx="3.5" cy="18" r="1.3" /></svg>;
const icoShareP = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" /><path d="M8.2 10.9l6.6-3.8M8.2 13.1l6.6 3.8" /></svg>;
const icoMoney = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 12h.01M18 12h.01" /></svg>;
const shareIcon = (color: string): ReactNode => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" /><path d="M8.2 10.9l6.6-3.8M8.2 13.1l6.6 3.8" /></svg>;
const giftIco = <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#c4c4cc" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7c-2.5 0-4.5-1.3-4.5-3S9 1.6 12 7zM12 7c2.5 0 4.5-1.3 4.5-3S15 1.6 12 7z" /></svg>;

const REGALOS = [
  { name: "Robot de cocina multifunción", price: "349 €", got: 349, total: 349 },
  { name: "Juego de maletas · 3 piezas", price: "220 €", got: 220, total: 220 },
  { name: "Cafetera espresso automática", price: "189 €", got: 120, total: 189 },
  { name: "Vajilla de porcelana · 18 piezas", price: "145 €", got: 60, total: 145 },
  { name: "Set de copas de cristal", price: "89 €", got: 0, total: 89 },
  { name: "Manta de lana merino", price: "75 €", got: 0, total: 75 },
];
const eur = (n: number) => n.toLocaleString("es-ES") + " €";

export const ListaRegalosStudio: FC = () => {
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const [connected, setConnected] = useState(false);

  const conectar = () => { if (!isAllowed()) { ht(); return; } setConnected(true); };
  const proximamente = () => toast("success", "Se conectará con tu lista próximamente");

  const totV = REGALOS.reduce((a, r) => a + r.total, 0);
  const gotV = REGALOS.reduce((a, r) => a + r.got, 0);
  const conseguidos = REGALOS.filter((r) => r.got >= r.total).length;
  const valorTotal = connected ? eur(totV) : "0,00 €";
  const conseguido = connected ? eur(gotV) : "0,00 €";
  const pendiente = connected ? eur(totV - gotV) : "0,00 €";
  const saldo = connected ? eur(gotV) : "0,00 €";

  const card = (n: string, icon: ReactNode, title: string, desc: string) => (
    <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "26px 24px", boxShadow: "0 6px 20px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FCE7F0", color: "#D83E7C", display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px Poppins", flex: "none" }}>{n}</div>
        {icon}
      </div>
      <div style={{ font: "600 14px Poppins", color: "#3A3A42", marginBottom: 6 }}>{title}</div>
      <div style={{ font: "400 12.5px/1.6 Poppins", color: "#8a8a90" }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ background: "#f1f1f4", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@media(max-width:820px){.lr-hero{grid-template-columns:1fr !important}.lr-how,.lr-grid{grid-template-columns:1fr !important}}@media(max-width:1100px){.lr-grid{grid-template-columns:repeat(2,1fr) !important}}` }} />

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "22px 20px 60px", animation: "fadein .2s ease" }}>
        {/* Cabecera estándar */}
        <div style={{ marginBottom: 16 }}><BlockTitle title={"Lista de regalos"} /></div>

        {/* STATS ROW */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ font: "800 22px Poppins", color: "#EF5B94" }}>{valorTotal} <span style={{ font: "600 14px Poppins", color: "#3A3A42" }}>Valor total</span></div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#E4F5EE", color: "#2FB37E", font: "600 12px Poppins", padding: "8px 14px", borderRadius: 20 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2FB37E" }} />Conseguido {conseguido}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#FBF0DA", color: "#E0A32B", font: "600 12px Poppins", padding: "8px 14px", borderRadius: 20 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E0A32B" }} />Pendiente {pendiente}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "8px 14px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 11h18" /></svg>
            <span style={{ font: "500 12px Poppins", color: "#8a8a90" }}>Saldo transferible</span>
            <span style={{ font: "700 13px Poppins", color: "#3A3A42" }}>{saldo}</span>
            <button onClick={connected ? proximamente : undefined} style={{ marginLeft: 4, padding: "6px 12px", borderRadius: 9, background: "#FCE7F0", color: "#D83E7C", font: "600 11.5px Poppins", border: "none", cursor: connected ? "pointer" : "default", opacity: connected ? 1 : .45 }}>Transferir</button>
          </div>
        </div>

        {/* divisor rosa */}
        <div style={{ height: 3, borderRadius: 3, background: "linear-gradient(90deg,#EF5B94,#f9b6d1)", marginBottom: 22 }} />

        {!connected ? (
          <>
            {/* HERO CONECTAR */}
            <div className="lr-hero" style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px rgba(0,0,0,.06)", padding: "44px 48px", display: "grid", gridTemplateColumns: "1fr auto", gap: 36, alignItems: "center", marginBottom: 26 }}>
              <div style={{ maxWidth: 520 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FCE7F0", color: "#D83E7C", font: "600 11px Poppins", letterSpacing: ".6px", padding: "6px 13px", borderRadius: 20, marginBottom: 14 }}>CONECTA CON AMAZON</div>
                <div style={{ font: "700 26px/1.3 Poppins", color: "#3A3A42", marginBottom: 10 }}>Crea la lista de regalos del evento</div>
                <div style={{ font: "400 13.5px/1.65 Poppins", color: "#8a8a90", marginBottom: 24 }}>Millones de opciones para elegir. Los invitados podrán comprar el regalo o aportar dinero, y el saldo se transfiere a los anfitriones del evento.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <button onClick={conectar} style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 22px", borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>{amazon("#fff", 18)}Crear la lista en Amazon</button>
                  <button onClick={conectar} style={{ padding: "12px 20px", borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>Ya tengo una lista · Vincular</button>
                </div>
              </div>
              <div style={{ width: 190, height: 190, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 132, height: 132, borderRadius: "50%", background: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 34px rgba(239,91,148,.35)" }}>{amazon("#fff", 72)}</div>
              </div>
            </div>

            {/* CÓMO FUNCIONA */}
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 14 }}>¿Cómo funciona la lista?</div>
            <div className="lr-how" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {card("1", icoLista, "Crea la lista", "Añade los regalos del evento entre millones de opciones de Amazon.")}
              {card("2", icoShareP, "Compártela", "Envíala a los invitados para que puedan participar y elegir su regalo.")}
              {card("3", icoMoney, "Recibe el dinero", "El saldo conseguido se transfiere a la cuenta de los anfitriones cuando quieran.")}
            </div>
          </>
        ) : (
          <div style={{ animation: "fadein .25s ease" }}>
            {/* barra lista conectada */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "9px 16px" }}>
                {amazon("#EF5B94", 18)}
                <span style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>Lista de Amazon vinculada</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2FB37E" }} />
              </div>
              <button onClick={proximamente} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Añadir regalos</button>
              <button onClick={proximamente} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>{shareIcon("#6b6b72")}Compartir lista</button>
              <div style={{ flex: 1 }} />
              <div style={{ font: "500 12px Poppins", color: "#a0a0a8" }}>{conseguidos} de {REGALOS.length} regalos conseguidos</div>
            </div>

            {/* GRID DE REGALOS */}
            <div className="lr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {REGALOS.map((r, i) => {
                const pct = Math.round((r.got / r.total) * 100);
                const done = pct >= 100;
                const barColor = done ? "#2FB37E" : "#EF5B94";
                const aportado = done ? `Aportado ${r.got} €` : (r.got > 0 ? `Aportado ${r.got} € · ${pct}%` : "Sin aportaciones");
                return (
                  <div key={i} style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,.04)", display: "flex", flexDirection: "column" }}>
                    <div style={{ height: 120, background: "#f7f7f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4c4cc" }}>{giftIco}</div>
                    <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ font: "600 13px/1.4 Poppins", color: "#3A3A42" }}>{r.name}</div>
                        <div style={{ font: "700 13.5px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>{r.price}</div>
                      </div>
                      <div style={{ height: 6, borderRadius: 6, background: "#f2f2f4", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 6, background: barColor, width: `${pct}%` }} /></div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ font: "500 11.5px Poppins", color: "#8a8a90" }}>{aportado}</span>
                        {done
                          ? <span style={{ display: "flex", alignItems: "center", gap: 5, background: "#E4F5EE", color: "#2FB37E", font: "600 11px Poppins", padding: "4px 10px", borderRadius: 14 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2FB37E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>Conseguido</span>
                          : <span style={{ font: "600 11px Poppins", color: "#E0A32B" }}>Faltan {r.total - r.got} €</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
