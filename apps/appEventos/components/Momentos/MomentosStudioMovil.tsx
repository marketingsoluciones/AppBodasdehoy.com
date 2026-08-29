import Head from "next/head";
import { useRouter } from "next/router";
import { FC, useEffect, useState } from "react";
import { useMemoriesStore } from "@bodasdehoy/memories";
import { EventContextProvider } from "../../context";
import { AlbumMenu } from "./MomentosStudio";

/**
 * MomentosStudioMovil — vista MÓVIL de Momentos fiel a Momentos_movil.dc.html (md:hidden).
 * Escritorio intacto: lo sigue sirviendo MomentosStudio en hidden md:block.
 *
 * MISMO BACKEND que la vista de escritorio: useMemoriesStore() (@bodasdehoy/memories,
 * api-ia) y el evento activo. El menú ⋮ es el MISMO componente AlbumMenu, importado —
 * no una copia — para que Compartir y QR no se bifurquen entre las dos vistas.
 *
 * REGLA 0: "Abrir Momentos en Copilot" no aparece en el HTML, pero existía en la vista
 * móvil anterior y es funcionalidad viva, así que se conserva al pie de los álbumes.
 */

const icoAtras = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>;
const icoCompartir = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="6" cy="12" r="2.6" /><circle cx="17.5" cy="5.5" r="2.6" /><circle cx="17.5" cy="18.5" r="2.6" /><path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4" /></svg>;
const icoSubir = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>;
const icoCopiar = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
const icoCheck = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>;
const icoRayo = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" /></svg>;
const icoPlus = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
const icoPlusSm = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
const icoAlbumVacio = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="M4 18l5-5 3.5 3.5L15 14l5 5" /></svg>;
const icoCamara = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 6.5A2.5 2.5 0 0 1 9.5 4h9A2.5 2.5 0 0 1 21 6.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 7 13.5v-7z" /><path d="M4.5 7.5c-.8.3-1.5 1.2-1.5 2.2V18a3 3 0 0 0 3 3h8.3c1 0 1.9-.6 2.2-1.5" /><circle cx="11" cy="8" r="1.3" /><path d="M8.5 14.5l2.6-3 1.9 2 1.6-1.6 3.4 2.6" /></svg>;

const COVERS = [
  "linear-gradient(135deg,#F9CFE1,#EF9CC0)",
  "linear-gradient(135deg,#e8e2d4,#d7ccb8)",
  "linear-gradient(135deg,#efe7f5,#dcd0ea)",
  "linear-gradient(135deg,#dfeaf3,#c7d9e8)",
];

const btnIcono: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E7E7EA",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#6b6b72", cursor: "pointer", background: "#fff", flex: "none",
};

