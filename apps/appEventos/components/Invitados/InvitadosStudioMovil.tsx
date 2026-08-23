import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { useDelayUnmount } from "../../utils/Funciones";
import ModalLeft from "../Utils/ModalLeft";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import FormInvitadoStudio from "../Forms/FormInvitadoStudio";
import FormCrearGrupoStudio from "../Forms/FormCrearGrupoStudio";
import FormCrearMenuStudio from "../Forms/FormCrearMenuStudio";
import ModalCompartirEventoStudio from "../Utils/ModalCompartirEventoStudio";
import { BorrarInvitado } from "../../hooks/EditarInvitado";

/**
 * InvitadosStudioMovil — vista MÓVIL de Invitados fiel al HTML studio.
 * MISMO backend que InvitadosStudio (event.invitados_array, grupos_array, planSpace,
 * allFilterGuests, editGuests). Header módulo + resumen/chips + CTA Sentar + lista por
 * grupos (acordeón) + FAB "+" (sheet Añadir) + sheet Detalle del invitado.
 */

const PILL: Record<string, [string, string]> = {
  confirmado: ["#E4F5EE", "#2FB37E"], pendiente: ["#FBF0DA", "#E0A32B"], cancelado: ["#FBE4EF", "#D83E7C"],
};
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pendiente");

