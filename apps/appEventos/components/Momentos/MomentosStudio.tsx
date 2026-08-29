import Head from "next/head";
import { FC, useEffect, useState } from "react";
import { useMemoriesStore } from "@bodasdehoy/memories";
import { EventContextProvider } from "../../context";
import BlockTitle from "../Utils/BlockTitle";

/**
 * MomentosStudio — rediseño de ESCRITORIO de Momentos, fiel a Momentos.dc.html
 * (hidden md:block). El móvil sigue con la vista anterior, intacta.
 *
 * MISMO BACKEND, sin fuentes nuevas: todo sale de useMemoriesStore()
 * (@bodasdehoy/memories, api-ia) y del evento activo.
 *
 * REGLA 0 — nada de lo que ya había se pierde; solo cambia de sitio:
 *   · Portal del invitado (QR + URL + Copiar + Ver portal) → franja del HTML
 *   · "Crear álbumes por momento del itinerario" → enlace "Generar desde el itinerario"
 *   · Compartir álbum (generateShareLink) y QR por álbum → menú ⋮ de cada tarjeta
 *   · "Abrir Momentos en Copilot" → pie de la tarjeta de álbumes
 *   · estados de carga y el resultado ok/error de la generación
 *
 * "Nuevo álbum" es el único botón NUEVO del HTML: se conecta a createAlbum() del
 * store, que ya existía y no estaba expuesto en esta pantalla.
 */

const icoPlus = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
const icoRayo = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" /></svg>;
const icoCopiar = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
const icoFlecha = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const icoKebab = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>;
const icoAlbumVacio = <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="M4 18l5-5 3.5 3.5L15 14l5 5" /></svg>;
const icoCamara = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 6.5A2.5 2.5 0 0 1 9.5 4h9A2.5 2.5 0 0 1 21 6.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 7 13.5v-7z" /><path d="M4.5 7.5c-.8.3-1.5 1.2-1.5 2.2V18a3 3 0 0 0 3 3h8.3c1 0 1.9-.6 2.2-1.5" /><circle cx="11" cy="8" r="1.3" /><path d="M8.5 14.5l2.6-3 1.9 2 1.6-1.6 3.4 2.6" /></svg>;

// Degradados del HTML, repartidos de forma estable por posición.
const COVERS = [
  "linear-gradient(135deg,#F9CFE1,#EF9CC0)",
  "linear-gradient(135deg,#e8e2d4,#d7ccb8)",
  "linear-gradient(135deg,#efe7f5,#dcd0ea)",
  "linear-gradient(135deg,#dfeaf3,#c7d9e8)",
];

const btnGhost: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10,
  background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72",
  font: "600 12px Poppins", cursor: "pointer", whiteSpace: "nowrap",
};

