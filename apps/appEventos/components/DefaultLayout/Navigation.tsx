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
  const studioHeader = !!studioParam && studioParam !== "legacy";
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
            <span onClick={handleLogoClick} className="cursor-pointer flex items-center h-[60px] shrink-0 overflow-visible" style={{ maxWidth: 208 }}>
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
        </div>
      </header >
    </>
  );
};

export default Navigation;