const InvitadosStudioMovil: FC = () => {
  const router = useRouter();
  const { event, allFilterGuests, setEvent } = EventContextProvider() as any;
  const { user } = AuthContextProvider() as any;
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [formShow, setFormShow] = useState<null | "invitado" | "grupo" | "menu">(null);
  const [editGuest, setEditGuest] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);

  const all: any[] = event?.invitados_array || [];
  const fathers = all.filter((inv) => !inv?.father);
  const grupos: string[] = event?.grupos_array || [];

  const total = all.length;
  const adultos = all.filter((x) => x?.grupo_edad === "adulto").length;
  const ninos = all.filter((x) => x?.grupo_edad === "niño").length;
  const conf = all.filter((x) => x?.asistencia === "confirmado").length;
  const pend = all.filter((x) => x?.asistencia === "pendiente").length;
  const canc = all.filter((x) => x?.asistencia === "cancelado").length;

  const tablesRec = event?.planSpace?.find((e: any) => e?.title === "recepción")?.tables;
  const tablesCer = event?.planSpace?.find((e: any) => e?.title === "ceremonia")?.tables;
  const seatOf = (id: string, idx: 0 | 1) => {
    const g = allFilterGuests?.[idx]?.sentados?.find((e: any) => e._id === id);
    const tables = idx === 0 ? tablesRec : tablesCer;
    const table = tables?.find((t: any) => t._id === g?.tableID);
    return table?.title || "Sin asignar";
  };

  const saveGuestField = (guestId: string, field: string, value: any) => {
    setEvent((prev: any) => {
      const arr = prev?.invitados_array || [];
      const next = arr.map((inv: any) => {
        if (inv._id === guestId) {
          fetchApiBodas({ query: queries.editGuests, variables: { eventID: event._id, guestID: inv._id, datos: { [field]: value } } });
          return { ...inv, [field]: value };
        }
        return inv;
      });
      return { ...prev, invitados_array: next };
    });
    toast("success", "Cambio guardado");
  };

  const guestLink = (id: string) => `${typeof window !== "undefined" ? window.location.origin : ""}?pGuestEvent=${id}${event?._id?.slice(3, 9)}${event?._id}`;

  const isOwner = event?.usuario_id === user?.uid;
  const tipoTxt = (event?.tipo || "Evento").toUpperCase();

  const q = search.trim().toLowerCase();
  // Grupos: "Sin grupo" (no asignado) primero, luego los grupos. Muestra vacíos salvo al buscar.
  const groups = ["no asignado", ...grupos].map((name) => {
    const guests = fathers.filter((g) => {
      const rol = (g?.rol || "").toLowerCase();
      const inGroup = name === "no asignado" ? !grupos.some((gr) => gr.toLowerCase() === rol) : rol === name.toLowerCase();
      return inGroup && (!q || (g?.nombre || "").toLowerCase().includes(q));
    });
    return { key: name, label: name === "no asignado" ? "Sin grupo" : name, guests };
  }).filter((gr) => (q ? gr.guests.length > 0 : true));

  const openAdd = (type: "invitado" | "grupo" | "menu") => { setAddOpen(false); setFormShow(type); };
  const openEdit = () => { const g = detail; setDetail(null); setEditGuest(g); setIsMounted(true); };
  const copyLink = () => {
    if (!detail) return;
    try { navigator.clipboard.writeText(guestLink(detail._id)); toast("success", "Enlace copiado"); } catch { toast("error", "No se pudo copiar"); }
  };

  const avatarUrl = (g: any) => ((g?.sexo || "").toLowerCase() === "mujer" ? "/profile_woman.png" : "/profile_men.png");

  // ── Bottom sheet reutilizable (portal a body, por encima de todo) ──
  const sheet = (open: boolean, onClose: () => void, children: any) => (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(40,40,46,.4)", zIndex: 9998 }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 0, width: "100%", maxWidth: 430, background: "#fff", borderRadius: "22px 22px 0 0", zIndex: 9999, padding: "10px 20px 34px", animation: "ism-up .25s ease", fontFamily: "'Poppins',sans-serif" }}>
        <div style={{ width: 38, height: 4, borderRadius: 3, background: "#e4e4e8", margin: "6px auto 16px" }} />
        {children}
      </div>
    </>
  );

  return (
    <div className="md:hidden" style={{ background: "#F6F5F7", minHeight: "100%", position: "relative", paddingBottom: 40, fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes ism-up{from{transform:translate(-50%,100%)}to{transform:translate(-50%,0)}}@keyframes ism-fade{from{opacity:0}to{opacity:1}}.ism-hs{scrollbar-width:none;}.ism-hs::-webkit-scrollbar{display:none;}" }} />

      {isOwner && shareOpen && <ModalCompartirEventoStudio event={event} onClose={() => setShareOpen(false)} />}

      {/* HEADER DEL MÓDULO (sticky) */}
      <div style={{ background: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>Invitados</div>
          <div style={{ font: "500 10px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><b style={{ color: "#EF5B94", fontWeight: 600 }}>{tipoTxt}</b> · {event?.nombre}</div>
        </div>
        <button onClick={() => setSearchOpen((v) => !v)} title="Buscar" style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer", border: "none" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3A42" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></button>
        <button onClick={() => isOwner && setShareOpen(true)} title="Compartir" style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: isOwner ? "pointer" : "default", border: "none", color: "#EF5B94" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="2.6" /><circle cx="17.5" cy="5.5" r="2.6" /><circle cx="17.5" cy="18.5" r="2.6" /><path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4" /></svg></button>
      </div>

      {/* Buscador (se despliega al tocar la lupa) */}
      {searchOpen && (
        <div style={{ padding: "12px 16px 0", animation: "ism-fade .18s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "10px 12px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b3b3ba" strokeWidth={2} style={{ flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar invitado" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", font: "500 13px Poppins", color: "#3A3A42" }} />
            {search && <button onClick={() => setSearch("")} style={{ border: "none", background: "none", color: "#c4c4cc", cursor: "pointer", flex: "none" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg></button>}
          </div>
        </div>
      )}

      {/* RESUMEN + CHIPS */}
      <div style={{ padding: "16px 16px 4px", display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ font: "800 24px Poppins", color: "#EF5B94" }}>{total}</span>
        <span style={{ font: "600 13.5px Poppins", color: "#3A3A42" }}>invitados</span>
        <span style={{ font: "500 11px Poppins", color: "#a0a0a8", whiteSpace: "nowrap" }}>{adultos} adultos · {ninos} niños</span>
      </div>
      <div className="ism-hs" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 16px 14px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 11.5px Poppins", padding: "8px 13px", borderRadius: 18, whiteSpace: "nowrap", flex: "none", background: "#FBF0DA", color: "#E0A32B" }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: "#E0A32B" }} />{pend} por confirmar</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 11.5px Poppins", padding: "8px 13px", borderRadius: 18, whiteSpace: "nowrap", flex: "none", background: "#E4F5EE", color: "#2FB37E" }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: "#2FB37E" }} />{conf} confirmados</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 11.5px Poppins", padding: "8px 13px", borderRadius: 18, whiteSpace: "nowrap", flex: "none", background: "#FBE4EF", color: "#D83E7C" }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: "#D83E7C" }} />{canc} cancelados</span>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 16px 14px" }}>
        <button onClick={() => router.push("/mesas")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 13, borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M6 12v6M18 12v6" /></svg>Sentar invitados</button>
      </div>

      {/* LISTA POR GRUPOS */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.length === 0 && <div style={{ padding: "30px 16px", textAlign: "center", font: "500 12.5px Poppins", color: "#c4c4cc" }}>{total === 0 ? "Aún no tienes invitados." : "No hay invitados que coincidan."}</div>}
        {groups.map((gr) => {
          const open = q ? true : !closed[gr.key];
          return (
            <div key={gr.key} style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f2", boxShadow: "0 4px 14px rgba(0,0,0,.04)", overflow: "hidden" }}>
              <div onClick={() => setClosed((c) => ({ ...c, [gr.key]: !c[gr.key] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4c4cc" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", transition: "transform .18s", transform: `rotate(${open ? 90 : 0}deg)` }}><path d="M9 6l6 6-6 6" /></svg>
                <span style={{ font: "600 13.5px Poppins", color: "#3A3A42", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "uppercase" }}>{gr.label}</span>
                <span style={{ font: "600 10px Poppins", color: "#c4c4cc", background: "#f2f2f4", padding: "3px 9px", borderRadius: 10, flex: "none" }}>{gr.guests.length}</span>
              </div>
              {open && (
                <div style={{ animation: "ism-fade .18s ease" }}>
                  {gr.guests.length === 0 && <div style={{ padding: 16, font: "500 12px Poppins", color: "#c4c4cc", textAlign: "center", borderTop: "1px solid #f5f5f7" }}>No hay invitados</div>}
                  {gr.guests.map((r) => {
                    const st = (r?.asistencia || "pendiente").toLowerCase();
                    const c = PILL[st] || PILL.pendiente;
                    return (
                      <div key={r._id} onClick={() => setDetail(r)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 16px", borderTop: "1px solid #f5f5f7", cursor: "pointer", minHeight: 56 }}>
                        <span style={{ width: 38, height: 38, borderRadius: "50%", flex: "none", background: `#c9c9cf url('${avatarUrl(r)}') center/cover` }} />
                        <span style={{ flex: 1, minWidth: 0, font: "600 13px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "uppercase" }}>{r?.nombre}</span>
                        <span style={{ display: "flex", alignItems: "center", font: "600 10.5px Poppins", padding: "5px 10px", borderRadius: 14, flex: "none", background: c[0], color: c[1] }}>{cap(st)}</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c4c4cc" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M9 6l6 6-6 6" /></svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB "+" */}
      <button onClick={() => setAddOpen((v) => !v)} style={{ position: "fixed", right: 16, bottom: 150, width: 54, height: 54, borderRadius: "50%", background: "#EF5B94", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 26px rgba(239,91,148,.45)", cursor: "pointer", zIndex: 55, border: "none" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" style={{ transition: "transform .2s", transform: addOpen ? "rotate(45deg)" : "none" }}><path d="M12 5v14M5 12h14" /></svg>
      </button>

      {/* SHEETS + FORMS (portal a body) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <>
          {addOpen && sheet(addOpen, () => setAddOpen(false), (
            <>
              <h3 style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 14 }}>Añadir</h3>
              {[
                { t: "invitado", tit: "Invitado", sub: "Añadir una persona a la lista", ic: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="10" cy="8" r="3.4" /><path d="M4 19c0-3.1 2.6-5.4 6-5.4s6 2.3 6 5.4c0 .4-.3.7-.7.7H4.7a.7.7 0 0 1-.7-.7z" /><path d="M18 8v6M15 11h6" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" fill="none" /></svg> },
                { t: "grupo", tit: "Grupo", sub: "Organizar invitados por grupos", ic: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 18.6c0-2.9 2.4-5 5.5-5s5.5 2.1 5.5 5c0 .4-.3.7-.7.7H4.2a.7.7 0 0 1-.7-.7z" /><circle cx="16.5" cy="9" r="2.5" opacity=".55" /><path d="M16.2 13.1c2.5.2 4.3 2.1 4.3 4.6 0 .3-.3.6-.6.6h-2.9c.2-.5.3-1 .3-1.5 0-1.4-.4-2.7-1.1-3.7z" opacity=".55" /></svg> },
                { t: "menu", tit: "Menú", sub: "Crear un menú del evento", ic: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M4 3v7c0 1.1.9 2 2 2s2-.9 2-2V3M6 12v9M17 3c-1.7 1-3 3.2-3 5.5 0 2 1.3 3.5 3 3.5v9M4 3h4" /></svg> },
              ].map((it, i) => (
                <div key={it.t} onClick={() => openAdd(it.t as any)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 6px", cursor: "pointer", borderBottom: i < 2 ? "1px solid #f5f5f7" : "none" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 12, background: "#FCE7F0", color: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{it.ic}</span>
                  <div><div style={{ font: "600 13.5px Poppins", color: "#3A3A42" }}>{it.tit}</div><div style={{ font: "400 11px Poppins", color: "#a0a0a8" }}>{it.sub}</div></div>
                </div>
              ))}
            </>
          ))}

          {detail && sheet(!!detail, () => setDetail(null), (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ width: 46, height: 46, borderRadius: "50%", flex: "none", background: `#c9c9cf url('${avatarUrl(detail)}') center/cover` }} />
                <div><div style={{ font: "700 15px Poppins", color: "#3A3A42", textTransform: "uppercase" }}>{detail?.nombre}</div><div style={{ font: "500 11px Poppins", color: "#a0a0a8", textTransform: "uppercase" }}>{detail?.rol || "Sin grupo"}</div></div>
              </div>
              <div style={{ font: "600 11px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>Asistencia</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {[["confirmado", "Confirmado"], ["pendiente", "Pendiente"], ["cancelado", "Cancelado"]].map(([val, lbl]) => {
                  const on = (detail?.asistencia || "pendiente").toLowerCase() === val;
                  const c = PILL[val];
                  return (
                    <div key={val} onClick={() => { saveGuestField(detail._id, "asistencia", val); setDetail((d: any) => ({ ...d, asistencia: val })); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "11px 4px", borderRadius: 12, background: on ? c[0] : "#fff", border: `1.5px solid ${on ? c[1] : "#E7E7EA"}`, font: "600 11.5px Poppins", color: on ? c[1] : "#8a8a90", cursor: "pointer", whiteSpace: "nowrap" }}>{lbl}</div>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[
                  ["Menú", detail?.nombre_menu || "Sin asignar"],
                  ["Acompañantes", String(all.filter((x) => x?.father === detail._id).length)],
                  ["Asientos recepción", seatOf(detail._id, 0)],
                  ["Asientos ceremonia", seatOf(detail._id, 1)],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#faf9fb", borderRadius: 12, padding: "11px 14px" }}>
                    <div style={{ font: "600 9.5px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>{k}</div>
                    <div style={{ font: "600 12.5px Poppins", color: "#3A3A42", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={copyLink} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 12, borderRadius: 12, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>Compartir</button>
                <button onClick={openEdit} style={{ flex: 1, padding: 12, borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 5px 14px rgba(239,91,148,.28)" }}>Editar invitado</button>
              </div>
            </>
          ))}
        </>,
        document.body
      )}

      {/* Formularios studio (portal propio) */}
      {formShow === "invitado" && <FormInvitadoStudio onClose={() => setFormShow(null)} />}
      {formShow === "grupo" && <FormCrearGrupoStudio onClose={() => setFormShow(null)} />}
      {formShow === "menu" && <FormCrearMenuStudio onClose={() => setFormShow(null)} />}

      {/* Editar invitado (ModalLeft studio → portal a body) */}
      {shouldRenderChild && (
        <ModalLeft state={isMounted} set={setIsMounted} studio>
          <FormEditarInvitado state={isMounted} set={setIsMounted} invitado={editGuest} setInvitadoSelected={setEditGuest} />
        </ModalLeft>
      )}
    </div>
  );
};

export default InvitadosStudioMovil;
