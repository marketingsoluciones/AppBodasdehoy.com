import Head from "next/head";
import { FC, ReactNode, useState } from "react";
import FormGuardarRegalos from "../Forms/FormGuardarRegalos";
import { useAllowed } from "../../hooks/useAllowed";
import { EventContextProvider } from "../../context";
import ModalGuardarRegalo from "./ModalGuardarRegalo";

/**
 * ListaRegalosStudioMovil — vista MÓVIL de "Lista de regalos" fiel a Lista_regalos_movil.dc.html
 * (md:hidden). Escritorio intacto: lo sigue sirviendo ListaRegalosStudio en hidden md:block.
 *
 * MISMO BACKEND que ya usaba el módulo — no se inventa ninguna fuente nueva:
 *   · `event.listaRegalos` (JSON en el schema de api-mcp) decide qué estado se pinta.
 *   · Vincular abre FormGuardarRegalos, que persiste con la mutation `guardarListaRegalos`
 *     (variable_reemplazar:"listaRegalos") — exactamente igual que en escritorio.
 *   · El parseo de los regalos replica el de Resumen/BlockListaRegalos.tsx (QA GIF-01):
 *     la shape no está tipada, así que se leen las variantes conocidas de forma defensiva.
 *
 * Del HTML se omiten a propósito dos cosas que pertenecen al SIMULADOR, no a la app:
 *   · el padding-top de 64px (es el notch del marco iPhone; aquí ya hay cabecera de app)
 *   · la barra de navegación inferior (la app monta la suya en el layout)
 */

const AMAZON_CREATE_URL = "https://www.amazon.com/-/es/registries/create-registry?ref_=gr_universal_landing";

const amazon = (color: string, size: number): ReactNode => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M13.2 4.2c-2.6 0-4.6 1.2-5 3.4l2.6.3c.3-1 1.1-1.6 2.2-1.6 1.3 0 2 .7 2 1.9v.4c-.9.1-2.4.2-3.6.6-1.7.5-3 1.5-3 3.4 0 2 1.5 3.2 3.5 3.2 1.4 0 2.5-.5 3.3-1.5.4.8 1 1.4 1.2 1.4l1.8-1.5c-.5-.6-.8-1.3-.8-2.3V8.4c0-2.7-1.7-4.2-4.2-4.2zm1.8 6.6c0 1.9-1 3-2.5 3-.9 0-1.5-.5-1.5-1.4 0-1.5 1.9-1.9 4-2.1v.5z" />
    <path d="M19.9 17.4c-2.1 1.6-5 2.4-7.6 2.4-3.5 0-6.7-1.3-9.1-3.5-.2-.2 0-.4.2-.3 2.6 1.5 5.9 2.5 9.2 2.5 2.3 0 4.8-.5 7-1.4.4-.2.7.2.3.3z" />
  </svg>
);

const icoShare = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="12" r="2.6" /><circle cx="17.5" cy="5.5" r="2.6" /><circle cx="17.5" cy="18.5" r="2.6" />
    <path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4" />
  </svg>
);

const icoShareSmall = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" />
    <path d="M8.2 10.9l6.6-3.8M8.2 13.1l6.6 3.8" />
  </svg>
);

const icoCard = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8} strokeLinecap="round">
    <rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 11h18" />
  </svg>
);

const icoGift = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c4c4cc" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7c-2.5 0-4.5-1.3-4.5-3S9 1.6 12 7zM12 7c2.5 0 4.5-1.3 4.5-3S15 1.6 12 7z" />
  </svg>
);

const icoCheck = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2FB37E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const PASOS = [
  { n: "1", tit: "Crea la lista", sub: "Añade regalos entre millones de opciones de Amazon." },
  { n: "2", tit: "Compártela", sub: "Envíala a los invitados para que elijan su regalo." },
  { n: "3", tit: "Recibe el dinero", sub: "El saldo se transfiere a los anfitriones cuando quieran." },
];