/** Menú ⋮ de cada álbum: conserva Compartir y QR, que antes eran botones sueltos. */
const AlbumMenu: FC<{ albumId: string; eventId?: string }> = ({ albumId, eventId }) => {
  const { generateShareLink } = useMemoriesStore();
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.bodasdehoy.com";
  const momentUrl = eventId ? `${origin}/e/${eventId}/m/${albumId}` : "";

  const compartir = async () => {
    setCargando(true);
    try {
      const r = await generateShareLink(albumId, 30);
      if (r) {
        const url = r.shareUrl || `${origin}/memories/shared/${r.shareToken}`;
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch { /* el store ya registra el error */ } finally { setCargando(false); setOpen(false); }
  };

  return (
    <div style={{ position: "relative", flex: "none" }}>
      <span
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); setQr(false); }}
        title="Opciones"
        style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: copiado ? "#2FB37E" : "#8a8a90", cursor: "pointer" }}
      >
        {icoKebab}
      </span>
      {open && (
        <>
          <div onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 32, zIndex: 31, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 12, boxShadow: "0 10px 26px rgba(0,0,0,.12)", padding: 6, minWidth: 168 }}>
            <div onClick={compartir} style={{ padding: "9px 12px", borderRadius: 8, font: "600 12px Poppins", color: "#3A3A42", cursor: "pointer" }}>
              {cargando ? "Generando enlace…" : copiado ? "¡Enlace copiado!" : "Compartir álbum"}
            </div>
            {eventId && (
              <div onClick={() => setQr((v) => !v)} style={{ padding: "9px 12px", borderRadius: 8, font: "600 12px Poppins", color: "#3A3A42", cursor: "pointer" }}>
                {qr ? "Ocultar QR" : "Ver QR del momento"}
              </div>
            )}
            {qr && eventId && (
              <div style={{ padding: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(momentUrl)}`} alt="QR del momento" style={{ width: 128, height: 128 }} />
                <div onClick={() => { navigator.clipboard.writeText(momentUrl); setOpen(false); }} style={{ font: "600 11px Poppins", color: "#EF5B94", cursor: "pointer" }}>Copiar enlace</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const MomentosStudio: FC<{ chatBase: string }> = ({ chatBase }) => {
  const { albums, albumsLoading, fetchAlbums, createEventAlbumStructure, createAlbum } = useMemoriesStore();
  const { event } = EventContextProvider() as any;

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

  // Mismo flujo que "Crear álbumes por momento del itinerario" de la vista anterior.
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
    <div className="hidden md:block" style={{ background: "#F2F2F2", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes mom-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}.mom-card{transition:box-shadow .18s}.mom-card:hover{box-shadow:0 10px 26px rgba(0,0,0,.09)}.mom-ghost:hover{border-color:#EF5B94 !important;color:#EF5B94 !important}.mom-link:hover{color:#D83E7C !important}.mom-cta:hover{background:#D83E7C !important}" }} />

      <div style={{ minHeight: "100vh", padding: "26px 0 60px" }}>
        {/* Mismo ancho que BlockTitle, que se autolimita a max-w-screen-lg (1024px). Con un
            maxWidth propio las tarjetas salían ~100px más anchas que la barra del título.
            Se usa la MISMA clase en vez de un valor fijo para que, si cambia el breakpoint,
            las tres se muevan juntas. El padding no descuadra: al reducir el ancho
            disponible, BlockTitle deja de tocar su máximo y ocupa lo mismo que el resto. */}
        <div className="max-w-screen-lg mx-auto px-4" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* HOLDER — misma barra compartida que el resto de módulos */}
          <BlockTitle title={"Momentos"} />

          {/* PORTAL DEL EVENTO */}
          {portalUrl && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "12px 26px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 9, border: "1.5px solid #E7E7EA", padding: 4, flex: "none", background: "#fff" }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(portalUrl)}`} alt="QR del portal" style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>Portal del evento para invitados</div>
                <div style={{ font: "400 11.5px Poppins", color: "#8a8a90", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Comparte este enlace con tus invitados · <span style={{ color: "#6b6b72" }}>{portalUrl.replace(/^https?:\/\//, "")}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                <button className="mom-ghost" onClick={copiarUrl} title="Copiar URL" style={btnGhost}>{icoCopiar}{copiado ? "¡Copiada!" : "Copiar URL"}</button>
                <a className="mom-ghost" href={portalUrl} target="_blank" rel="noopener noreferrer" title="Ver portal" style={{ ...btnGhost, textDecoration: "none" }}>Ver portal{icoFlecha}</a>
              </div>
            </div>
          )}

          {/* ÁLBUMES */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px 26px 26px", boxShadow: "0 4px 14px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>Álbumes</div>
                {hayAlbums && <span style={{ font: "400 12px Poppins", color: "#a0a0a8" }}>{albums.length} {albums.length === 1 ? "álbum" : "álbumes"}</span>}
                {resultado === "ok" && <span style={{ font: "600 11.5px Poppins", color: "#2FB37E" }}>Álbumes creados</span>}
                {resultado === "error" && <span style={{ font: "600 11.5px Poppins", color: "#D83E7C" }}>Error al generar los álbumes</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span className="mom-link" onClick={generarDesdeItinerario} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12px Poppins", color: "#EF5B94", cursor: generando ? "default" : "pointer", whiteSpace: "nowrap", opacity: generando ? .6 : 1 }}>
                  {icoRayo}{generando ? "Generando…" : "Generar desde el itinerario"}
                </span>
                <button className="mom-cta" onClick={nuevoAlbum} disabled={creando} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: creando ? "default" : "pointer", boxShadow: "0 5px 14px rgba(239,91,148,.28)", whiteSpace: "nowrap", opacity: creando ? .6 : 1 }}>
                  {icoPlus}{creando ? "Creando…" : "Nuevo álbum"}
                </button>
              </div>
            </div>

            {albumsLoading && (
              <div style={{ padding: "40px 0", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>Cargando álbumes…</div>
            )}

            {/* estado vacío */}
            {!albumsLoading && albums.length === 0 && (
              <div style={{ border: "1.5px dashed #E0D9CE", borderRadius: 16, padding: "46px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animation: "mom-fade .25s ease" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>{icoCamara}</div>
                <div style={{ font: "700 16px Poppins", color: "#3A3A42" }}>Aún no hay álbumes</div>
                <div style={{ font: "400 12.5px/1.65 Poppins", color: "#8a8a90", textAlign: "center", maxWidth: 420 }}>
                  Crea un álbum para cada momento del evento — o genéralos automáticamente desde el itinerario — y comparte el portal con los invitados para que suban sus fotos.
                </div>
                <button className="mom-cta" onClick={nuevoAlbum} disabled={creando} style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 26px", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: creando ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", marginTop: 6, opacity: creando ? .6 : 1 }}>
                  {icoPlus}Crear mi primer álbum
                </button>
              </div>
            )}

            {/* grid */}
            {hayAlbums && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16, animation: "mom-fade .25s ease" }}>
                {albums.map((al: any, i: number) => {
                  const vacio = !al.mediaCount;
                  const cover = al.coverImageUrl
                    ? `center/cover no-repeat url(${JSON.stringify(al.coverImageUrl)})`
                    : (vacio ? "#f7f7f9" : COVERS[i % COVERS.length]);
                  const sub = al.itineraryId ? "Del itinerario" : (al.description || "Creado manualmente");
                  return (
                    <div key={al._id} className="mom-card" style={{ border: "1px solid #f0f0f2", borderRadius: 15, overflow: "hidden", cursor: "pointer", background: "#fff" }}>
                      <div style={{ height: 140, background: cover, position: "relative" }}>
                        {vacio && !al.coverImageUrl && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#c4c4cc" }}>
                            {icoAlbumVacio}
                            <span style={{ font: "500 10.5px Poppins" }}>Sin fotos aún</span>
                          </div>
                        )}
                        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)", borderRadius: 12, padding: "3px 10px", font: "600 10.5px Poppins", color: "#3A3A42" }}>
                          {al.mediaCount ?? 0} {al.mediaCount === 1 ? "foto" : "fotos"}
                        </div>
                      </div>
                      <div style={{ padding: "12px 15px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ font: "600 13px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{al.name}</div>
                          <div style={{ font: "400 10.5px Poppins", color: "#a0a0a8" }}>{sub}</div>
                        </div>
                        <AlbumMenu albumId={al._id} eventId={event?._id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Copilot — se conserva del diseño anterior; no está en el HTML pero es funcionalidad viva */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #f2f2f4", display: "flex", justifyContent: "flex-end" }}>
              <a className="mom-link" href={`${chatBase.replace(/\/$/, "")}/bodasdehoy/memories`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "600 12px Poppins", color: "#EF5B94", textDecoration: "none" }}>
                Abrir Momentos en Copilot{icoFlecha}
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MomentosStudio;
