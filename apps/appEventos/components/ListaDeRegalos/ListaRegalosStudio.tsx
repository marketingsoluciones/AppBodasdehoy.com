import { FC, useState } from "react";
import Head from "next/head";
import { EventContextProvider } from "../../context";
import BlockTitle from "../Utils/BlockTitle";
import ModalGuardarRegalo from "./ModalGuardarRegalo";
import FormGuardarRegalos from "../Forms/FormGuardarRegalos";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";
import { AmazonIcon, DineroIcon, CompartirIcon, ListaOne } from "../icons";

/**
 * ListaRegalosStudio — rediseño de "Lista de regalos" fiel al HTML "Lista de regalos.dc.html".
 * VERSIÓN REDUCIDA (solo lo que el backend soporta): guardar/compartir el ENLACE de la lista
 * externa (event.listaRegalos = URL, mutación guardarListaRegalos). NO incluye el grid de
 * ítems ni stats de dinero/contribuciones porque NO existen en backend (notificado al owner).
 * Gated tras ?studio=1. MISMO backend.
 */
const AMAZON_CREATE_URL = "https://www.amazon.com/-/es/registries/create-registry?ref_=gr_universal_landing";

export const ListaRegalosStudio: FC = () => {
  const { event } = EventContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);

  const link: string = event?.listaRegalos || "";
  const conectada = !!link;

  const guardEdit = () => { if (!isAllowed()) { ht(); return; } setShowForm(true); };
  const abrirLista = () => { if (link) window.open(link, "_blank", "noopener"); };
  const compartir = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); toast("success", "Enlace copiado"); }
    catch { toast("error", "No se pudo copiar el enlace"); }
  };

  const card = (n: string, icon: any, title: string, desc: string) => (
    <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "26px 24px", boxShadow: "0 6px 20px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FCE7F0", color: "#D83E7C", display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px Poppins", flex: "none" }}>{n}</div>
        <div style={{ color: "#EF5B94", display: "flex" }}>{icon}</div>
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
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@media(max-width:820px){.lr-hero{grid-template-columns:1fr !important}.lr-how{grid-template-columns:1fr !important}}` }} />

      <ModalGuardarRegalo set={setShowForm} state={showForm}>
        <FormGuardarRegalos set={setShowForm} state={showForm} />
      </ModalGuardarRegalo>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "22px 20px 60px", animation: "fadein .2s ease" }}>
        {/* Cabecera estándar */}
        <div style={{ marginBottom: 16 }}><BlockTitle title={"Lista de regalos"} /></div>

        {/* divisor rosa */}
        <div style={{ height: 3, borderRadius: 3, background: "linear-gradient(90deg,#EF5B94,#f9b6d1)", marginBottom: 22 }} />

        {!conectada ? (
          <>
            {/* HERO CONECTAR */}
            <div className="lr-hero" style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px rgba(0,0,0,.06)", padding: "44px 48px", display: "grid", gridTemplateColumns: "1fr auto", gap: 36, alignItems: "center", marginBottom: 26 }}>
              <div style={{ maxWidth: 520 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FCE7F0", color: "#D83E7C", font: "600 11px Poppins", letterSpacing: ".6px", padding: "6px 13px", borderRadius: 20, marginBottom: 14 }}>CONECTA CON AMAZON</div>
                <div style={{ font: "700 26px/1.3 Poppins", color: "#3A3A42", marginBottom: 10 }}>Crea la lista de regalos del evento</div>
                <div style={{ font: "400 13.5px/1.65 Poppins", color: "#8a8a90", marginBottom: 24 }}>Millones de opciones para elegir. Comparte el enlace con tus invitados para que puedan ver tu lista y elegir su regalo.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <a href={isAllowed() ? AMAZON_CREATE_URL : undefined} onClick={!isAllowed() ? (e) => { e.preventDefault(); ht(); } : undefined} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 22px", borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", textDecoration: "none" }}><span style={{ display: "flex", filter: "brightness(0) invert(1)" }}><AmazonIcon /></span>Crear la lista en Amazon</a>
                  <button onClick={guardEdit} style={{ padding: "12px 20px", borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>Ya tengo una lista · Vincular</button>
                </div>
              </div>
              <div style={{ width: 190, height: 190, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 132, height: 132, borderRadius: "50%", background: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 34px rgba(239,91,148,.35)", color: "#fff", transform: "scale(2.2)" }}><AmazonIcon /></div>
              </div>
            </div>

            {/* CÓMO FUNCIONA */}
            <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 14 }}>¿Cómo funciona la lista?</div>
            <div className="lr-how" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {card("1", <ListaOne />, "Crea la lista", "Añade los regalos del evento entre millones de opciones de Amazon.")}
              {card("2", <CompartirIcon />, "Compártela", "Envía el enlace a tus invitados para que puedan ver la lista y elegir su regalo.")}
              {card("3", <DineroIcon />, "Recibe el regalo", "Tus invitados eligen y compran el regalo directamente desde tu lista.")}
            </div>
          </>
        ) : (
          <div style={{ animation: "fadein .25s ease" }}>
            {/* barra lista conectada */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "9px 16px" }}>
                <span style={{ display: "flex", color: "#EF5B94" }}><AmazonIcon /></span>
                <span style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>Lista de regalos vinculada</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2FB37E" }} />
              </div>
              <button onClick={abrirLista} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14L21 3" /></svg>Ver lista</button>
              <button onClick={compartir} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}><span style={{ display: "flex", color: "#6b6b72" }}><CompartirIcon /></span>Compartir lista</button>
              <button onClick={guardEdit} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>Editar enlace</button>
            </div>

            {/* enlace + nota (grid de ítems y stats de dinero pendientes de backend) */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "22px 24px", boxShadow: "0 6px 20px rgba(0,0,0,.05)" }}>
              <div style={{ font: "600 12px Poppins", color: "#8a8a90", marginBottom: 8 }}>Tus invitados verán tu lista en este enlace:</div>
              <a href={isAllowed() ? link : undefined} onClick={!isAllowed() ? (e) => { e.preventDefault(); ht(); } : undefined} target="_blank" rel="noopener noreferrer" style={{ font: "500 13px Poppins", color: "#EF5B94", wordBreak: "break-all", textDecoration: "none" }}>{link}</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
