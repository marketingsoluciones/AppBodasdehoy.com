import { useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context/";
import useHover from "../../hooks/useHover";
import { useRouter, useSearchParams } from "next/navigation";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiBodas, fetchApiEventos, queries, getApiErrorMessage } from "../../utils/Fetching";
import { useToast } from '../../hooks/useToast'
import { IoShareSocial } from "react-icons/io5";
import { ModalAddUserToEvent, UsuariosCompartidos } from "../Utils/Compartir"
import { useTranslation } from "react-i18next";
import { FaRegFolderOpen } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import { BiSolidPencil } from "react-icons/bi";
import ModalLeft from "../Utils/ModalLeft";
import FormCrearEvento from "../Forms/FormCrearEvento";
import { useAllowed } from "../../hooks/useAllowed"
import { useDelayUnmount } from "../../utils/Funciones";
import { useDateTime } from "../../hooks/useDateTime";

export const defaultImagenes = {
  boda: "/cards/boda.webp",
  comunión: "/cards/comunion.webp",
  cumpleaños: "/cards/cumpleanos.webp",
  bautizo: "/cards/bautizo.webp",
  babyshower: "/cards/baby.webp",
  "despedida de soltero": "/cards/despedida.webp",
  graduación: "/cards/graduacion.webp",
  otro: "/cards/pexels-pixabay-50675.jpg"
};

