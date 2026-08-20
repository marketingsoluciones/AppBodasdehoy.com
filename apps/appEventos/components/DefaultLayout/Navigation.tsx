import { useMemo, useEffect, useState, FC, useRef, cloneElement, isValidElement } from "react";
import type { ImgHTMLAttributes, ReactElement } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { Banner, IconLightBulb16, InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useDelayUnmount } from "../../utils/Funciones";
import Profile from "./Profile";
import BlockNotification from "./BlockNotification";
import NavbarDirectory from "../Utils/NavbarDirectory";
import { Tooltip } from "../Utils/Tooltip";
import { useAllowedRouter } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { BsCalendarHeartFill, BsImages } from "react-icons/bs";
import ChatToggleButton from "../ChatSidebar/ChatToggleButton";
import { useChatSidebar, CHAT_SIDEBAR_MIN_WIDTH, CHAT_SIDEBAR_MAX_WIDTH, CHAT_SIDEBAR_DEFAULT_WIDTH } from "../../context/ChatSidebarContext";

// Barra de módulos rediseñada (studio) — iconos EXACTOS del HTML "menumodulos".
// fill=currentColor (color del item); los "huecos" (.mhole) se pintan con --hole (color del fondo).
const STUDIO_ORDER = ["Mis eventos", "Resumen", "Invitados", "Mesas", "Presupuesto", "Invitaciones", "Itinerario", "Lista de regalos", "Momentos"];
const STUDIO_ICONS: Record<string, ReactElement> = {
  "Mis eventos": (<svg viewBox="0 0 24 24"><path d="M9 2C6.2 2 4 4.4 4 7.4c0 2.9 2 5.3 4.4 5.6l-.6 1.5h2.4L9.6 13C12 12.7 14 10.3 14 7.4 14 4.4 11.8 2 9 2z" /><path opacity={0.55} d="M16.5 5c-1.9 0-3.5 1.7-3.5 3.9 0 2 1.3 3.7 3 4l-.4 1.1h1.8L17 12.9c1.7-.3 3-2 3-4C20 6.7 18.4 5 16.5 5z" /></svg>),
  "Resumen": (<svg viewBox="0 0 24 24"><path d="M5.5 3A2.5 2.5 0 0 0 3 5.5v4A2.5 2.5 0 0 0 5.5 12h4A2.5 2.5 0 0 0 12 9.5v-4A2.5 2.5 0 0 0 9.5 3h-4z" /><path opacity={0.55} d="M15.5 3A2.5 2.5 0 0 0 13 5.5v2A2.5 2.5 0 0 0 15.5 10h3A2.5 2.5 0 0 0 21 7.5v-2A2.5 2.5 0 0 0 18.5 3h-3z" /><path d="M15.5 11A2.5 2.5 0 0 0 13 13.5v5a2.5 2.5 0 0 0 2.5 2.5h3a2.5 2.5 0 0 0 2.5-2.5v-5a2.5 2.5 0 0 0-2.5-2.5h-3z" /><path opacity={0.55} d="M5.5 13A2.5 2.5 0 0 0 3 15.5v3A2.5 2.5 0 0 0 5.5 21h4a2.5 2.5 0 0 0 2.5-2.5v-3A2.5 2.5 0 0 0 9.5 13h-4z" /></svg>),
  "Invitados": (<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.6" /><path d="M3 19.2c0-3.3 2.7-5.7 6-5.7s6 2.4 6 5.7c0 .4-.3.8-.8.8H3.8a.8.8 0 0 1-.8-.8z" /><circle opacity={0.55} cx="16.8" cy="9" r="2.8" /><path opacity={0.55} d="M16.4 13.4c2.7.2 4.6 2.3 4.6 5 0 .3-.3.6-.6.6h-3.2c.2-.5.3-1 .3-1.6 0-1.5-.5-2.9-1.1-4z" /></svg>),
  "Mesas": (<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" /><circle opacity={0.55} cx="12" cy="4.5" r="1.7" /><circle opacity={0.55} cx="12" cy="19.5" r="1.7" /><circle opacity={0.55} cx="4.5" cy="12" r="1.7" /><circle opacity={0.55} cx="19.5" cy="12" r="1.7" /><circle opacity={0.55} cx="6.7" cy="6.7" r="1.5" /><circle opacity={0.55} cx="17.3" cy="6.7" r="1.5" /><circle opacity={0.55} cx="6.7" cy="17.3" r="1.5" /><circle opacity={0.55} cx="17.3" cy="17.3" r="1.5" /></svg>),
  "Presupuesto": (<svg viewBox="0 0 24 24"><path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 2h-11zM7 5.5h10a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM7.5 12a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm-9 4.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z" /></svg>),
  "Invitaciones": (<svg viewBox="0 0 24 24"><path d="M3 8.8l8.4-5.2a1.2 1.2 0 0 1 1.2 0L21 8.8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.8z" /><path className="mhole" opacity={0.9} d="M12 15.6l-8.7-5.4v-.2L12 15l8.7-5v.2L12 15.6z" /><path className="mhole" d="M12 13.4c-.9-1-2.4-1.6-2.4-3 0-1 .7-1.7 1.5-1.7.4 0 .7.2.9.5.2-.3.5-.5.9-.5.8 0 1.5.7 1.5 1.7 0 1.4-1.5 2-2.4 3z" /></svg>),
  "Itinerario": (<svg viewBox="0 0 24 24"><path d="M7 2.5a1 1 0 0 1 1 1V5h8V3.5a1 1 0 1 1 2 0V5h.5A2.5 2.5 0 0 1 21 7.5v11A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5H6V3.5a1 1 0 0 1 1-1z" /><path className="mhole" d="M12 17.2c-1.4-1.4-3.6-2.4-3.6-4.4 0-1.4 1-2.4 2.2-2.4.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8 1.2 0 2.2 1 2.2 2.4 0 2-2.2 3-3.6 4.4z" /></svg>),
  "Lista de regalos": (<svg viewBox="0 0 24 24"><path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V8z" /><path d="M5 12.5h6V21H6.5A1.5 1.5 0 0 1 5 19.5v-7zM13 12.5h6v7a1.5 1.5 0 0 1-1.5 1.5H13v-8.5z" /><path opacity={0.55} d="M12 6.5c-1.2-2.2-3-3.6-4.6-2.7C6 4.6 6.3 6.5 8 6.5h4zm0 0c1.2-2.2 3-3.6 4.6-2.7 1.4.8 1.1 2.7-.6 2.7H12z" /></svg>),
  "Momentos": (<svg viewBox="0 0 24 24"><path d="M7 6.5A2.5 2.5 0 0 1 9.5 4h9A2.5 2.5 0 0 1 21 6.5v7A2.5 2.5 0 0 1 18.5 16h-9A2.5 2.5 0 0 1 7 13.5v-7z" /><path opacity={0.55} d="M4.5 7.5c-.8.3-1.5 1.2-1.5 2.2V18a3 3 0 0 0 3 3h8.3c1 0 1.9-.6 2.2-1.5H6.5a2 2 0 0 1-2-2V7.5z" /><circle className="mhole" cx="11" cy="8" r="1.3" /><path className="mhole" d="M8.5 14.5l2.6-3 1.9 2 1.6-1.6 3.4 2.6H8.5z" /></svg>),
};

const Navigation: FC = () => {
  const refBanner = useRef(null)
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider();
  const { user, config, setIsActiveStateSwiper } = AuthContextProvider();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const url = pathname
  const [isAllowedRouter, ht] = useAllowedRouter()
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const chatSidebar = useChatSidebar();
  // Copilot abierto en desktop empuja el contenido. El header está fuera del grid; aplicamos
  // padding-left dinámico = copilotSlotWidth para que el header acompañe visualmente al contenido.
  const copilotDesiredWidth = Math.max(
    CHAT_SIDEBAR_MIN_WIDTH,
    Math.min(CHAT_SIDEBAR_MAX_WIDTH, chatSidebar?.width ?? CHAT_SIDEBAR_DEFAULT_WIDTH),
  );
  const canDockCopilot =
    isDesktop &&
    !!chatSidebar?.isOpen &&
    viewportWidth > 0 &&
    viewportWidth - 900 >= CHAT_SIDEBAR_MIN_WIDTH;
  const copilotDockWidth = canDockCopilot
    ? Math.max(CHAT_SIDEBAR_MIN_WIDTH, Math.min(copilotDesiredWidth, viewportWidth - 900))
    : 0;
  const copilotPushPx = canDockCopilot && copilotDockWidth > 0 ? copilotDockWidth + 4 : 0;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => setViewportWidth(window.innerWidth);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  const canSeeCopilot =
    config?.copilotEnabled !== false ||
    (Array.isArray(user?.role) ? user.role.includes('admin') : user?.role === 'admin');
  const safeLogoNode = useMemo(() => {
    if (logoError) return null
    const node = config?.logoDirectory
    if (!node) return null
    if (isValidElement(node) && typeof node.type === 'string' && node.type === 'img') {
      const imgNode = node as ReactElement<ImgHTMLAttributes<HTMLImageElement>>
      const prevOnError = imgNode.props?.onError
      return cloneElement(imgNode, {
        onError: (e: any) => {
          setLogoError(true)
          if (typeof prevOnError === 'function') prevOnError(e)
        },
      })
    }
    return node
  }, [config?.logoDirectory, logoError])

  const isActiveRoute = (currentPath: string, itemRoute: string) => {
    if (!currentPath || !itemRoute) return false
    if (itemRoute === '/') return currentPath === '/'
    return currentPath === itemRoute || currentPath.startsWith(`${itemRoute}/`)
  }

  const navTone = pathname === '/' ? 'onPrimary' : 'onLight'

  const Navbar = useMemo(() => [
    {
      title: "Mis eventos",
      icon: <MisEventosIcon />,
      route: "/",
      condicion: true,
    },
    {
      title: "Resumen",
      icon: <ResumenIcon />,
      route: "/resumen-evento",
      condicion: event?._id ? true : false
    },
    {
      title: "Invitados",
      icon: <InvitadosIcon />,
      route: "/invitados",
      condicion: event?._id ? true : false
    },
    {
      title: "Mesas",
      icon: <MesasIcon />,
      route: "/mesas",
      condicion: event?._id ? true : false
    },
    {
      title: "Lista de regalos",
      icon: <ListaRegalosIcon />,
      route: "/lista-regalos",
      condicion: event?._id ? true : false
    },
    {
      title: "Presupuesto",
      icon: <PresupuestoIcon />,
      route: "/presupuesto",
      condicion: event?._id ? true : false
    },
    {
      title: "Invitaciones",
      icon: <InvitacionesIcon />,
      route: "/invitaciones",
      condicion: event?._id ? true : false
    },
    {
      title: "Itinerario",
      icon: <BsCalendarHeartFill className="w-7 h-7" />,
      route: "/itinerario",
      condicion: event?._id ? true : false,
      hideForGuest: true,
    },
    {
      title: "Momentos",
      icon: <BsImages className="w-7 h-7" />,
      route: "/momentos",
      condicion: event?._id ? true : false
    },
  ], [event]);

  const hasEventsForNav =
    eventsGroupDone && Array.isArray(eventsGroup) && eventsGroup.length > 0;

  /** Tooltip / toasts: sin confundir "lista aún cargando" con "no tienes ningún evento". */
  const navNoEventHint = !event?._id
    ? !eventsGroupDone
      ? t("waitEventsListToast")
      : hasEventsForNav
        ? t("selectEventFromHomeToast")
        : t("Primero debes crear un evento")
    : "";

  const urls = ["/info-app", "/confirmar-asistencia", "/services/[...slug]", "/login", "/registro"]

  useEffect(() => {
    if (!refBanner.current) return;
    // ResizeObserver: reacciona inmediatamente cuando el Banner tiene tamaño,
    // sin esperar a un evento de resize de ventana (soluciona el flash con iconos apilados)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
        setHeight(entry.contentRect.height);
      }
    });
    ro.observe(refBanner.current);
    return () => ro.disconnect();
  }, []);


  // Flag global del rediseño de header (Mis eventos.dc.html): header nuevo solo con ?studio,
  // el actual por defecto. ?studio=legacy mantiene el clásico (coherente con los módulos).
  const studioParam = searchParams?.get("studio");
  // Encabezado rediseñado = vista POR DEFECTO en todas las pantallas (aprobado por owner).
  // Rollback a la barra clásica con ?studio=legacy.
  const studioHeader = studioParam !== "legacy";
  const handleLogoClick = () => {
    const path = config?.pathDomain || '/';
    const isExternal = path.startsWith('http://') || path.startsWith('https://');
    if (isExternal) {
      try {
        const parsed = new URL(path);
        if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
          router.push(parsed.pathname + parsed.search + parsed.hash || '/');
        } else { router.push('/'); }
      } catch { router.push('/'); }
    } else { router.push(path); }
    setIsActiveStateSwiper(0);
  };

  return (
    <>
      {shouldRenderChild && user?.displayName !== 'guest' && (
        <BlockNotification
          evento={event}
          state={isMounted}
          set={(accion) => setIsMounted(accion)}
        />
      )}
      <header
        className="f-top relative w-full bg-white"
        style={{ paddingLeft: copilotPushPx, transition: 'padding-left 0.2s ease' }}
      >
        {studioHeader ? (
          <div style={{ maxWidth: 1100, margin: "0 auto", height: 78, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
            {/* En móvil el logo se muestra un poco más pequeño (altura 60→44px + imagen escalada). */}
            <style dangerouslySetInnerHTML={{ __html: "@media (max-width:767px){.nav-logo{height:44px!important;}.nav-logo img,.nav-logo svg{height:100%!important;width:auto!important;max-width:100%!important;object-fit:contain!important;}}" }} />
            <span onClick={handleLogoClick} className="nav-logo cursor-pointer flex items-center h-[60px] shrink-0 overflow-visible" style={{ maxWidth: 208 }}>
              {safeLogoNode ?? (<span className="px-3 py-1 rounded-lg bg-primary text-white font-title text-sm max-w-full truncate">{(typeof config?.headTitle === 'string' && config.headTitle.trim()) ? config.headTitle : (typeof config?.name === 'string' && config.name.trim()) ? config.name : 'App'}</span>)}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {canSeeCopilot && <ChatToggleButton studio />}
              <Profile studio state={isMounted} set={(act) => setIsMounted(act)} user={user} />
            </div>
          </div>
        ) : (
        <div className="max-w-screen-lg h-16 px-5 lg:px-0 w-full flex justify-between items-center mx-auto inset-x-0  ">
          <span
            onClick={() => {
              // BUG-CW-N22 (informe QA 6ª ronda): en whitelabel bodasdehoy,
              // config.pathDomain = "https://www.bodasdehoy.com" → al clickear
              // el logo se abría producción en nueva pestaña, sacando al usuario
              // de app-dev/app-test. La navegación interna SIEMPRE debe quedarse
              // en la app actual. Si pathDomain apunta al MISMO origin que el
              // actual, se permite (router.push); si es otro origin (producción
              // u otro tenant), router.push("/") al home de la app.
              const path = config?.pathDomain || '/';
              const isExternal = path.startsWith('http://') || path.startsWith('https://');
              if (isExternal) {
                try {
                  const parsed = new URL(path);
                  if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
                    router.push(parsed.pathname + parsed.search + parsed.hash || '/');
                  } else {
                    router.push('/');
                  }
                } catch {
                  router.push('/');
                }
              } else {
                router.push(path);
              }
              setIsActiveStateSwiper(0)
            }}
            className="cursor-pointer items-center flex justify-center w-[130px] md:w-[208px] h-[60px] md:h-[64px] pl-1 md:pl-2 shrink-0 overflow-visible">
            {safeLogoNode ?? (
              <span className="px-3 py-1 rounded-lg bg-primary text-white font-title text-sm max-w-full truncate">
                {(typeof config?.headTitle === 'string' && config.headTitle.trim())
                  ? config.headTitle
                  : (typeof config?.development === 'string' && config.development.trim())
                    ? config.development
                    : (typeof config?.name === 'string' && config.name.trim())
                      ? config.name
                      : 'App'}
              </span>
            )}
          </span>
          {/* <NavbarDirectory /> */}
          <div className="flex items-center gap-3">
            {canSeeCopilot && <ChatToggleButton />}
            <Profile
              state={isMounted}
              set={(act) => setIsMounted(act)}
              user={user}
            />
          </div>
        </div>
        )}

        {/* segundo menu superior con las redirecciones funcionales de la app */}
        <div className={`${(urls.includes(url)) ? "hidden" : "block"}`}>
          {studioHeader ? (
            <div className="hidden md:block bg-base">
              <style dangerouslySetInnerHTML={{ __html: ".mbar-item svg{width:32px;height:32px;fill:currentColor}.mbar-item .mhole{fill:var(--hole)}" }} />
              <div className="max-w-[1100px] mx-auto px-6">
                <nav
                  className="flex items-center justify-center gap-2 rounded-b-[22px] px-[26px] transition-colors"
                  style={{
                    height: 74,
                    background: pathname === '/' ? 'linear-gradient(180deg,#F473A4,#EF5B94 55%,#E94F89)' : '#fff',
                    boxShadow: pathname === '/' ? '0 14px 30px rgba(239,91,148,.35)' : '0 14px 30px rgba(0,0,0,.08)',
                    ['--hole' as any]: pathname === '/' ? '#EF5B94' : '#fff',
                  }}
                >
                  {Navbar
                    .filter(item => !(item.hideForGuest && user?.displayName === 'guest'))
                    .slice()
                    .sort((a, b) => STUDIO_ORDER.indexOf(a.title) - STUDIO_ORDER.indexOf(b.title))
                    .map((item, idx) => {
                      const active = isActiveRoute(pathname, item.route);
                      const pink = pathname === '/';
                      const color = pink ? (active ? '#fff' : 'rgba(255,255,255,.75)') : (active ? '#EF5B94' : '#6b6b72');
                      return (
                        <button
                          key={idx}
                          type="button"
                          title={!item.condicion ? navNoEventHint : undefined}
                          onClick={() => {
                            if (item.condicion) {
                              if (!isAllowedRouter(item.route)) { ht() } else { router.push(item.route) }
                            } else {
                              if (!eventsGroupDone) {
                                toast("warning", t("waitEventsListToast"))
                              } else {
                                const hasEvents = Array.isArray(eventsGroup) && eventsGroup.length > 0
                                toast("error", t(hasEvents ? "selectEventFromHomeToast" : "youmustcreateevent"))
                              }
                              router.push("/")
                            }
                          }}
                          className="mbar-item flex flex-col items-center gap-[5px] flex-1 min-w-0 py-[3px] cursor-pointer transition-transform hover:-translate-y-0.5"
                          style={{ color, background: 'none', border: 'none', fontFamily: 'inherit' }}
                        >
                          {STUDIO_ICONS[item.title] ?? item.icon}
                          <span style={{ font: `${active ? 600 : 500} 12px Poppins`, whiteSpace: 'nowrap' }}>{t(item.title)}</span>
                          <i style={{ display: 'block', width: 26, height: 3, borderRadius: 3, background: active ? (pink ? '#fff' : '#EF5B94') : 'transparent' }} />
                        </button>
                      );
                    })}
                </nav>
              </div>
            </div>
          ) : (
          <div className={`w-full h-20 hidden md:flex bg-base justify-center items-start`}>
            <div style={{ width, height }} className={`absolute top-16 z-10 px-16 flex justify-center transition-opacity duration-200 ${width > 0 ? 'opacity-100' : 'opacity-0'}`}>
              <Tooltip
                label={navNoEventHint}
                icon={<IconLightBulb16 className="w-6 h-6" />}
                disabled={!!event?._id}
                className="w-full h-full"
              >
                <div className="flex w-full h-full justify-center items-center">
                  <ul className="flex w-full h-max justify-between">
                    {Navbar.filter(item => !(item.hideForGuest && user?.displayName === 'guest')).map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          if (item.condicion) {
                            if (!isAllowedRouter(item.route)) {
                              ht()
                            } else {
                              router.push(item.route)
                            }
                          } else {
                            if (!eventsGroupDone) {
                              toast("warning", t("waitEventsListToast"))
                            } else {
                              const hasEvents = Array.isArray(eventsGroup) && eventsGroup.length > 0
                              toast(
                                "error",
                                t(hasEvents ? "selectEventFromHomeToast" : "youmustcreateevent")
                              )
                            }
                            router.push("/")
                          }
                        }}
                        className={`w-max flex flex-col justify-between items-center transition cursor-pointer hover:opacity-100 hover:scale-110 rounded-xl px-2 py-1
                  ${navTone === 'onPrimary'
                            ? (isActiveRoute(pathname, item.route)
                              ? "text-white bg-white/20 opacity-100 scale-110"
                              : "text-white opacity-80 hover:bg-white/10")
                            : (isActiveRoute(pathname, item.route)
                              ? "text-primary opacity-100 scale-110"
                              : "text-gray-800 opacity-70")
                          }
                  ${isActiveRoute(pathname, item.route) ? "after:content-[''] after:block after:mt-1 after:h-[2px] after:w-6 after:rounded-full after:bg-current" : ""}`}
                      >
                        {item.icon}
                        <p className="font-display text-[10px] text-center leading-tight h-max whitespace-nowrap">{t(item.title)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Tooltip>
            </div>
            <div ref={refBanner} className="flex max-w-[1020px] flex-1 items-start">
              <Banner
                className={`${pathname === "/" ? "text-primary" : "text-white"} transition`}
              />
            </div>
          </div >
          )}
        </div>
      </header >
    </>
  );
};

export default Navigation;
