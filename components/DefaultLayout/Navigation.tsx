import { useMemo, useEffect, useState, FC, useRef } from "react";
import { useRouter } from "next/router";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { Banner, IconLightBulb16, InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MenuIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons";
import { useDelayUnmount } from "../../utils/Funciones";
import Profile from "./Profile";
import Sidebar from "../Utils/Sidebar";
import BlockNotification from "./BlockNotification";
import NavbarDirectory from "../Utils/NavbarDirectory";
import Head from "next/head";
import { Tooltip } from "../Utils/Tooltip";
import ClickAwayListener from "react-click-away-listener";
import { useAllowedRouter } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { BsCalendarHeartFill } from "react-icons/bs";


const Navigation: FC = () => {
  const refBanner = useRef(null)
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const { user, config, setIsActiveStateSwiper } = AuthContextProvider();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [route, setRoute] = useState<string>("");
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const url = router.pathname
  const [isAllowedRouter, ht] = useAllowedRouter()
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setRoute(router.pathname)
  }, [router])

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

  const urls = ["/info-app", "/confirmar-asistencia"]

  useEffect(() => {
    const handleResize = () => {
      if (refBanner.current) {
        setWidth(refBanner.current.offsetWidth);
        setHeight(refBanner.current.offsetHeight);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [refBanner]);


  return (
    <>
      <Head>
        <link id="favicon" rel="icon" href="https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://champagne-events.com.mx/en/destination-weddings&size=16" />
        <title>{config?.headTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="¡Bodas de Hoy Organizador! Organiza tu boda en un sólo click., user-scalable=no, width=device-width, initial-scale=1" />
      </Head>
      {shouldRenderChild && (
        <BlockNotification
          evento={event}
          state={isMounted}
          set={(accion) => setIsMounted(accion)}
        />
      )}
      <header className="f-top relative w-full bg-white">
        {/* primer menu superior con logo, redirecion al directiorio y opciones de perfil para la vista desktop  */}
        <div className="max-w-screen-lg h-16 px-5 lg:px-0 w-full flex justify-between items-center mx-auto inset-x-0 ">
          {/* <ClickAwayListener onClickAway={() => {
            setTimeout(() => {
              setShowSidebar(false)
            }, 50);
          }}>
            <div >
              <MenuIcon
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-primary w-8 h-8 md:hidden cursor-pointer"
              />
              <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            </div>
          </ClickAwayListener> */}
          <span
            onClick={() => {
              //Loading(setLoading);
              router.push(config?.pathDirectory ? `${config?.pathDirectory}` : ``)
              setIsActiveStateSwiper(0)
            }}
            className="cursor-pointer w-[28vw] md:w-52 items-center flex justify-center translate-x-[-14px] md:translate-x-[-160px]">
            {config?.logoDirectory}
          </span>
          <NavbarDirectory />
          <div className="*">
            <Profile
              state={isMounted}
              set={(act) => setIsMounted(act)}
              user={user}
            />
          </div>
        </div>

        {/* segundo menu superior con las redirecciones funcionales de la app */}
        <div className={`${urls.includes(url) ? "hidden" : "block"}`}>
          <div className={`w-full h-20 hidden md:flex bg-base justify-center items-start`}>
            <Tooltip label={t("Primero debes crear un evento")} icon={<IconLightBulb16 className="w-6 h-6" />} disabled={!!event?._id}>
              <div style={{ width, height }} className="absolute *z-50 px-16 flex justify-center">
                <div className="flex w-full h-full justify-center items-center">
                  <ul className="flex w-full h-max justify-between">
                    {Navbar.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          if (item.condicion) {
                            console.log(item.route)
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
                        <p className="font-display text-sm h-max"  >{t(item.title)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Tooltip>
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
