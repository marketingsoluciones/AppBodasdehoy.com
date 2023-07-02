import Link from "next/link";
import { FC, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContextProvider, EventContextProvider, LoadingContextProvider } from "../../context";
import { Banner, IconLightBulb16, InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, LogoNuevoBodasBlanco, MenuIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons";
import { Loading, useDelayUnmount } from "../../utils/Funciones";
import Profile from "./Profile";
import Sidebar from "../Utils/Sidebar";
import BlockNotification from "./BlockNotification";
import { useToast } from "../../hooks/useToast";
import Navbar2 from "../Utils/Navbar";
import Head from "next/head";
import { Tooltip } from "../Utils/Tooltip";

const Navigation: any = (
  notificaciones: any,
  set: any,
  state: any,
  active: any,
): any => {
  const toast = useToast();
  const { event } = EventContextProvider();
  const { setLoading } = LoadingContextProvider();
  const { user, isProduction, domain, config, setIsActiveStateSwiper } = AuthContextProvider();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [route, setRoute] = useState<string>("");
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
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
  ], [event]);

  /* const handleClick = ( event) => {
    if (!event?._id) {
      toast("warning", "Debes seleccionar un evento")
    }else if( !event?._id ) {
      toast("error","Debes crear un evento")
     alert("debes crear un evento")
    }
    return
  } */

  return (
    <>
      <Head>
        <link id="favicon" rel="icon" href="https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco,dpr_1/v1486383751/crmgiiartcuts208eqly.png" />
        <title>{config?.headTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="¡Bodas de Hoy Organizador! Organiza tu boda en un sólo click., user-scalable=no, width=device-width, initial-scale=1" />
      </Head>
      {!isProduction &&
        <div>
          <div>
            <ul className='absolute z-50 text-sm font-display ml-4'>
              <li>url: {window.location.hostname}</li>
              <li>domain: {domain}</li>
              <li>event?.nombre: {event?.nombre}</li>
            </ul>
          </div>
        </div>
      }
      {shouldRenderChild && (
        <BlockNotification
          evento={event}
          state={isMounted}
          set={(accion) => setIsMounted(accion)}
        />
      )}
      <Sidebar state={showSidebar} set={(accion) => setShowSidebar(accion)} />
      <header className="f-top relative w-full bg-white">
        {/* primer menu superior con logo, redirecion al directiorio y opciones de perfil para la vista desktop  */}
        <div className="max-w-screen-lg h-16 px-5 lg:px-0 w-full flex justify-between items-center mx-auto inset-x-0 ">
          <MenuIcon
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden cursor-pointer"
          />
          {/* <Link href={process.env.NEXT_PUBLIC_DIRECTORY ?? "/"} passHref> */}
          <span
            onClick={() => {
              //Loading(setLoading);
              router.push("/")
              setIsActiveStateSwiper(0)
            }}
            className="bg-red* cursor-pointer w-40 items-center flex justify-center"
          >
            {config?.logoDirectory}
          </span>
          {/* </Link> */}
          {/* <Navbar2 /> */}
          <div className="bg-red*">
            <Profile
              state={isMounted}
              set={(act) => setIsMounted(act)}
              user={user}
            />
          </div>
        </div>

        {/* segundo menu superior con las redirecciones funcionales de la app */}
        <div className={`w-full h-20 relative hidden md:block bg-base z-10`}>
          <Tooltip label="Primero debes crear un evento" icon={<IconLightBulb16 className="w-6 h-6" />} disabled={!!event?._id}>
            <ul className="absolute m-auto left-1/2 -translate-x-1/2 py-4 w-max h-max flex gap-12">
              {Navbar.map((item, idx) => (
                // <Link key={idx} href={item.condicion ? item.route : ""} passHref >
                <li
                  key={idx}
                  onClick={() => {
                    if (item.condicion) {
                      router.push(item.route)
                      setRoute(item.route)
                    }
                  }}
                  className={`w-max flex flex-col justify-between items-center hover:opacity-80  transition  cursor-pointer
                  ${route == item.route ?
                      route == "/"
                        ? "text-white transform scale-110"
                        : "text-primary transform scale-110"
                      : route == "/"
                        ? "text-gray-200"
                        : "text-gray-400"
                    } ${event?._id ? "" : ""}}`}
                >
                  {item.icon}
                  <p className="font-display text-sm h-max"  >{item.title}</p>
                </li>
                // </Link>
              ))}
            </ul>
          </Tooltip>
          <Banner
            className={`${route == "/" ? "text-primary" : "text-white"
              } w-full transition`}
          />
        </div >
      </header >
    </>
  );
};

export default Navigation;
