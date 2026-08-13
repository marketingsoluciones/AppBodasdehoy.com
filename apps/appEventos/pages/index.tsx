import { SetStateAction, useEffect, useState, useRef, Dispatch, FC, useMemo } from "react";
import { createPortal } from "react-dom";
import ClickAwayListener from "react-click-away-listener";
import { motion } from "framer-motion";
import { LineaHome } from "../components/icons";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, LoadingContextProvider, } from "../context";
import Card, { handleClickCard } from "../components/Home/Card";
import CardEmpty from "../components/Home/CardEmpty";
import FormCrearEvento from "../components/Forms/FormCrearEvento";
import ModalLeft from "../components/Utils/ModalLeft";
import { useDelayUnmount } from "../utils/Funciones";
import { NextPage } from "next";
import { Event, SelectModeSortType } from "../utils/Interfaces";
import VistaSinCookie from "../pages/vista-sin-cookie"
import { useRouter } from "next/router";
import Link from "next/link";
import { useToast } from "../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { TbTableShare } from "react-icons/tb";
import { SelectModeSort } from "../components/Utils/SelectModeSort";
import EventNotFound from "../components/Utils/EventNotFound";
import CopilotFilterBar from "../components/Utils/CopilotFilterBar";

const Home: NextPage = () => {
  const { user, verificationDone, config, setUser } = AuthContextProvider()
  const { eventsGroup, eventsGroupDone, eventsGroupError, eventsGroupErrorMessage, eventsGroupSessionExpired, refreshEventsGroup } = EventsGroupContextProvider()
  const { setEvent } = EventContextProvider()
  const loadingContext = LoadingContextProvider()
  const setLoading = loadingContext?.setLoading || (() => {}) // Safe fallback
  const [valirQuery, setValirQuery] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(valirQuery, 500);
  const [showEditEvent, setShowEditEvent] = useState<boolean>(false);
  const [showGuestRegisterModal, setShowGuestRegisterModal] = useState(false);
  const prevEventsLengthRef = useRef<number>(0);
  const router = useRouter()
  const toast = useToast()
  const { t } = useTranslation()
  const processedRef = useRef<string | null>(null)
  const [eventNotFound, setEventNotFound] = useState<boolean>(false)
  const eventsLoadStartRef = useRef<number | null>(null)
  const [eventsLoadSeconds, setEventsLoadSeconds] = useState(0)
  const [restoreSessionSeconds, setRestoreSessionSeconds] = useState(0)
  const [restoreSessionGiveUp, setRestoreSessionGiveUp] = useState(false)

  // Query params usando router.query (Pages Router)
  const pAccShas = typeof router.query.pAccShas === 'string' ? router.query.pAccShas : null
  const pGuestEvent = typeof router.query.pGuestEvent === 'string' ? router.query.pGuestEvent : null

  // Mover setLoading fuera del render para evitar "Cannot update a component while rendering"
  useEffect(() => {
    if (verificationDone && eventsGroupDone && user && user.displayName !== "guest" && !pAccShas) {
      setLoading(false)
    }
  }, [verificationDone, eventsGroupDone, user, pAccShas, setLoading])

  // Cronómetro mientras se esperan eventos (esta vista no monta el banner hasta pasar esta fase).
  const waitingEventsList = verificationDone && !eventsGroupDone
  useEffect(() => {
    if (!waitingEventsList) {
      eventsLoadStartRef.current = null
      setEventsLoadSeconds(0)
      return
    }
    if (eventsLoadStartRef.current === null) eventsLoadStartRef.current = Date.now()
    const id = window.setInterval(() => {
      setEventsLoadSeconds(Math.floor((Date.now() - (eventsLoadStartRef.current ?? Date.now())) / 1000))
    }, 400)
    return () => clearInterval(id)
  }, [waitingEventsList])

  const shouldRestoreSession =
    verificationDone &&
    eventsGroupDone &&
    !user &&
    typeof window !== 'undefined' &&
    !!localStorage.getItem('appEventos_activeEventId')

  useEffect(() => {
    if (!shouldRestoreSession) {
      setRestoreSessionSeconds(0)
      setRestoreSessionGiveUp(false)
      return
    }

    const start = Date.now()
    const intervalId = window.setInterval(() => {
      setRestoreSessionSeconds(Math.floor((Date.now() - start) / 1000))
    }, 400)

    // BUG-NEW-12 fix QA #32 (28-jun): el setTimeout de 6s borraba
    // activeEventId cuando Firebase tardaba en hidratar en mobile/4G
    // → user perdía su evento activo y al re-loguear veía "primero
    // crea evento" pese a tener bodas en BD.
    // Fix: NO borrar activeEventId al timeout (solo redirigir a login).
    // Si la sesión sigue válida tras login, el evento se restaura.
    // Subido timeout 6s→15s para mobile/4G más lento.
    const giveUpId = window.setTimeout(() => {
      setRestoreSessionGiveUp(true)

      const loginUrl = config?.pathLogin ? `${config.pathLogin}?restore=1` : '/login?restore=1'
      window.location.href = loginUrl
    }, 15000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(giveUpId)
    }
  }, [shouldRestoreSession, config?.pathLogin])

  // Mostrar error si la API de eventos falla (403 = sesión; 502/503 = servidor; otro = genérico).
  // No mostrar si no hay usuario logueado (usuario libre/guest): no se cargan eventos, no tiene sentido el mensaje.
  useEffect(() => {
    if (eventsGroupError && user && user.displayName !== "guest") {
      const message = eventsGroupErrorMessage || t("Error al cargar los eventos. El servidor no responde, inténtalo de nuevo en unos minutos.")
      toast("error", message)
    }
  }, [eventsGroupError, eventsGroupErrorMessage, user])

  // Detectar cuando un guest crea su primer evento → mostrar modal de registro
  useEffect(() => {
    const currentLength = eventsGroup?.length ?? 0
    const isGuest = user?.displayName === 'guest'
    if (isGuest && prevEventsLengthRef.current === 0 && currentLength > 0) {
      setShowGuestRegisterModal(true)
    }
    prevEventsLengthRef.current = currentLength
  }, [eventsGroup, user])

  useEffect(() => {
    if (verificationDone && eventsGroupDone && pAccShas && processedRef.current !== pAccShas) {
      if (!user || user?.displayName === "guest") {
        router.push(config?.pathLogin ? `${config?.pathLogin}?pAccShas=${pAccShas}` : `/login?pAccShas=${pAccShas}`)
        return
      }
      const data = eventsGroup?.find(elem => elem?._id === pAccShas?.slice(-24))
      if (data) {
        processedRef.current = pAccShas
        setEventNotFound(false)
        handleClickCard({ t, final: true, config, data, setEvent, user, setUser, router })
          .then((resp) => {
            if (resp) toast("warning", resp)
          })
          .catch((error) => {
            console.error("Error en handleClickCard:", error)
            toast("error", t("Ha ocurrido un error"))
          })
      } else {
        // Evento no encontrado
        processedRef.current = pAccShas
        setEventNotFound(true)
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationDone, eventsGroupDone, pAccShas, user, eventsGroup, router])

  // Sin usuario: rutas protegidas → VistaSinCookie. En "/" la portada visitante no debe quedar en spinner infinito.
  if (verificationDone && !user && router.pathname !== "/") {
    return <VistaSinCookie />;
  }
  
  // Si hay usuario pero aún no se han cargado los eventos, mostrar loading
  // Esto evita mostrar VistaSinCookie cuando el usuario acaba de hacer login
  if (!verificationDone || !eventsGroupDone) {
    // Si hay usuario, mostrar loading (está cargando eventos)
    // Si no hay usuario, ya se maneja arriba con VistaSinCookie
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-sm font-medium text-gray-700">Cargando tus eventos…</p>
          <p className="text-2xl font-semibold tabular-nums text-primary">{eventsLoadSeconds}s</p>
          <p className="text-xs text-gray-400">
            Aquí se consulta el servidor de datos; la imagen del banner aún no entra en juego.
          </p>
        </div>
      </div>
    );
  }

  if (verificationDone && eventsGroupDone) {
    // Mostrar componente cuando el evento no se encuentra
    if (pAccShas && eventNotFound) {
      return (
        <EventNotFound
          onBackToHome={() => {
            setEventNotFound(false)
            processedRef.current = null
          }}
        />
      )
    }
    // Mientras procesa el pAccShas, mostrar loading
    if (pAccShas && !eventNotFound) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )
    }
    if (pGuestEvent) {
      router.push(`/confirmar-asistencia?pGuestEvent=${pGuestEvent}`)
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )
    }
    if ((!user || user.displayName === "guest") && ["vivetuboda"].includes(config?.development)) {
      router?.push(`/login`)
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )
    }
    if (!user) {
      const wasLoggedIn = typeof window !== 'undefined' && localStorage.getItem('appEventos_activeEventId')
      if (wasLoggedIn) {
        return (
          <div className="flex items-center justify-center h-screen w-full bg-white px-4">
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              <p className="text-sm font-medium text-gray-700">Restaurando sesión…</p>
              <p className="text-xs text-gray-400">Esto suele tardar unos segundos tras recargar.</p>
              <p className="text-2xl font-semibold tabular-nums text-primary">{restoreSessionSeconds}s</p>
              {restoreSessionGiveUp && (
                <a
                  href={config?.pathLogin ? `${config.pathLogin}?restore=1` : '/login?restore=1'}
                  className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition"
                >
                  Ir a iniciar sesión
                </a>
              )}
            </div>
          </div>
        )
      }
      if (router.pathname === "/") {
        return <LandingVisitante />;
      }
      return <VistaSinCookie />;
    }
    // NOTA: setLoading se movió a useEffect para evitar setState durante render
    return (
      <>
        {shouldRenderChild && (
          <ModalLeft state={valirQuery} set={setValirQuery}>
            {showEditEvent ?
              <FormCrearEvento state={valirQuery} set={setValirQuery} EditEvent={showEditEvent} />
              : <FormCrearEvento state={valirQuery} set={setValirQuery} />
            }
          </ModalLeft>
        )}

        {/* Modal de conversión para guests — aparece tras crear el primer evento */}
        {showGuestRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center gap-4 text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="font-display text-xl font-semibold text-gray-800">
                ¡Tu evento está listo!
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Has creado tu evento. <strong>Regístrate gratis</strong> para guardarlo de forma permanente, gestionar invitados, presupuesto e itinerario, y usar el asistente IA.
              </p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <a
                  href={config?.pathLogin ? `${config.pathLogin}?q=register` : '/login?q=register'}
                  className="w-full py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition text-center"
                >
                  Crear cuenta gratis
                </a>
                <button
                  onClick={() => setShowGuestRegisterModal(false)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Continuar como invitado (perderás los datos al cerrar)
                </button>
              </div>
            </div>
          </div>
        )}

        <section id="rootsection" className="section relative w-full flex flex-col">
          <Banner state={valirQuery} set={setValirQuery} />
          <GridCards
            state={valirQuery}
            set={setValirQuery}
            eventsGroupError={eventsGroupError}
            eventsGroupErrorMessage={eventsGroupErrorMessage}
            eventsGroupSessionExpired={eventsGroupSessionExpired}
            refreshEventsGroup={refreshEventsGroup}
          />
        </section>
      </>
    );
  }
  
  // ✅ CORRECCIÓN CRÍTICA: SIEMPRE retornar contenido válido para evitar 404
  // Mientras se cargan los datos, mostrar loading con contenido HTML válido
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white px-4">
      <div className="flex flex-col items-center gap-3 text-center max-w-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="text-sm font-medium text-gray-700">Cargando tus eventos…</p>
        <p className="text-2xl font-semibold tabular-nums text-primary">{eventsLoadSeconds}s</p>
        <p className="text-xs text-gray-400">
          Consultando el servidor; el banner de portada se pinta en el siguiente paso.
        </p>
      </div>
    </div>
  );
};

