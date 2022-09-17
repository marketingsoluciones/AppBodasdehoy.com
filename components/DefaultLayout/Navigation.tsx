import Link from "next/link";
import { FC, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  AuthContextProvider,
  EventContextProvider,
  LoadingContextProvider,
} from "../../context";
import {
  Banner,
  InvitacionesIcon,
  InvitadosIcon,
  ListaRegalosIcon,
  LogoNuevoBodasBlanco,
  MenuIcon,
  MesasIcon,
  MisEventosIcon,
  PresupuestoIcon,
} from "../icons";
import { Loading, useDelayUnmount } from "../../utils/Funciones";
import Profile from "./Profile";
import Sidebar from "../Utils/Sidebar";
import BlockNotification from "./BlockNotification";
import { useToast } from "../../hooks/useToast";

const Navigation: any = (
  notificaciones: any,
  set: any,
  state: any,
  active: any,
): any => {
  const toast = useToast();
  const { event } = EventContextProvider();
  const { setLoading } = LoadingContextProvider();
  const { user } = AuthContextProvider();
  const router = useRouter();
  const [pink, setPink] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);

  const Navbar = useMemo(() => [
    {
      title: "Mis eventos",
      icon: <MisEventosIcon />,
      route: "/"
    },
    {
      title: "Invitados",
      icon: <InvitadosIcon />,
      route: event?._id ? "/invitados" : "/",
    },
    {
      title: "Mesas",
      icon: <MesasIcon />, route:
        event?._id ? "/mesas" : "/"
    },
    {
      title: "Lista",
      icon: <ListaRegalosIcon />,
      route: event?._id ? "/lista-regalos" : "/",
    },
    {
      title: "Presupuesto",
      icon: <PresupuestoIcon />,
      route: event?._id ? "/presupuesto" : "/",
    },
    {
      title: "Invitaciones",
      icon: <InvitacionesIcon />,
      route: event?._id ? "/invitaciones" : "/",
    },
  ], [event]);

  useEffect(() => {
    router.pathname == "/" ? setPink(true) : setPink(false);
  }, [router]);

  const handleClick = (idx, event) => {
    if (idx > 0 && !event?._id) {
      toast("warning", "Debes seleccionar un evento")
    }
    return
  }

  return (
    <>
      {shouldRenderChild && (
        <BlockNotification
          evento={event}
          state={isMounted}
          set={(accion) => setIsMounted(accion)}
        />
      )}
      <Sidebar state={showSidebar} set={(accion) => setShowSidebar(accion)} />
      <header className="f-top relative w-full bg-white">
        {/* menu mobile */}
        <div className="max-w-screen-lg h-16 px-5 lg:px-0 w-full flex justify-between items-center mx-auto inset-x-0 ">
          <MenuIcon
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden cursor-pointer"
          />
          <Link href={process.env.NEXT_PUBLIC_DIRECTORY ?? ""} passHref>
            <span
              onClick={() => {
                Loading(setLoading);
              }}
              className="cursor-pointer w-40 items-center flex justify-center"
            >
              <LogoNuevoBodasBlanco className="hover:opacity-80 transition text-primary" />
            </span>
          </Link>
          <Profile
            state={isMounted}
            set={(act) => setIsMounted(act)}
            user={user}
          />
        </div>

        {/* menu desktop */}
        <div className={`w-full h-20 relative hidden md:block bg-base z-10`}>
          <ul className="absolute m-auto inset-0 py-4 w-max h-max flex gap-12">
            {Navbar.map((item, idx) => (
              <Link key={idx} href={item.route} passHref>
                <li
                  onClick={() => handleClick(idx, event)}
                  className={`w-max flex flex-col justify-between items-center hover:opacity-80 cursor-pointer transition ${router.pathname.slice(1) == item.title.toLowerCase()
                    ? "text-primary transform scale-105"
                    : router.pathname == "/"
                      ? "text-white"
                      : "text-gray-400"
                    }`}
                >
                  {item.icon}
                  <p className="font-display text-sm h-max">{item.title}</p>
                </li>
              </Link>
            ))}
          </ul>
          <Banner
            className={`${pink ? "text-primary" : "text-white"
              } w-full transition`}
          />
        </div>
      </header>
    </>
  );
};

export default Navigation;
