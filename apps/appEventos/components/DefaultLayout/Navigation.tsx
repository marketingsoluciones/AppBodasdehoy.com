import { useMemo, useEffect, useState, FC, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContextProvider, EventContextProvider, ChatSidebarContextProvider } from "../../context";
import { Banner, IconLightBulb16, InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons";
import { useDelayUnmount } from "../../utils/Funciones";
import Profile from "./Profile";
import BlockNotification from "./BlockNotification";
import NavbarDirectory from "../Utils/NavbarDirectory";
import { Tooltip } from "../Utils/Tooltip";
import { useAllowedRouter } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { BsCalendarHeartFill } from "react-icons/bs";
import ChatToggleButton from "../ChatSidebar/ChatToggleButton";

const Navigation: FC = () => {
  const refBanner = useRef(null)
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const { user, config, setIsActiveStateSwiper } = AuthContextProvider();
  const router = useRouter();
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [route, setRoute] = useState<string>("");
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const url = pathname
  const [isAllowedRouter, ht] = useAllowedRouter()
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setRoute(pathname)
  }, [pathname])

  const Navbar = useMemo(() => [
    {
      title: "Mis eventos",
      icon: <MisEventosIcon />,
      route: "/",
      condicion: event?._id ? true : false
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
      condicion: event?._id ? true : false
    },
  ], [event]);

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


  return (
    <>
      {shouldRenderChild && (
        <BlockNotification
          evento={event}
          state={isMounted}
          set={(accion) => setIsMounted(accion)}
        />
      )}
      <header className="f-top relative w-full bg-white ">
        <div className="max-w-screen-lg h-16 px-5 lg:px-0 w-full flex justify-between items-center mx-auto inset-x-0  ">
          <span
            onClick={() => {
              const path = config?.pathDomain ? `${config?.pathDomain}` : '/';
              // Verificar si es una URL externa (comienza con http:// o https://)
              if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
                window.open(path, '_blank');
              } else if (path) {
                router.push(path);
              }
              setIsActiveStateSwiper(0)
            }}
            className="cursor-pointer items-center flex justify-center w-[130px] md:w-[208px] h-[60px] md:h-[64px] translate-x-[-14px] md:translate-x-[-160px]">
            {config?.logoDirectory}
          </span>
          <NavbarDirectory />
          <div className="flex items-center gap-3">
            {/* Boton Copilot Chat */}
            {ChatSidebarContextProvider() && <ChatToggleButton />}
            <Profile
              state={isMounted}
              set={(act) => setIsMounted(act)}
              user={user}
            />
          </div>
        </div>

        {/* segundo menu superior con las redirecciones funcionales de la app */}
        <div className={`${(!user || urls.includes(url)) ? "hidden" : "block"}`}>
          <div className={`w-full h-20 hidden md:flex bg-base justify-center items-start`}>
              <div style={{ width, height }} className={`absolute top-16 z-50 px-16 flex justify-center transition-opacity duration-200 ${width > 0 ? 'opacity-100' : 'opacity-0'}`}>
                <Tooltip label={t("Primero debes crear un evento")} icon={<IconLightBulb16 className="w-6 h-6" />} disabled={!!event?._id} className="w-full h-full">
                <div className="flex w-full h-full justify-center items-center">
                  <ul className="flex w-full h-max justify-between">
                    {Navbar.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          if (item.condicion) {
                            !isAllowedRouter(item.route) ? ht() : [router.push(item.route), setRoute(item.route)]
                          }
                        }}
                        className={`w-max flex flex-col justify-between items-center hover:opacity-80  transition cursor-pointer
                  ${route == item.route
                            ? route == "/"
                              ? "text-white transform scale-110"
                              : "text-primary transform scale-110"
                            : route == "/"
                              ? "text-gray-200"
                              : "text-gray-400"
                          }
                    ${event?._id ? "" : ""}
                  }`}
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
                className={`${route == "/" ? "text-primary" : "text-white"} transition`}
              />
            </div>
          </div >
        </div>
      </header >
    </>
  );
};

export default Navigation;