export const MomentosStudioMovil: FC<{ chatBase: string }> = ({ chatBase }) => {
  const { albums, albumsLoading, fetchAlbums, createEventAlbumStructure, createAlbum } = useMemoriesStore();
  const { event } = EventContextProvider() as any;
  const router = useRouter();

  const [copiado, setCopiado] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<"ok" | "error" | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.bodasdehoy.com";
  const portalUrl = event?._id ? `${origin}/e/${event._id}` : null;

  const copiarUrl = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1600);
  };

  const compartirPortal = () => {
    if (!portalUrl) return;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share({ title: "Portal del evento", url: portalUrl }).catch(() => { /* cancelado */ });
    } else {
      copiarUrl();
    }
  };

  const generarDesdeItinerario = async () => {
    if (!event?._id || generando) return;
    setGenerando(true);
    setResultado(null);
    try {
      const itineraryItems = event.itinerarios_array
        ?.flatMap((it: any) => it.tasks ?? [])
        .filter((t: any) => t.spectatorView) ?? [];
      const r = await createEventAlbumStructure(event._id, event.nombre, itineraryItems);
      setResultado(r ? "ok" : "error");
      if (r) await fetchAlbums();
    } catch {
      setResultado("error");
    } finally {
      setGenerando(false);
    }
  };

  const nuevoAlbum = async () => {
    if (creando) return;
    setCreando(true);
    try {
      await createAlbum({ name: "Nuevo álbum", eventId: event?._id, visibility: "private" } as any);
      await fetchAlbums();
    } catch { /* el store ya registra el error */ } finally { setCreando(false); }
  };

  const hayAlbums = !albumsLoading && albums.length > 0;

  return (
    <div className="md:hidden" style={{ background: "#ECECEE", minHeight: "100%", fontFamily: "'Poppins',sans-serif", position: "relative" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes momm-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}.momm-hs{scrollbar-width:none;-ms-overflow-style:none;}.momm-hs::-webkit-scrollbar{display:none;height:0;width:0;}" }} />

      {/* CABECERA */}
      <div style={{ background: "#fff", padding: "14px 18px 12px", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span onClick={() => router.back()} style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#3A3A42", flex: "none", cursor: "pointer" }}>{icoAtras}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "700 9.5px Poppins", color: "#EF5B94", letterSpacing: 1 }}>{(event?.tipo || "EVENTO").toUpperCase()}</div>
              <div style={{ font: "600 15px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Momentos</div>
            </div>
          </div>
          {portalUrl && (
            <span onClick={compartirPortal} style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", flex: "none", cursor: "pointer" }}>{icoCompartir}</span>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="momm-hs" style={{ padding: "14px 14px 96px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* portal compacto */}
        {portalUrl && (
          <div style={{ background: "#fff", borderRadius: 15, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 3px 10px rgba(0,0,0,.04)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 9, border: "1.5px solid #E7E7EA", padding: 4, flex: "none", background: "#fff" }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(portalUrl)}`} alt="QR del portal" style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 12px Poppins", color: "#3A3A42" }}>Portal para invitados</div>
              <div style={{ font: "400 10.5px Poppins", color: "#8a8a90", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{portalUrl.replace(/^https?:\/\//, "")}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flex: "none" }}>
              <span onClick={copiarUrl} title="Copiar enlace" style={{ ...btnIcono, borderColor: copiado ? "#2E9E6B" : "#E7E7EA", color: copiado ? "#2E9E6B" : "#6b6b72" }}>{copiado ? icoCheck : icoCopiar}</span>
              <span onClick={compartirPortal} title="Compartir" style={btnIcono}>{icoSubir}</span>
            </div>
          </div>
        )}

        {/* contenedor de álbumes */}
        <div style={{ background: "#fff", borderRadius: 15, padding: "14px 12px", boxShadow: "0 3px 10px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>Álbumes</div>
              {hayAlbums && <span style={{ font: "400 11px Poppins", color: "#a0a0a8" }}>{albums.length} {albums.length === 1 ? "álbum" : "álbumes"}</span>}
            </div>
            <span onClick={generarDesdeItinerario} style={{ display: "flex", alignItems: "center", gap: 5, font: "600 11px Poppins", color: "#EF5B94", cursor: generando ? "default" : "pointer", opacity: generando ? .6 : 1, whiteSpace: "nowrap" }}>
              {icoRayo}{generando ? "Generando…" : "Generar del itinerario"}
            </span>
          </div>

          {resultado === "ok" && <div style={{ padding: "0 4px", font: "600 11px Poppins", color: "#2FB37E" }}>Álbumes creados</div>}
          {resultado === "error" && <div style={{ padding: "0 4px", font: "600 11px Poppins", color: "#D83E7C" }}>Error al generar los álbumes</div>}

          {albumsLoading && (
            <div style={{ padding: "30px 0", textAlign: "center", font: "500 11.5px Poppins", color: "#a0a0a8" }}>Cargando álbumes…</div>
          )}

          {/* estado vacío */}
          {!albumsLoading && albums.length === 0 && (
            <div style={{ border: "1.5px dashed #E0D9CE", borderRadius: 14, padding: "38px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 11, animation: "momm-fade .25s ease" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>{icoCamara}</div>
              <div style={{ font: "700 14.5px Poppins", color: "#3A3A42" }}>Aún no hay álbumes</div>
              <div style={{ font: "400 11.5px/1.6 Poppins", color: "#8a8a90", textAlign: "center", maxWidth: 260 }}>Crea un álbum por cada momento del evento y comparte el portal con los invitados.</div>
            </div>
          )}

          {/* rejilla de 2 columnas */}
          {hayAlbums && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, animation: "momm-fade .25s ease" }}>
              {albums.map((al: any, i: number) => {
                const vacio = !al.mediaCount;
                const cover = al.coverImageUrl
                  ? `center/cover no-repeat url(${JSON.stringify(al.coverImageUrl)})`
                  : (vacio ? "#f7f7f9" : COVERS[i % COVERS.length]);
                const sub = al.itineraryId ? "Itinerario" : (al.description || "Creado manualmente");
                return (
                  <div key={al._id} style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "#fff", border: "1px solid #f0f0f2" }}>
                    <div style={{ height: 108, background: cover, position: "relative" }}>
                      {vacio && !al.coverImageUrl && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "#c4c4cc" }}>
                          {icoAlbumVacio}
                          <span style={{ font: "500 9.5px Poppins" }}>Sin fotos aún</span>
                        </div>
                      )}
                      <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.92)", borderRadius: 10, padding: "2px 8px", font: "600 9.5px Poppins", color: "#3A3A42" }}>{al.mediaCount ?? 0}</div>
                    </div>
                    <div style={{ padding: "10px 12px 11px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: "600 11.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{al.name}</div>
                        <div style={{ font: "400 9.5px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
                      </div>
                      <AlbumMenu albumId={al._id} eventId={event?._id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Copilot — no está en el HTML, pero es funcionalidad viva de la vista anterior */}
          <div style={{ paddingTop: 4, display: "flex", justifyContent: "center" }}>
            <a href={`${chatBase.replace(/\/$/, "")}/bodasdehoy/memories`} target="_blank" rel="noopener noreferrer" style={{ font: "600 11px Poppins", color: "#EF5B94", textDecoration: "none" }}>
              Abrir Momentos en Copilot →
            </a>
          </div>
        </div>
      </div>

      {/* FAB / botón inferior */}
      {hayAlbums ? (
        <div onClick={nuevoAlbum} title="Nuevo álbum" style={{ position: "fixed", right: 18, bottom: 24, width: 54, height: 54, borderRadius: "50%", background: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: creando ? "default" : "pointer", boxShadow: "0 8px 20px rgba(239,91,148,.4)", opacity: creando ? .6 : 1, zIndex: 20 }}>
          {icoPlus}
        </div>
      ) : (!albumsLoading && (
        <div style={{ position: "fixed", left: 18, right: 18, bottom: 24, zIndex: 20 }}>
          <button onClick={nuevoAlbum} disabled={creando} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 14, borderRadius: 14, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: creando ? "default" : "pointer", boxShadow: "0 8px 20px rgba(239,91,148,.35)", opacity: creando ? .6 : 1 }}>
            {icoPlusSm}{creando ? "Creando…" : "Crear mi primer álbum"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default MomentosStudioMovil;