/** Parseo defensivo de event.listaRegalos — mismo criterio que Resumen/BlockListaRegalos. */
const leerRegalos = (lista: any) => {
  const items: any[] = Array.isArray(lista?.items) ? lista.items
    : Array.isArray(lista?.regalos) ? lista.regalos
      : Array.isArray(lista) ? lista
        : [];
  return items.map((it: any) => {
    const contribs = Array.isArray(it?.contribuciones) ? it.contribuciones : [];
    const contribSum = contribs.reduce((s: number, c: any) => s + (Number(c?.monto ?? c?.importe ?? 0) || 0), 0);
    const conseguido = contribSum || Number(it?.conseguido ?? 0) || 0;
    const total = Number(it?.precio ?? it?.valor ?? it?.total ?? 0) || 0;
    const pct = total > 0 ? Math.min(Math.round((conseguido / total) * 100), 100) : 0;
    return {
      nombre: String(it?.nombre ?? it?.name ?? it?.titulo ?? "Regalo"),
      conseguido,
      total,
      pct,
      done: total > 0 && conseguido >= total,
    };
  });
};

export const ListaRegalosStudioMovil: FC = () => {
  const { event } = EventContextProvider() as any;
  const [isAllowed, ht] = useAllowed();
  const [showForm, setShowForm] = useState(false);

  const vincular = () => { if (!isAllowed()) { ht(); return; } setShowForm(true); };

  const lista: any = event?.listaRegalos ?? null;
  const regalos = leerRegalos(lista);
  // "Conectada" = hay lista guardada en el evento (enlace o items). Sin eso, estado inicial.
  const conectada = !!lista && (regalos.length > 0 || typeof lista === "string" || !!lista?.url || !!lista?.enlace);

  const cur = event?.presupuesto_objeto?.currency ?? "€";
  const fmt = (n: number) => `${Math.round(n).toLocaleString("es-ES")} ${cur}`;
  const valorTotal = regalos.reduce((a, r) => a + r.total, 0);
  const conseguido = regalos.reduce((a, r) => a + r.conseguido, 0);
  const pendiente = Math.max(0, valorTotal - conseguido);
  const nDone = regalos.filter((r) => r.done).length;

  const compartir = () => {
    const url = typeof lista === "string" ? lista : (lista?.url ?? lista?.enlace ?? "");
    if (!url) return;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share({ title: "Lista de regalos", url }).catch(() => { /* cancelado */ });
    } else if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="md:hidden" style={{ background: "#F6F5F7", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes lrm-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.lrm-hs{scrollbar-width:none;-ms-overflow-style:none;}.lrm-hs::-webkit-scrollbar{display:none;height:0;width:0;}" }} />

      {showForm && (
        <ModalGuardarRegalo set={setShowForm} state={showForm}>
          <FormGuardarRegalos set={setShowForm} state={showForm} />
        </ModalGuardarRegalo>
      )}

      <div style={{ maxWidth: 420, margin: "0 auto", position: "relative", paddingBottom: 40 }}>

        {/* ── CABECERA DEL MÓDULO (sticky) ── */}
        <div style={{ background: "#fff", padding: "13px 16px 10px", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>Lista de regalos</div>
              <div style={{ font: "500 10px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ color: "#EF5B94", fontWeight: 600 }}>{(event?.tipo || "EVENTO").toUpperCase()}</span> · {event?.nombre}
              </div>
            </div>
            {conectada && (
              <div onClick={compartir} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", color: "#EF5B94", cursor: "pointer" }}>
                {icoShare}
              </div>
            )}
          </div>
        </div>

        {/* ── ESTADO SIN CONECTAR ── */}
        {!conectada && (
          <>
            <div style={{ padding: "26px 20px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", animation: "lrm-fade .25s ease" }}>
              <div style={{ display: "inline-flex", alignItems: "center", background: "#FCE7F0", color: "#D83E7C", font: "600 10px Poppins", letterSpacing: ".6px", padding: "5px 12px", borderRadius: 16, marginBottom: 12 }}>CONECTA CON AMAZON</div>
              <div style={{ font: "700 20px/1.3 Poppins", color: "#3A3A42", marginBottom: 8 }}>Crea la lista de regalos del evento</div>
              <div style={{ font: "400 12.5px/1.65 Poppins", color: "#8a8a90", marginBottom: 22 }}>Millones de opciones. Los invitados compran el regalo o aportan dinero, y el saldo se transfiere a los anfitriones.</div>
              <a
                href={isAllowed() ? AMAZON_CREATE_URL : undefined}
                onClick={!isAllowed() ? (e) => { e.preventDefault(); ht(); } : undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 14, borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", textDecoration: "none" }}
              >
                {amazon("#fff", 17)}Crear la lista en Amazon
              </a>
              <button onClick={vincular} style={{ width: "100%", marginTop: 10, padding: 13, borderRadius: 12, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>Ya tengo una lista · Vincular</button>
            </div>

            <div style={{ padding: "28px 20px 0" }}>
              <div style={{ font: "700 13.5px Poppins", color: "#3A3A42", marginBottom: 12 }}>¿Cómo funciona?</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {PASOS.map((p) => (
                  <div key={p.n} style={{ display: "flex", alignItems: "center", gap: 13, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, padding: "14px 16px", boxShadow: "0 3px 10px rgba(0,0,0,.03)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FCE7F0", color: "#D83E7C", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px Poppins", flex: "none" }}>{p.n}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>{p.tit}</div>
                      <div style={{ font: "400 11px/1.5 Poppins", color: "#8a8a90" }}>{p.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── ESTADO CONECTADA ── */}
        {conectada && (
          <div style={{ animation: "lrm-fade .25s ease" }}>
            {/* resumen */}
            <div style={{ padding: "16px 16px 4px", display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ font: "800 24px Poppins", color: "#EF5B94" }}>{fmt(valorTotal)}</span>
              <span style={{ font: "600 13.5px Poppins", color: "#3A3A42" }}>valor total</span>
              <span style={{ font: "500 11px Poppins", color: "#a0a0a8" }}>{nDone} de {regalos.length} conseguidos</span>
            </div>

            <div className="lrm-hs" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 16px 12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#E4F5EE", color: "#2FB37E", font: "600 11.5px Poppins", padding: "8px 13px", borderRadius: 18, whiteSpace: "nowrap", flex: "none" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2FB37E" }} />Conseguido {fmt(conseguido)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#FBF0DA", color: "#E0A32B", font: "600 11.5px Poppins", padding: "8px 13px", borderRadius: 18, whiteSpace: "nowrap", flex: "none" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E0A32B" }} />Pendiente {fmt(pendiente)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #E7E7EA", color: "#3A3A42", font: "600 11.5px Poppins", padding: "8px 13px", borderRadius: 18, whiteSpace: "nowrap", flex: "none" }}>{icoCard}Saldo {fmt(conseguido)}</span>
            </div>

            {/* lista vinculada */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px 14px" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "9px 13px", minWidth: 0 }}>
                {amazon("#EF5B94", 16)}
                <span style={{ font: "600 11.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Lista de Amazon vinculada</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2FB37E", flex: "none" }} />
              </div>
              <button onClick={compartir} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 11.5px Poppins", cursor: "pointer", flex: "none" }}>{icoShareSmall}Compartir</button>
            </div>

            {/* regalos */}
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {regalos.map((rg, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 15, padding: "13px 15px", boxShadow: "0 3px 10px rgba(0,0,0,.03)", display: "flex", gap: 13, alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "#f7f7f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4c4cc", flex: "none" }}>{icoGift}</div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ font: "600 12.5px/1.35 Poppins", color: "#3A3A42" }}>{rg.nombre}</div>
                      <div style={{ font: "700 12.5px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>{fmt(rg.total)}</div>
                    </div>
                    <div style={{ height: 5, borderRadius: 5, background: "#f2f2f4", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 5, background: rg.done ? "#2FB37E" : "#EF5B94", width: `${rg.pct}%` }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ font: "500 10.5px Poppins", color: "#8a8a90" }}>{rg.conseguido > 0 ? `Aportado ${fmt(rg.conseguido)}` : "Sin aportaciones"}</span>
                      {rg.done
                        ? <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#E4F5EE", color: "#2FB37E", font: "600 10px Poppins", padding: "3px 9px", borderRadius: 12 }}>{icoCheck}Conseguido</span>
                        : <span style={{ font: "600 10px Poppins", color: "#E0A32B" }}>Faltan {fmt(rg.total - rg.conseguido)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAB AÑADIR REGALOS */}
            <div style={{ position: "fixed", right: 18, bottom: 24, zIndex: 20 }}>
              <a
                href={isAllowed() ? AMAZON_CREATE_URL : undefined}
                onClick={!isAllowed() ? (e) => { e.preventDefault(); ht(); } : undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 18px", borderRadius: 26, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 10px 26px rgba(239,91,148,.45)", textDecoration: "none" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Añadir regalos
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaRegalosStudioMovil;
