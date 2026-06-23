import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { BsCalendarHeartFill } from "react-icons/bs";
import { IoIosArrowDown } from "react-icons/io";
import ClickAwayListener from "react-click-away-listener";
import ChatToggleButton from "../ChatSidebar/ChatToggleButton";

type NavItem = {
  title: string;
  route: string;
  condicion?: string;
  Icon?: any;
};

/* menu inferior con las opciones de redireccion de la app en vista movil */
const NavigationMobile = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { event } = EventContextProvider() as any;
  const { user, config } = AuthContextProvider() as any;
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider() as any;
  const [show, setShow] = useState(false)
  const [itemSelect, setItemSelect] = useState<string | undefined>()
  const canSeeCopilot =
    config?.copilotEnabled !== false ||
    (Array.isArray(user?.role) ? user.role.includes('admin') : user?.role === 'admin');

  const isActiveRoute = (currentPath: string, itemRoute: string) => {
    if (!currentPath || !itemRoute) return false
    if (itemRoute === '/') return currentPath === '/'
    return currentPath === itemRoute || currentPath.startsWith(`${itemRoute}/`)
  }

  const goNav = (item: NavItem) => {
    if (item.condicion === "verdadero") {
      setItemSelect(item.title)
      router.push(item.route)
      return
    }
    if (!eventsGroupDone) {
      toast("warning", t("waitEventsListToast"))
      router.push("/")
      return
    }
    const hasEvents = Array.isArray(eventsGroup) && eventsGroup.length > 0
    // BUG-CW-N20 (informe QA 23-jun 5ª ronda): el usuario tocaba "Invitaciones"
    // sin evento seleccionado y el handler hacía router.push("/") + toast.
    // Si ya estaba en "/", router.push("/") no hace nada visible y el toast
    // se podía perder. Mejora: forzar scroll al top + flag query param para
    // que el home muestre banner persistente "Elige un evento primero".
    toast("error", t(hasEvents ? "selectEventFromHomeToast" : "youmustcreateevent"))
    if (typeof window !== "undefined") {
      // Si ya estamos en home, scroll arriba para que vea los eventos.
      if (window.location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        router.push("/?needsEvent=1")
      }
    } else {
      router.push("/")
    }
  }

  const Navbar = [
    {
      title: "Mis eventos",
      icon: <MisEventosIcon className="w-7 h-7" />,
      route: "/",
      condicion: "verdadero"
    },
    {
      title: "Resumen",
      icon: <ResumenIcon />,
      route: "/resumen-evento",
      condicion: event?._id ? "verdadero" : "falso",
    },
    {
      title: "Invitados",
      icon: <InvitadosIcon className="w-7 h-7" />,
      route: event?._id ? "/invitados" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Itinerario",
      icon: <BsCalendarHeartFill className="w-7 h-7" />,
      route: "/itinerario",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Invitaciones",
      icon: <InvitacionesIcon className="w-7 h-7" />,
      route: event?._id ? "/invitaciones" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Presupuesto",
      icon: <PresupuestoIcon className="w-7 h-7" />,
      route: event?._id ? "/presupuesto" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Mesas",
      icon: <MesasIcon className="w-7 h-7" />,
      route: event?._id ? "/mesas" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Lista de regalos",
      icon: <ListaRegalosIcon />,
      route: "/lista-regalos",
      condicion: event?._id ? "verdadero" : "falso"
    },
  ]

  const isGuest = user?.displayName === 'guest';
  const visibleNavbar = isGuest ? Navbar.filter(item => item.title !== 'Itinerario') : Navbar;

  return (
    <div className="w-full flex justify-center relative">
      {canSeeCopilot && (
        <div className="fixed bottom-[92px] right-4 z-[80] md:hidden">
          <ChatToggleButton className="shadow-lg" />
        </div>
      )}
      <ClickAwayListener onClickAway={() => setShow(false)}>
        <ul onClick={() => { show && setShow(false) }} className={`flex flex-col md:hidden bg-white z-50 rounded-t-2xl Shadow w-full fixed bottom-0 transition duration-300 ease-in-out ${!show && "translate-y-[54px]"}`}>
          <div className="w-full grid grid-cols-6 py-5 place-items-center">
            <div onClick={() => setShow(!show)} className="w-9 h-9 flex items-center justify-center absolute z-[90] top-0 -translate-y-1/2 rounded-full bg-white Shadow2 text-gray-600 text-primary" >
              <IoIosArrowDown className={`w-6 h-6 transition duration-500 ease-in-out ${!show ? "scale-y-[-1]" : "scale-y-[1]"}`} />
            </div>
            {visibleNavbar.slice(0, 6).map((item, idx) => (
              <li
                key={idx}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    goNav(item)
                  }
                }}
                onClick={() => goNav(item)}
                aria-label={item.title}
                title={item.title}
                className={`cursor-pointer transition hover:scale-[110%] hover:opacity-100 flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[44px] px-1 ${isActiveRoute(pathname, item.route) && itemSelect === item.title ? "text-primary opacity-100" : "text-gray-800 opacity-70"}`}
              >
                {item.icon}
                {/* BUG-CW-N19 (informe QA 23-jun 5ª ronda): tabbar inferior sin
                    labels de texto → usuario mobile desorientado. Añadido label
                    debajo del icono (truncado y pequeño para no romper layout). */}
                <span className="text-[9px] leading-tight font-medium text-center max-w-[60px] truncate">
                  {item.title}
                </span>
              </li>
            ))}
          </div>
          <div className={`w-full grid grid-cols-2 pt-1 pb-5 place-items-center`}>
            {visibleNavbar.slice(6).map((item, idx) => (
              <li
                key={idx}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    goNav(item)
                  }
                }}
                onClick={() => goNav(item)}
                aria-label={item.title}
                title={item.title}
                className={`cursor-pointer transition hover:scale-[110%] hover:opacity-100 flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[44px] px-1 ${isActiveRoute(pathname, item.route) && itemSelect === item.title ? "text-primary opacity-100" : "text-gray-800 opacity-70"}`}
              >
                {item.icon}
                {/* BUG-CW-N19 (informe QA 23-jun 5ª ronda): tabbar inferior sin
                    labels de texto → usuario mobile desorientado. Añadido label
                    debajo del icono (truncado y pequeño para no romper layout). */}
                <span className="text-[9px] leading-tight font-medium text-center max-w-[60px] truncate">
                  {item.title}
                </span>
              </li>
            ))}
          </div>
        </ul >
      </ClickAwayListener>
      <style>{`
      .Shadow {
        --tw-shadow: 0 8px 14px 0 rgb(0 0 0 / 1), 0 4px 6px 0 rgb(0 0 0 / 0.1);
        --tw-shadow-colored: 0 8px 14px 0 var(--tw-shadow-color), 0 4px 6px 0 var(--tw-shadow-color);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
      }
      .Shadow2 {
        --tw-shadow: 0 3px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
      }
      `}</style>
    </div >
  );
};

export default NavigationMobile;