export default Home;



interface propsBanner {
  state: boolean;
  set: Dispatch<SetStateAction<boolean>>;
}
const Banner: FC<propsBanner> = ({ set, state }) => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const { actionModals, setActionModals } = AuthContextProvider()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const routerBanner = useRouter()
  // Banner rediseñado (studio) = vista POR DEFECTO (rollback ?studio=legacy).
  const studio = routerBanner.query.studio !== "legacy"

  // Dynamic import to avoid SSR issues
  const [planLimits, setPlanLimits] = useState<any>(null)
  useEffect(() => {
    import('../hooks/usePlanLimits').then(() => {})
  }, [])

  const ConditionalAction = () => {
    // Use plan-based limit if available, fallback to legacy 100
    const limit = planLimits?.eventLimit ?? 100
    if (eventsGroup.length >= limit) {
      setShowUpgradeModal(true)
    } else {
      set(!state)
    }
  }
  return (
    studio ? (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          .she-hero{max-width:1100px;margin:0 auto;padding:44px 24px 70px;display:grid;grid-template-columns:1.05fr 1fr;gap:44px;align-items:center;font-family:'Poppins',sans-serif;}
          @media (max-width:900px){.she-hero{grid-template-columns:1fr;}}
          .she-chip{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #FCE7F0;box-shadow:0 3px 10px rgba(239,91,148,.1);color:#D83E7C;font:600 12px Poppins;padding:7px 16px;border-radius:20px;margin-bottom:24px;}
          .she-titulo{font:600 40px/1.14 Poppins;color:#3A3A42;letter-spacing:-1px;margin-bottom:12px;}
          .she-titulo .grad{background:linear-gradient(100deg,#EF5B94,#D83E7C);-webkit-background-clip:text;background-clip:text;color:transparent;}
          .she-sub{font:400 14.5px/1.6 Poppins;color:#6b6b72;margin-bottom:24px;max-width:390px;}
          .she-cta{display:inline-flex;align-items:center;gap:9px;padding:13px 26px;border-radius:10px;background:#EF5B94;color:#fff;font:600 14px Poppins;border:none;cursor:pointer;box-shadow:0 6px 16px rgba(239,91,148,.3);transition:transform .15s,background .15s;}
          .she-cta:hover{background:#D83E7C;transform:translateY(-2px);}
          .she-social{display:flex;align-items:center;gap:12px;margin-top:26px;}
          .she-avatars{display:flex;}
          .she-avatars>div{width:34px;height:34px;border-radius:50%;border:2.5px solid #fff;}
          .she-avatars>div+div{margin-left:-10px;}
          .she-av1{background:linear-gradient(135deg,#f9c8dc,#EF5B94);}
          .she-av2{background:linear-gradient(135deg,#e8d3c4,#c9a24b);}
          .she-av3{background:linear-gradient(135deg,#d4c8e8,#8e7cc3);}
          .she-avmas{background:#FCE7F0;color:#D83E7C;display:flex;align-items:center;justify-content:center;font:700 10px Poppins;}
          .she-social-txt{font:500 12.5px/1.45 Poppins;color:#8a8a90;}
          .she-social-txt b{color:#3A3A42;}
          .she-visual{position:relative;max-width:390px;justify-self:end;width:100%;pointer-events:none;user-select:none;}
          .she-halo{position:absolute;inset:-30px -10px -30px 30px;background:radial-gradient(circle at 65% 40%, #FCE7F0 0%, rgba(252,231,240,0) 68%);z-index:0;}
          .she-card{position:relative;z-index:1;background:#fff;border:1px solid #f0f0f2;border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.1);overflow:hidden;}
          .she-card-head{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f4f4f6;}
          .she-card-tipo{font:600 10px Poppins;color:#EF5B94;letter-spacing:.6px;}
          .she-card-nombre{font:700 15px Poppins;color:#3A3A42;}
          .she-card-fecha{display:flex;align-items:center;gap:6px;background:#FBF0DA;color:#E0A32B;font:600 11px Poppins;padding:5px 12px;border-radius:20px;}
          .she-card-fecha i{width:6px;height:6px;border-radius:50%;background:#E0A32B;}
          .she-card-foto{width:100%;height:170px;object-fit:cover;display:block;background:#f2f2f4;}
          .she-card-stats{padding:16px 20px;display:flex;gap:10px;}
          .she-stat{flex:1;background:#faf9fb;border:1px solid #f0f0f2;border-radius:12px;padding:10px 14px;text-align:center;}
          .she-stat .num{font:700 16px Poppins;color:#3A3A42;}
          .she-stat .num.rosa{color:#EF5B94;}
          .she-stat .num.verde{color:#2FB37E;}
          .she-stat .lbl{font:500 10px Poppins;color:#9aa0a6;}
          .she-card-botones{padding:0 20px 18px;display:flex;gap:10px;}
          .she-card-botones button{flex:1;padding:12px;border-radius:10px;background:#fff;border:1.5px solid #F3B6CE;color:#EF5B94;font:600 12.5px Poppins;cursor:pointer;}
          .she-countdown{position:absolute;bottom:-52px;right:-14px;z-index:2;background:#fff;border:1px solid #f0f0f2;border-radius:14px;box-shadow:0 10px 26px rgba(0,0,0,.12);padding:12px 16px;display:flex;gap:14px;}
          .she-countdown .sep{width:1px;background:#f0f0f2;}
          .she-countdown .u{text-align:center;}
          .she-countdown .n{font:700 17px Poppins;color:#3A3A42;}
          .she-countdown .n.rosa{color:#EF5B94;}
          .she-countdown .l{font:500 9.5px Poppins;color:#9aa0a6;}
        ` }} />
        <div className="bg-base w-full">
          <section className="she-hero">
            {/* IZQUIERDA */}
            <div>
              <div className="she-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#EF5B94"><path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" /></svg>
                Para wedding planners, proveedores y parejas
              </div>
              <h1 className="she-titulo">Todos tus eventos,<br />gestionados <span className="grad">sin estrés</span></h1>
              <p className="she-sub">Invitados, mesas, presupuesto e invitaciones, cada evento en un solo lugar.</p>
              <button className="she-cta" onClick={() => ConditionalAction()}>
                Empieza a organizar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
              <div className="she-social">
                <div className="she-avatars">
                  <div className="she-av1"></div><div className="she-av2"></div><div className="she-av3"></div><div className="she-avmas">+12k</div>
                </div>
                <div className="she-social-txt">Más de <b>12.000 profesionales y parejas</b><br />ya organizan sus eventos aquí</div>
              </div>
            </div>
            {/* DERECHA: tarjeta de ejemplo (ilustrativa) */}
            <div className="she-visual">
              <div className="she-halo"></div>
              <div className="she-card">
                <div className="she-card-head">
                  <div style={{ lineHeight: 1.25 }}>
                    <div className="she-card-tipo">BODA</div>
                    <div className="she-card-nombre">Boda Luis y Carla</div>
                  </div>
                  <span className="she-card-fecha"><i></i>18 Nov 2028</span>
                </div>
                <img className="she-card-foto" src="/studio/hero-evento-ejemplo.jpg" alt="Foto del evento" />
                <div className="she-card-stats">
                  <div className="she-stat"><div className="num rosa">4 de 6</div><div className="lbl">pasos del evento</div></div>
                  <div className="she-stat"><div className="num">100</div><div className="lbl">invitados totales</div></div>
                  <div className="she-stat"><div className="num verde">50 de 50</div><div className="lbl">sentados en tu evento</div></div>
                </div>
                <div className="she-card-botones">
                  <button>Ver mi itinerario</button>
                  <button>Lugar del evento</button>
                </div>
              </div>
              <div className="she-countdown">
                <div className="u"><div className="n">24</div><div className="l">días</div></div>
                <div className="sep"></div>
                <div className="u"><div className="n">12</div><div className="l">horas</div></div>
                <div className="sep"></div>
                <div className="u"><div className="n rosa">59</div><div className="l">min</div></div>
              </div>
            </div>
          </section>
        </div>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center gap-4 text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="font-display text-xl font-semibold text-gray-800">Has llegado al límite de eventos</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{planLimits?.upgradeMessage?.('events-count') || 'Actualiza tu plan para crear más eventos.'}</p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <Link href="/facturacion" className="w-full py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition text-center">Ver planes</Link>
                <button onClick={() => setShowUpgradeModal(false)} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </>
    ) : (
    <div className="banner bg-base w-full flex justify-center h-[48%] md:h-[60%] min-h-[48%] md:min-h-[400px] px-5 md:px-0 overflow-hidden relative mb-1">
      <div className="md:max-w-screen-lg 2xl:max-w-screen-xl w-full grid md:grid-cols-5 h-full">
        <div className="flex flex-col justify-center relative py-10 md:py-0 col-span-2">
          <h2 className="font-display font-medium text-2xl md:text-5xl tracking-tight	text-primary mb-1.5">
            {t("organizeyourevents")}
          </h2>
          <h3 className="font-display font-medium text-1xl md:text-3xl tracking-tight	text-gray-500 mb-1.5">
            {t("sharecollaborateinvite")}
          </h3>
          <h1 className="font-display font-base text-md tracking-tight text-primary">
            {t("planyourcelebrations") + " "} <span className="font-semibold">{t("sin estres")}</span>
          </h1>
          <span className="flex gap-2 justify-start items-end">
            <button
              onClick={() => ConditionalAction()}
              className="mt-4 bg-primary font-display font-medium text-white px-5 md:px-24 py-2 rounded-lg  box-border hover:bg-gray-200 transition focus:outline-none z-20"
            >
              {t("createanevent")}
            </button>
          </span>
          <LineaHome className="hidden md:flex md:-bottom-10 xl:-bottom-5 absolute z-10 left-0 w-max" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden col-span-3"
        >
          {/* <CircleBanner className="w-full h-auto top-12 transform translate-y-1/6 absolute bottom-0 right-0 left-2 z-0" /> */}
          <img
            className="z-20 image mx-auto inset-x-0 relative top-6 md:top-16 w-full h-auto max-w-[520px] object-contain"
            src="/IndexImg2.png"
            alt=""
            width={520}
            height={500}
            decoding="async"
            fetchPriority="low"
          />
        </motion.div>
      </div>

      <style jsx>
        {`
          .circle {
            height: 600px;
            width: 600px;
          }
          .image {
            /* Altura automática: el mockup del teléfono conserva su proporción
               natural (antes height fija 260/500px + w-full = imagen estirada). */
            height: auto;
          }
        `}
      </style>

      {/* Plan upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-4xl">🎉</div>
            <h2 className="font-display text-xl font-semibold text-gray-800">
              Has llegado al límite de eventos
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {planLimits?.upgradeMessage?.('events-count') || 'Actualiza tu plan para crear más eventos.'}
            </p>
            <div className="flex flex-col gap-2 w-full mt-2">
              <Link
                href="/facturacion"
                className="w-full py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition text-center"
              >
                Ver planes
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  );
};

interface propsGridCards {
  state: boolean
  set: Dispatch<SetStateAction<boolean>>
  eventsGroupError: boolean
  eventsGroupErrorMessage: string | null
  eventsGroupSessionExpired: boolean
  refreshEventsGroup: () => void
}

type dataTab = {
  status: string
  data: Event[]
  vacio: number[]
}

export const Lista = [
  { nombre: "Pendientes", value: "pendiente", color: "primary" },
  { nombre: "Archivados", value: "archivado", color: "gray-300" },
  { nombre: "Realizados", value: "realizado", color: "secondary" },
];

const GridCards: FC<propsGridCards> = ({
  state,
  set: setNewEvent,
  eventsGroupError,
  eventsGroupErrorMessage,
  eventsGroupSessionExpired,
  refreshEventsGroup,
}) => {
  const { t } = useTranslation();
  const { eventsGroup, copilotFilter } = EventsGroupContextProvider();
  const { user } = AuthContextProvider();
  const { idxGroupEvent, setIdxGroupEvent } = EventContextProvider()
  const [isActiveStateSwiper, setIsActiveStateSwiper] = useState<number>(idxGroupEvent?.isActiveStateSwiper)
  const [tabsGroup, setTabsGroup] = useState<dataTab[]>([]);
  const [idxNew, setIdxNew] = useState<number>(-2)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderAndDirection, setOrderAndDirection] = useState<SelectModeSortType>({ order: "fecha", direction: "desc" })
  const [ordenOpen, setOrdenOpen] = useState(false)
  const [mountedFab, setMountedFab] = useState(false)
  useEffect(() => { setMountedFab(true) }, [])

  const handleMouseEnter = () => {
    setIsModalVisible(true);
  };
  const router = useRouter()

  const handleMouseLeave = () => {
    setIsModalVisible(false);
  };
  useEffect(() => {
    if (eventsGroup) {
      const arrNuevo = eventsGroup?.reduce((acc, event) => {
        const raw = event?.estatus != null && String(event.estatus).trim() !== ''
          ? String(event.estatus).toLowerCase().trim()
          : '';
        const bucket =
          raw === 'archivado' || raw === 'realizado' || raw === 'pendiente' ? raw : 'pendiente';
        acc[bucket]?.push(event);
        return acc;
      },
        { pendiente: [], archivado: [], realizado: [] }
      );

      const countEmptys = (arr) => {
        if (arr.length < 3) {
          const NewArr = [];
          for (let i = 0; i < Math.abs(arr?.length - 3); i++) NewArr.push(i);
          return NewArr;
        }
        return [];
      };

      const result: dataTab[] = Object.entries(arrNuevo).map((eventos: any[]) => {
        const events = eventos[1]
        const eventsSort = events?.sort((a: any, b: any) => {
          const aNew = a.fecha_creacion.length < 16 ? parseInt(a.fecha_creacion) : new Date(a.fecha_creacion).getTime()
          const bNew = b.fecha_creacion.length < 16 ? parseInt(b.fecha_creacion) : new Date(b.fecha_creacion).getTime()
          return bNew - aNew
        })
        return ({
          status: eventos[0],
          data: eventsSort,
          vacio: countEmptys(eventos[1]),
        })
      });
      setTabsGroup(result);
    }
  }, [eventsGroup, idxGroupEvent]);

  useEffect(() => {
    setIdxNew(
      tabsGroup[isActiveStateSwiper]?.data?.findIndex((elem) => elem != null && elem._id == idxGroupEvent.event_id) ?? -1,
    )
  }, [tabsGroup])

  useEffect(() => {
    if (idxNew > -1) {
      setTimeout(() => {
        setIdxGroupEvent((old: any) => {
          return { ...old, idx: idxNew }
        })
      }, 10);
    }
  }, [idxNew])

  // Aplicar filtro del Copilot cuando entity === 'events'
  const displayedTabsGroup = useMemo(() => {
    if (!copilotFilter || copilotFilter.entity !== 'events' || !copilotFilter.ids?.length) {
      return tabsGroup;
    }
    const idSet = new Set(copilotFilter.ids);
    return tabsGroup.map(group => ({
      ...group,
      data: group.data.filter(e => idSet.has(e._id)),
      vacio: [],
    }));
  }, [tabsGroup, copilotFilter]);

  // Grid rediseñado (studio, por defecto; rollback ?studio=legacy)
  const studio = (router as any)?.query?.studio !== "legacy";
  const activeIdx = Number.isInteger(isActiveStateSwiper) ? isActiveStateSwiper : 0;
  // Estados (spec owner): Activos/Realizados automáticos por FECHA; Archivados manual;
  // Compartidos = eventos donde NO soy dueño. Activos/Realizados/Archivados listan solo MIS eventos.
  const studioGroups = useMemo(() => {
    const uid = user?.uid;
    const idSet = (copilotFilter && copilotFilter.entity === "events" && copilotFilter.ids?.length) ? new Set(copilotFilter.ids) : null;
    const all = (eventsGroup ?? []).filter(Boolean).filter((e: any) => !idSet || idSet.has(e._id));
    const todayStart = new Date().setHours(0, 0, 0, 0);
    // fecha puede venir como ms ("1830297600000") o ISO ("2028-01-01"); parseInt de un ISO
    // devuelve el año → hay que parsear como utcDateFormated (ms-string vs fecha real).
    const fechaMs = (f: any) => {
      if (f == null) return NaN;
      const s = String(f);
      const d = (!s.includes("T") && !s.includes("-")) ? new Date(parseInt(s)) : new Date(s);
      return d.getTime();
    };
    const bucketOf = (e: any) => {
      if (String(e?.estatus ?? "").toLowerCase().includes("archiv")) return "archivado";
      const ms = fechaMs(e?.fecha);
      return (!Number.isNaN(ms) && ms < todayStart) ? "realizado" : "activo";
    };
    const mine = all.filter((e: any) => e?.usuario_id === uid);
    const shared = all.filter((e: any) => e?.usuario_id && uid && e.usuario_id !== uid);
    return [
      { label: "Activos", status: "activo", data: mine.filter((e: any) => bucketOf(e) === "activo") },
      { label: "Realizados", status: "realizado", data: mine.filter((e: any) => bucketOf(e) === "realizado") },
      { label: "Archivados", status: "archivado", data: mine.filter((e: any) => bucketOf(e) === "archivado") },
      { label: "Compartidos", status: "compartido", data: shared },
    ];
  }, [eventsGroup, user, copilotFilter]);
  const sortEvents = (arr: any[]) => {
    const items = [...(arr || [])];
    if (orderAndDirection?.order === "fecha") {
      items.sort((a, b) => {
        const da = new Date(parseInt(a?.fecha)).getTime(); const db = new Date(parseInt(b?.fecha)).getTime();
        return orderAndDirection.direction === "asc" ? da - db : db - da;
      });
    } else if (orderAndDirection?.order === "nombre") {
      items.sort((a, b) => orderAndDirection.direction === "asc" ? String(a.nombre).localeCompare(b.nombre) : String(b.nombre).localeCompare(a.nombre));
    }
    return items;
  };

  return (
    <div className="flex flex-col max-h-[calc(52%-4px)]">
      {eventsGroupError && !eventsGroupSessionExpired && (
        <div
          role="alert"
          className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold">{t("home_eventsLoadFailedTitle")}</p>
            <p className="text-xs text-red-800/90 mt-0.5">
              {eventsGroupErrorMessage || t("home_eventsLoadFailedBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refreshEventsGroup()}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition"
          >
            {t("home_eventsLoadFailedRetry")}
          </button>
        </div>
      )}
      <CopilotFilterBar entity="events" className="mx-4" />
      {studio ? (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          .evc-card{position:relative;border-radius:16px;background:#fff;border:1px solid #f0f0f2;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.05);transition:transform .18s,box-shadow .18s;}
          .evc-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(0,0,0,.12);}
          .evc-card.seleccionada{border:1.5px solid #EF5B94;}
          .evc-badge-sel{position:absolute;bottom:-9px;left:14px;display:flex;align-items:center;gap:5px;white-space:nowrap;background:#EF5B94;color:#fff;font:600 9.5px Poppins;letter-spacing:.4px;padding:4px 11px;border-radius:12px;box-shadow:0 4px 12px rgba(239,91,148,.4);z-index:3;}
          .evc-foto{position:relative;height:104px;border-radius:15px 15px 0 0;background-color:#f2f2f4;}
          .evc-tipo{position:absolute;top:10px;left:10px;background:rgba(255,255,255,.92);color:#3A3A42;font:700 9.5px Poppins;letter-spacing:.8px;padding:4px 10px;border-radius:12px;text-transform:uppercase;z-index:2;}
          .evc-avatar-wrap{position:absolute;top:8px;right:8px;z-index:2;}
          .evc-avatars{display:flex;align-items:center;}
          .evc-av{width:22px;height:22px;border-radius:50%;border:2px solid #fff;color:#fff;font:700 9px Poppins;display:flex;align-items:center;justify-content:center;position:relative;flex:none;}
          .evc-av + .evc-av{margin-left:-8px;}
          .evc-av-more{background:#f2f2f4;color:#8a8a90;}
          .evc-av-dot{position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;border-radius:50%;background:#2FB37E;border:1.5px solid #fff;}
          .evc-body{padding:12px 14px 13px;}
          .evc-fila{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;position:relative;}
          .evc-nombre{font:600 13px Poppins;color:#3A3A42;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .evc-fecha{font:500 11px Poppins;color:#8a8a90;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .evc-dots{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#8a8a90;flex:none;background:none;border:none;cursor:pointer;}
          .evc-dots:hover{background:#f5f5f7;color:#EF5B94;}
          .evc-pie{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;}
          .evc-pill{display:inline-flex;align-items:center;gap:5px;font:600 10px Poppins;padding:4px 10px;border-radius:12px;}
          .evc-pill i{width:5px;height:5px;border-radius:50%;background:currentColor;}
          .evc-pill--activo{background:#FBF0DA;color:#E0A32B;}
          .evc-pill--pendiente{background:#FBF0DA;color:#E0A32B;}
          .evc-pill--archivado{background:#f2f2f4;color:#8a8a90;}
          .evc-pill--realizado{background:#E4F5EE;color:#2FB37E;}
          .evc-compartido{font:500 10px Poppins;color:#8a8a90;}
          .evc-menu{position:absolute;top:30px;right:0;z-index:10;background:#fff;border:1px solid #f0f0f2;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.14);padding:6px;min-width:150px;}
          .evc-menu-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:8px;font:500 12px Poppins;color:#3A3A42;cursor:pointer;}
          .evc-menu-item:hover{background:#fdf8fa;color:#EF5B94;}
          .evc-menu-item.peligro{color:#D83E7C;}
          .evc-menu-item.peligro:hover{background:#FBE4EF;}
          .evc-menu-sep{height:1px;background:#f0f0f2;margin:4px 8px;}
          .orden-item:hover{background:#fdf8fa;}
        ` }} />
        <div className="md:flex-1 min-w-0 overflow-y-auto" style={{ background: "#fff", borderTop: "1px solid #f0f0f2", width: "100%", paddingTop: 28 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 14, maxWidth: 1240, margin: "0 auto", padding: "0 24px", width: "100%" }}>
          <div style={{ flex: 1, minWidth: 0 }} className="hidden md:block" />
          <div style={{ display: "flex", gap: 6, background: "#f5f5f7", borderRadius: 12, padding: 5, flexWrap: "wrap", justifyContent: "center" }}>
            {studioGroups.map((g, i) => {
              const active = activeIdx === i;
              return (
                <div key={i} onClick={() => setIsActiveStateSwiper(i)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, color: active ? "#EF5B94" : "#8a8a90", font: "600 12.5px Poppins", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {t(g.label)}
                  <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: active ? "#FCE7F0" : "#ececef", color: active ? "#D83E7C" : "#8a8a90", font: "600 10.5px Poppins", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{g.data.length}</span>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }} className="justify-center md:justify-end">
            <div style={{ position: "relative" }}>
              <div onClick={() => setOrdenOpen(!ordenOpen)} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", color: (orderAndDirection.order !== "fecha" || orderAndDirection.direction !== "desc") ? "#EF5B94" : "#6b6b72" }}>
                <span style={{ font: "600 12.5px Poppins" }}>{t("Ordenar")}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M6 9l6 6 6-6" /></svg>
              </div>
              {ordenOpen && (
                <ClickAwayListener onClickAway={() => setOrdenOpen(false)}>
                  <div style={{ position: "absolute", top: 26, right: 0, zIndex: 20, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,.14)", padding: 6, minWidth: 150 }}>
                    {[{ k: "fecha", l: "Fecha" }, { k: "nombre", l: "Nombre" }].map((o) => {
                      const sel = orderAndDirection.order === o.k;
                      return (
                        <div key={o.k} className="orden-item" onClick={() => setOrderAndDirection((p) => ({ ...p, order: o.k as any }))} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, font: `${sel ? 600 : 500} 12px Poppins`, color: "#3A3A42", cursor: "pointer" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: sel ? "#2FB37E" : "#e7e7ea", flex: "none" }} />{t(o.l)}
                        </div>
                      );
                    })}
                    <div style={{ height: 1, background: "#f0f0f2", margin: "4px 8px" }} />
                    {[{ k: "asc", l: "Ascendente" }, { k: "desc", l: "Descendente" }].map((o) => {
                      const sel = orderAndDirection.direction === o.k;
                      return (
                        <div key={o.k} className="orden-item" onClick={() => setOrderAndDirection((p) => ({ ...p, direction: o.k as any }))} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, font: `${sel ? 600 : 500} 12px Poppins`, color: "#3A3A42", cursor: "pointer" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: sel ? "#2FB37E" : "#e7e7ea", flex: "none" }} />{t(o.l)}
                        </div>
                      );
                    })}
                  </div>
                </ClickAwayListener>
              )}
            </div>
            <div onClick={() => router.push("/eventos")} title={t("Ver como tabla") as string} className="hidden md:flex" style={{ width: 34, height: 34, borderRadius: 9, border: "1.5px solid #E7E7EA", background: "#fff", alignItems: "center", justifyContent: "center", color: "#6b6b72", cursor: "pointer", flex: "none" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11" /></svg>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "22px 24px 64px", width: "100%" }} className="min-w-0">
          {(() => {
            const g = studioGroups[activeIdx] || studioGroups[0];
            const items = sortEvents(g.data);
            if (items.length === 0) {
              return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 20px", background: "#fff", border: "1.5px dashed #E7E7EA", borderRadius: 18 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", marginBottom: 18 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2C6.2 2 4 4.4 4 7.4c0 2.9 2 5.3 4.4 5.6l-.6 1.5h2.4L9.6 13C12 12.7 14 10.3 14 7.4 14 4.4 11.8 2 9 2z" /><path d="M16.5 5c-1.9 0-3.5 1.7-3.5 3.9 0 2 1.3 3.7 3 4l-.4 1.1h1.8L17 12.9c1.7-.3 3-2 3-4C20 6.7 18.4 5 16.5 5z" opacity=".55" /></svg>
                  </div>
                  <div style={{ font: "600 16px Poppins", color: "#3A3A42", marginBottom: 6 }}>{t("Aún no tienes eventos aquí")}</div>
                  <div style={{ font: "400 13px/1.6 Poppins", color: "#8a8a90", maxWidth: 340, marginBottom: 22 }}>{t("Crea un evento y empieza a organizar invitados, mesas e invitaciones en un solo lugar.")}</div>
                  {g.status === "activo" && (
                    <button onClick={() => setNewEvent(!state)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Empezar")}
                    </button>
                  )}
                </div>
              );
            }
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((evento, i) => (
                  <Card key={evento?._id || i} data={items} grupoStatus={g.status} idx={i} onSelect={() => setIdxGroupEvent({ idx: i, isActiveStateSwiper: activeIdx, event_id: evento._id })} />
                ))}
              </div>
            );
          })()}
        </div>
        </div>
        {mountedFab && studioGroups.some(g => g.data.length > 0) && createPortal(
          <button onClick={() => setNewEvent(!state)} title={t("Crear evento") as string} style={{ position: "fixed", bottom: 26, right: 30, zIndex: 60, display: "flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 10px 26px rgba(239,91,148,.4)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Crear evento")}
          </button>,
          document.body
        )}
      </>
      ) : (
      <>
      <div className="w-full h-10 flex">
        <div className="flex-1" />
        <div className="inline-flex gap-4 py-2">
          {Lista.map((item, idx) => (
            <button
              onClick={(e) => setIsActiveStateSwiper(idx)}
              key={idx}
              // BUG-CW-N16 (informe QA 23-jun 5ª ronda): tabs Pendientes/Archivados/
              // Realizados tenían py-0.5 → altura total 24px, muy por debajo del
              // mínimo 44px de Apple HIG. Subido a py-2 + min-h-[44px] para tap fácil.
              className={`${isActiveStateSwiper == idx ? `bg-${item.color} text-white` : "bg-white text-gray-500"} w-max px-4 py-2 min-h-[44px] rounded-xl flex items-center justify-center cursor-pointer hover:bg-${item.color} hover:text-gray-500 transition focus:outline-none text-sm font-display`}
            >
              {t(item.nombre)}
            </button>
          ))}
        </div>
        <div className="flex-1 h-full flex justify-end items-center px-4 relative space-x-4" >
          <SelectModeSort value={orderAndDirection} setValue={setOrderAndDirection} />
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer hidden md:block "
            onClick={() => router.push("/eventos")}
          >
            <TbTableShare className="h-5 w-5 text-gray-700 hover:text-gray-900" />
            {isModalVisible && (
              <div className="modal absolute w-36 z-50 text-[10px] px-[5px] bg-gray-500 text-white rounded-md -translate-x-full flex justify-center">
                Cambiar a vista de tabla
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-1 min-w-0 overflow-x-scroll md:overflow-clip pt-4">
        {displayedTabsGroup.map((group, idx) => {
          if (orderAndDirection?.order) {
            group?.data?.sort((a, b) => {
              if (orderAndDirection.order === "fecha") {
                const dateA = new Date(parseInt(a?.fecha)).getTime();
                const dateB = new Date(parseInt(b?.fecha)).getTime();
                return orderAndDirection.direction === "asc" ? dateA - dateB : dateB - dateA;
              }
              if (orderAndDirection.order === "nombre") {
                return orderAndDirection.direction === "asc" ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
              }
              return 0;
            });
          }
          return (
            <div key={idx} className={`${isActiveStateSwiper !== idx && "hidden"} mb-6 grid min-w-0 grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-3`}>
              {isActiveStateSwiper == idx ? (
                <>
                  {group?.data?.map((evento, idx) => {
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-center my-3 min-w-0"
                      >
                        <Card data={group.data} grupoStatus={group.status} idx={idx} onSelect={() => setIdxGroupEvent({ idx, isActiveStateSwiper, event_id: evento._id })} />
                      </div>
                    )
                  })}
                  {group.status !== "pendiente"
                    ? group.data?.length === 0 && <div className={`flex items-center justify-center my-3`} >
                      <div className={`w-72 h-36 rounded-xl flex flex-col items-center justify-center shadow-lg bg-base border border-gray-100 transition`}>
                        <p className="font-display font-base text-md">{t(`Ningún evento ${group.status}`)}</p>
                      </div>
                    </div>
                    : <div
                      className={`flex items-center justify-center my-3 `}
                    >
                      <CardEmpty state={state} set={setNewEvent} />
                    </div>
                  }
                </>
              ) : null}
            </div>
          )
        })}
      </div>
      </>
      )}
    </div >
  );
};

/** Landing comercial multimarca para visitantes no logueados */
const LandingVisitante: FC = () => {
  const { config } = AuthContextProvider();
  const { t } = useTranslation();
  const pathLogin = config?.pathLogin || '/login';
  const registerHref = pathLogin.includes('?') ? `${pathLogin}&q=register` : `${pathLogin}?q=register`;

  const features = [
    { icon: '👥', title: t('landing.feat.guests', { defaultValue: 'Gestión de invitados' }), desc: t('landing.feat.guestsDesc', { defaultValue: 'Lista completa, confirmaciones RSVP, acompañantes y control de asistencia' }) },
    { icon: '🪑', title: t('landing.feat.tables', { defaultValue: 'Editor de mesas' }), desc: t('landing.feat.tablesDesc', { defaultValue: 'Organiza mesas visualmente con drag & drop y asignación automática' }) },
    { icon: '💰', title: t('landing.feat.budget', { defaultValue: 'Control de presupuesto' }), desc: t('landing.feat.budgetDesc', { defaultValue: 'Partidas, pagos, proveedores y gráficos en tiempo real' }) },
    { icon: '✉️', title: t('landing.feat.invitations', { defaultValue: 'Invitaciones digitales' }), desc: t('landing.feat.invitationsDesc', { defaultValue: 'Diseña, personaliza y envía por email o WhatsApp' }) },
    { icon: '🎯', title: t('landing.feat.ai', { defaultValue: 'Asistente IA' }), desc: t('landing.feat.aiDesc', { defaultValue: 'Copilot integrado que te ayuda a planificar cada detalle' }) },
    { icon: '🎁', title: t('landing.feat.gifts', { defaultValue: 'Lista de regalos' }), desc: t('landing.feat.giftsDesc', { defaultValue: 'Comparte tu lista con invitados y lleva el control' }) },
  ];

  return (
    <div className="paper flex flex-col items-center w-full bg-base min-h-[calc(100vh-144px)] overflow-y-auto">
      {/* Hero */}
      <div className="w-full max-w-3xl px-6 pt-12 pb-8 flex flex-col items-center text-center gap-5">
        <div className="w-40 h-16 flex items-center justify-center">
          {config?.logoDirectory}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-gray-800 tracking-tight">
          {t('landing.title', { defaultValue: 'Organiza tus eventos sin estrés' })}
        </h1>
        <p className="text-gray-500 text-base md:text-lg max-w-lg leading-relaxed">
          {t('landing.subtitle', { defaultValue: 'Todo lo que necesitas para planificar tu celebración perfecta, en un solo lugar.' })}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href={registerHref}
            className="px-8 py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition text-center"
          >
            {t('landing.cta.register', { defaultValue: 'Empezar gratis' })}
          </Link>
          <Link
            href={pathLogin}
            className="px-8 py-3 rounded-full border border-primary text-primary font-medium text-sm hover:bg-primary hover:text-white transition text-center"
          >
            {t('landing.cta.login', { defaultValue: 'Ya tengo cuenta' })}
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="w-full max-w-4xl px-6 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="font-display font-semibold text-gray-800 text-sm">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