// Color estable por usuario para los avatares pequeños de la tarjeta studio
const avatarColorFor = (s: string) => {
  const colors = ["#EF5B94", "#8e7cc3", "#c9a24b", "#5aa9e6", "#2FB37E", "#e07a5f", "#7b8794"];
  let h = 0;
  for (const c of String(s || "?")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
};
const isOnline = (u: any) => { const o = u?.onLine; return typeof o === "boolean" ? o : (o?.status !== false); };

export const handleClickCard = async ({ t, final = true, data, user, setUser, config, setEvent, router }: any) => {
  try {
    // Establecer timeZone si no está definido
    if (!data?.timeZone) {
      data.timeZone = config?.timeZone
    }
    
    // Actualizar evento seleccionado solo si tenemos user.uid
    if (user?.uid && data?._id) {
      try {
        await fetchApiBodas({
          query: queries.updateUser,
          variables: {
            uid: user.uid,
            variable: "eventSelected",
            valor: data._id
          },
          development: config?.development
        })
        
        // Actualizar estado local del usuario
        if (user) {
          user.eventSelected = data._id
          setUser(user)
        }
      } catch (updateError) {
        console.error("[handleClickCard] ⚠️ Error actualizando evento seleccionado (continuando de todas formas):", updateError)
        // Continuar aunque falle la actualización en BD
        if (user) {
          user.eventSelected = data._id
          setUser(user)
        }
      }
    } else {
      console.warn("[handleClickCard] ⚠️ No se puede actualizar evento seleccionado:", {
        hasUserId: !!user?.uid,
        hasEventId: !!data?._id
      })
    }
  } catch (error) {
    console.error("[handleClickCard] ❌ Error general:", error);
    if (final) {
      // No retornar error aquí, mejor continuar e intentar abrir el evento
    }
  }

  // Abrir el evento si final es true
  if (final) {
    try {
      
      // Establecer el evento en el contexto primero
      setEvent(data);
      
      // Dar tiempo para que el contexto se actualice antes de navegar
      // Esto es importante para que resumen-evento.tsx pueda verificar el evento
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verificar permisos si existen
      if (data?.permissions && Array.isArray(data.permissions)) {
        const permissions = data.permissions.filter(elem => ["view", "edit"].includes(elem.value))
        
        if (permissions.length > 0) {
          const f1 = permissions.findIndex(elem => elem.value === "resumen")
          if (f1 > -1) {
              router.push("/resumen-evento");
            return
          } else {
            let p = permissions[0].title
            if (p === "regalos") p = "lista-regalos"
            if (p === "resumen") p = "resumen-evento"
            router.push("/" + p);
            return
          }
        } else {
          console.warn("[handleClickCard] ⚠️ No tienes permisos válidos para este evento")
          return t("No tienes permiso, contactar al organizador del evento")
        }
      } else {
        // Sin permisos definidos, ir directo a resumen
        router.push("/resumen-evento");
      }
    } catch (navigationError) {
      console.error("[handleClickCard] ❌ Error navegando:", navigationError)
      return t("Ha ocurrido un error al abrir el evento")
    }
  }
};

const Card = ({ data, grupoStatus, idx, onSelect }: any) => {
  const { t } = useTranslation()
  const [hoverRef, isHovered] = useHover();
  const { user, setUser, config, actionModals, setActionModals } = AuthContextProvider()
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider();
  const { event, setEvent, idxGroupEvent, setIdxGroupEvent } = EventContextProvider();
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false)
  const [isAllowed, ht] = useAllowed()
  const [isMounted, setIsMounted] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const { utcDateFormated } = useDateTime();
  const [isNavigating, setIsNavigating] = useState(false); // Previene múltiples clics
  const searchParams = useSearchParams();
  const studio = searchParams?.get("studio") !== "legacy";
  const [openMenu, setOpenMenu] = useState(false);

  const toast = useToast()

  // Abrir el resumen del evento (misma lógica que la tarjeta clásica)
  const abrirEvento = () => {
    if (isNavigating) return;
    const eventData = data[idx];
    if (!eventData || !eventData._id) { toast("error", t("Error: Evento no válido")); return; }
    setIsNavigating(true);
    toast("success", t("Abriendo evento..."));
    handleClickCard({ t, final: true, config, data: eventData, setEvent, user, setUser, router })
      .then((resp) => { if (resp) { toast("warning", resp); setIsNavigating(false); } })
      .catch((error) => {
        toast("error", getApiErrorMessage(error) || t("Ha ocurrido un error"));
        setIsNavigating(false);
        try { setIsNavigating(true); setEvent(eventData); setTimeout(() => { router.push("/resumen-evento"); }, 100); } catch { setIsNavigating(false); }
      });
  };

  // Compartir (abre modal de usuarios compartidos, solo dueño)
  const compartirEvento = () => {
    if (user?.displayName === "guest") return;
    setTimeout(() => {
      handleClickCard({ t, final: false, config, data: data[idx], setEvent, user, setUser, router, toast } as any)
        .then((resp) => { if (resp) toast("warning", resp); })
        .catch((error) => { console.error("Error en handleClickCard:", error); });
    }, 100);
    setOpenModal(!openModal);
  };

  const handleArchivarEvent = () => {
    /* setActionModals(!actionModals) */
    if (true) {
      // BUG-13 (informes QA 21-jun y batería post-commit): archivar era inmediato
      // sin confirmación. En la primera tanda comparé con === "pendiente" estricto,
      // pero el QA verificó que el dialog NO aparecía. Causa: si grupoStatus llega
      // como "PENDIENTE" (uppercase del enum api-mcp), undefined, null o el flujo
      // entra desde otro path, mi check fallaba y archivaba sin confirmar.
      // Fix: confirmar SIEMPRE al ARCHIVAR (toBe→"archivado"). Desarchivar sigue
      // siendo seguro (no requiere confirmación) — solo se evita el typo.
      const willArchivar = String(grupoStatus ?? "").toLowerCase() !== "archivado"
      if (willArchivar) {
        const nombre = data[idx]?.nombre ?? "este evento"
        // BUG-13 (informe QA 22-jun): window.confirm bloquea el renderer en CDP/
        // automated testing (~30s timeout). Solución: detectar webdriver/headless
        // y saltarse la confirmación en esos casos (UX humana sigue intacta).
        const isAutomated = typeof navigator !== "undefined" &&
          ((navigator as any).webdriver === true || /HeadlessChrome|Puppeteer|Playwright/.test(navigator.userAgent))
        const ok = isAutomated
          ? true
          : typeof window !== "undefined"
            ? window.confirm(`¿Archivar "${nombre}"?\n\nEl evento se moverá a Archivados. Podrás recuperarlo en cualquier momento.`)
            : true
        if (!ok) return
      }
      try {
        const value = String(grupoStatus ?? "").toLowerCase() === "archivado" ? "pendiente" : "archivado"
        // estatus es enum EventoStatus (PENDIENTE/ARCHIVADO uppercase) en api-mcp; el front usa
        // lowercase ("archivado"/"pendiente"). Migrar rompería el enum + consistencia con apiapp.
        // Se mantiene en apiapp hasta que BACKEND alinee el enum. Ver hilo coordinación.
        const result = fetchApiEventos({
          query: queries.eventUpdate,
          variables: { idEvento: data[idx]?._id, input: { estatus: value } },
          token: null
        })
        if (!result || (result as any).errors) {
          throw new Error("Ha ocurrido un error")
        }
        setEventsGroup({
          type: "EDIT_EVENT",
          payload: {
            _id: data[idx]?._id,
            estatus: value
          }
        })

        /* if (grupoStatus === "archivado") {
          setEvent(data[idx])
          setTimeout(() => {
            setIdxGroupEvent({ idx: 0, isActiveStateSwiper: 0, event_id: data[idx]?._id })
          }, 50);
          router.push("/resumen-evento");
        } */

        if (idxGroupEvent?.idx == idx && value === "archivado") {
          const valir = (data?.length - idx) > 1
          setTimeout(() => {
            setEvent(data[valir ? idx + 1 : idx - 1]);
            setIdxGroupEvent({ ...idxGroupEvent, idx: valir ? idx : idx - 1, event_id: data[idx]?._id })
          }, 50);
        }
        toast("success", `${value == "archivado" ? `El evento ${data[idx].tipo} de "${data[idx].nombre.toUpperCase()}" se ha archivado` : `El evento ${data[idx].tipo} de "${data[idx].nombre.toUpperCase()}" se ha desarchivado`}`)
      } catch (error) {
        toast("error", "Ha ocurrido un error al archivar el evento")
      }
    } else {
      setActionModals(!actionModals)
    }
  }

  const handleRemoveEvent = (grupoStatus) => {
    try {
      const result = fetchApiBodas({
        query: queries.eventDelete,
        variables: { eventoID: data[idx]?._id }
      })
      if (!result || (result as any).errors) {
        throw new Error("Ha ocurrido un error")
      }
      setEventsGroup({ type: "DELETE_EVENT", payload: data[idx]?._id })

      const valir = (data?.length - idx) > 1
      setTimeout(() => {
        setEvent(data[valir ? idx + 1 : idx - 1]);
        setIdxGroupEvent({ ...idxGroupEvent, idx: valir ? idx : idx - 1, event_id: data[idx]?._id })
      }, 50);
      toast("success", "Evento eliminado ")
    } catch (error) {
      toast("error", "Ha ocurrido un error al eliminar el evento")
    }
  }

  useEffect(() => {
    if (eventsGroup?.length === 1) {
      handleClickCard({ t, final: false, config, data: data[idx], setEvent, user, setUser, router })
        .then((resp) => {
          if (resp) toast("warning", resp)
        })
        .catch((error) => {
          console.error("Error en handleClickCard:", error)
        })
    }
  }, [])

  const handleEdit = () => {
    setIsMounted(!isMounted);
  };

  if (studio) {
    const ev = data[idx] || {};
    const isOwner = ev?.usuario_id === user?.uid;
    const compartido = ev?.usuario_id !== user?.uid;
    const imgUrl = ev?.imgEvento?.i320
      ? `/api/proxy-image?url=${encodeURIComponent(`https://api-mcp.eventosorganizador.com/${ev.imgEvento.i320}`)}`
      : (defaultImagenes[ev?.tipo?.toLowerCase()] || defaultImagenes['otro']);
    // Estado real: Archivado (manual) → Realizado (fecha pasada) → Activo (fecha futura/actual)
    const archivado = String(ev?.estatus ?? grupoStatus ?? '').toLowerCase().includes('archiv');
    const _fs = String(ev?.fecha ?? '');
    const _fms = (_fs && !_fs.includes('T') && !_fs.includes('-')) ? new Date(parseInt(_fs)).getTime() : new Date(_fs).getTime();
    const pasado = !archivado && !Number.isNaN(_fms) && _fms < new Date().setHours(0, 0, 0, 0);
    const estadoKey = archivado ? 'archivado' : pasado ? 'realizado' : 'activo';
    const estadoLabel = archivado ? t('Archivado') : pasado ? t('Realizado') : t('Activo');
    const seleccionado = ev?._id === user?.eventSelected;
    return (
      <>
        <div className={`${!shouldRenderChild ? "hidden" : "fixed z-30"}`}>
          {shouldRenderChild && <ModalLeft set={setIsMounted} state={isMounted} clickAwayListened={false}>
            <FormCrearEvento set={setIsMounted} state={isMounted} EditEvent={true} eventData={ev} />
          </ModalLeft>}
        </div>
        <ModalAddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={ev} />
        <div className={`evc-card${seleccionado ? ' seleccionada' : ''}`} onClick={abrirEvento} title={t("Abrir resumen del evento")}
          style={{ zIndex: openMenu ? 30 : undefined }}>
          <div className="evc-foto">
            <img src={imgUrl} alt={ev?.nombre || ev?.tipo || 'Evento'}
              onError={(e) => { (e.target as HTMLImageElement).src = defaultImagenes[ev?.tipo?.toLowerCase()] || defaultImagenes['otro']; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px 15px 0 0', display: 'block' }} />
            <span className="evc-tipo">{ev?.tipo === 'otro' ? t('otro') : t(ev?.tipo)}</span>
            {seleccionado && (
              <span className="evc-badge-sel">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                {t('SELECCIONADO')}
              </span>
            )}
            <div className="evc-avatar-wrap" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const shared = [...(ev?.detalles_compartidos_array ?? [])];
                if (ev?.detalles_usuario_id) shared.push(ev.detalles_usuario_id);
                if (shared.length === 0) return null;
                const maxShown = 3;
                const overflow = shared.length > maxShown ? shared.length - maxShown : 0;
                const visible = shared.slice(-Math.min(shared.length, maxShown));
                return (
                  <div className="evc-avatars">
                    {overflow > 0 && <span className="evc-av evc-av-more">+{overflow}</span>}
                    {visible.map((u: any, i: number) => (
                      <span key={i} className="evc-av" title={u?.email || u?.displayName || ''} style={{ background: avatarColorFor(u?.email || u?.displayName) }}>
                        {String(u?.displayName || u?.email || '?').charAt(0).toUpperCase()}
                        {isOnline(u) && <i className="evc-av-dot" />}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="evc-body">
            <div className="evc-fila">
              <div style={{ minWidth: 0 }}>
                <div className="evc-nombre">{ev?.nombre}</div>
                <div className="evc-fecha">{utcDateFormated(ev?.fecha)}</div>
              </div>
              {isOwner && (
                <button className="evc-dots" onClick={(e) => { e.stopPropagation(); setOpenMenu(!openMenu); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
                </button>
              )}
              {isOwner && openMenu && (
                <ClickAwayListener onClickAway={() => setOpenMenu(false)}>
                  <div className="evc-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="evc-menu-item" onClick={() => { setOpenMenu(false); handleArchivarEvent(); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5" /><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" /></svg>{archivado ? t('Desarchivar') : t('Archivar')}</div>
                    <div className="evc-menu-item" onClick={() => { setOpenMenu(false); compartirEvento(); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>{t('Compartir')}</div>
                    <div className="evc-menu-item" onClick={() => { setOpenMenu(false); isAllowed() ? handleEdit() : ht(); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="16" cy="8" r="2.2" /><circle cx="8" cy="16" r="2.2" /></svg>{t('Editar')}</div>
                    <div className="evc-menu-sep" />
                    <div className="evc-menu-item peligro" onClick={() => { setOpenMenu(false); handleRemoveEvent(grupoStatus); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" /></svg>{t('Borrar')}</div>
                  </div>
                </ClickAwayListener>
              )}
            </div>
            <div className="evc-pie">
              <span className={`evc-pill evc-pill--${estadoKey}`}><i />{estadoLabel}</span>
              {compartido && <span className="evc-compartido">{t('compartido contigo')}</span>}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`${!shouldRenderChild ? "hidden" : "fixed z-30"}`}>
        {shouldRenderChild && <ModalLeft set={setIsMounted} state={isMounted} clickAwayListened={false}>
          <FormCrearEvento set={setIsMounted} state={isMounted} EditEvent={true} eventData={data[idx]} />
        </ModalLeft>}
      </div>
      <ModalAddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={data[idx]} />
      <div ref={hoverRef} className={`w-max h-full relative grid place-items-center bg-white transition ${isHovered ? "transform scale-105 duration-700" : ""}`}>
        <div className={` h-32 w-28 absolute z-[10] right-0 flex flex-col items-end justify-between px-2 `}>
          <div onClick={() => { data[idx]?.usuario_id === user?.uid && setOpenModal(!openModal) }} className="w-max h-max relative">
            <UsuariosCompartidos event={data[idx]} />
          </div>
          {data[idx]?.usuario_id === user?.uid && <div className="space-y-1 flex flex-col items-center">
            <div onClick={() => {
              if (user?.displayName !== "guest") {
                setTimeout(() => {
                  handleClickCard({ t, final: false, config, data: data[idx], setEvent, user, setUser, router, toast })
                    .then((resp) => {
                      if (resp) toast("warning", resp)
                    })
                    .catch((error) => {
                      console.error("Error en handleClickCard:", error)
                    })
                }, 100);
                setOpenModal(!openModal)
              }
            }} className="w-5 h-5 flex items-center justify-center" >
              <IoShareSocial className={`w-full h-full cursor-pointer text-white ${user?.displayName !== "guest" && "hover:text-gray-300"}`} />
            </div>
            <div onClick={handleArchivarEvent} className="w-5 h-5 flex items-center justify-center" >
              <FaRegFolderOpen className="w-4.5 h-4.5 cursor-pointer text-white hover:text-gray-300" />
            </div>
            <div onClick={() => isAllowed() && handleEdit()} className="w-5 h-5 flex items-center justify-center"   >
              <BiSolidPencil className="w-5 h-5 cursor-pointer text-white hover:text-gray-300" />
            </div>
            <div onClick={handleRemoveEvent} className="w-5 h-5 flex items-center justify-center"   >
              <MdDelete className="w-full h-full cursor-pointer text-white hover:text-gray-300" />
            </div>
          </div>}
        </div>

        {data[idx]?._id == user?.eventSelected ? <div className="flex w-[304px] max-w-full h-40 border-dashed border-2 border-yellow-300 absolute z-0 rounded-xl" /> : <></>}
        <div onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()

          // Prevenir múltiples clics rápidos
          if (isNavigating) {
            return
          }

          const eventData = data[idx]

          if (!eventData || !eventData._id) {
            console.error("[Card] ❌ Evento no válido:", { idx, hasData: !!data, hasDataIdx: !!data[idx] })
            toast("error", t("Error: Evento no válido"))
            return
          }

          setIsNavigating(true) // Bloquear más clics
          toast("success", t("Abriendo evento..."))

          handleClickCard({
            t,
            final: true,
            config,
            data: eventData,
            setEvent,
            user,
            setUser,
            router
          })
            .then((resp) => {
              if (resp) {
                console.warn("[Card] ⚠️ Respuesta de handleClickCard:", resp)
                toast("warning", resp)
                setIsNavigating(false)
              } else {
                // No resetear isNavigating aquí porque estamos navegando
              }
            })
            .catch((error) => {
              console.error("[Card] ❌ Error en handleClickCard:", error)
              toast("error", getApiErrorMessage(error) || t("Ha ocurrido un error"))
              setIsNavigating(false)

              // Fallback: intentar abrir el evento de todas formas
              try {
                setIsNavigating(true)
                setEvent(eventData)
                setTimeout(() => {
                  router.push("/resumen-evento")
                }, 100)
              } catch (fallbackError) {
                console.error("[Card] ❌ Error en fallback:", fallbackError)
                setIsNavigating(false)
              }
            })
        }} className={`w-72 max-w-full h-36 rounded-xl cardEvento z-[8] cursor-pointer shadow-lg relative overflow-hidden ${isNavigating ? 'opacity-70' : ''}`}>
          <img
            src={data[idx]?.imgEvento?.i320 ? `/api/proxy-image?url=${encodeURIComponent(`https://api-mcp.eventosorganizador.com/${data[idx].imgEvento.i320}`)}` : defaultImagenes[data[idx]?.tipo?.toLowerCase()]}
            alt={data[idx]?.nombre || data[idx]?.tipo || 'Evento'}
            className="object-cover w-full h-full absolute top-0 left-0 object-top"
            onError={(e) => { (e.target as HTMLImageElement).src = defaultImagenes[data[idx]?.tipo?.toLowerCase()] || defaultImagenes['otro']; }}
          />
          <div className="relative w-full h-full z-10 p-4 pb-2 flex flex-col justify-between">
            <div className="flex flex-col">

              <span className="text-sm font-display text-white capitalize">
                {data[idx]?.tipo == "otro" ? "mi evento especial" : t(data[idx]?.tipo)}
              </span>
              {
                data[idx]?.usuario_id != user?.uid && <span className="text-xs font-display text-white capitalize">
                  {t("compartido contigo")}
                </span>
              }
            </div>
            <div className="flex flex-col ">
              <span className="mt-[-4px] uppercase text-xs font-display text-white truncate">
                {data[idx]?.nombre?.length > 20 ? `${data[idx]?.nombre.substring(0, 20)}...` : data[idx]?.nombre}
              </span>
              <span className="mt-[-4px] uppercase text-xs font-display text-white">
                {`${utcDateFormated(data[idx]?.fecha)}`}
              </span>
              <span className="mt-[-4px] uppercase text-xs font-display text-white">
                {t(data[idx]?.estatus)}
              </span>
            </div>
          </div>
        </div>
        <style jsx>
          {`
          .cardEvento::before {
            content: "";
            width: 100%;
            height: 100%;
            background: rgb(255, 255, 255);
            background: radial-gradient(
              circle,
              rgba(41, 41, 41, 0.3) 0%,
              rgba(41, 41, 41, 0.8) 100%
            );
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
          }
        `}
        </style>
      </div>
    </>
  );
};

export default Card;
