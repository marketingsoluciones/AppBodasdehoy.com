import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { BsCalendarHeartFill } from "react-icons/bs";
import { IoIosArrowDown } from "react-icons/io";
import ClickAwayListener from "react-click-away-listener";

/* menu inferior con las opciones de redireccion de la app en vista movil */
const NavigationMobile = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { event } = EventContextProvider();
  const { user } = AuthContextProvider();
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider();
  const [show, setShow] = useState(false)
  const [itemSelect, setItemSelect] = useState()

  const goNav = (item) => {
    if (item.condicion === "verdadero") {
      setItemSelect(item.title)
      router.push(item.route)
      return
    }
    const hasEvents =
      eventsGroupDone && Array.isArray(eventsGroup) && eventsGroup.length > 0
    toast("error", t(hasEvents ? "selectEventFromHomeToast" : "youmustcreateevent"))
  }

  const Navbar = [
    {
      title: "Mis eventos",
      icon: <MisEventosIcon className="text-primary w-7 h-7" />,
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
      icon: <InvitadosIcon className="text-primary w-7 h-7" />,
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
      icon: <InvitacionesIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/invitaciones" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Presupuesto",
      icon: <PresupuestoIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/presupuesto" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Mesas",
      icon: <MesasIcon className="text-primary w-7 h-7" />,
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
                className={`cursor-pointer transition text-primary hover:scale-[115%] hover:opacity-100 ${pathname === item.route && itemSelect === item.title ? "opacity-100 scale-[115%]" : "opacity-70"}`}
              >
                {item.icon}
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
                className={`cursor-pointer transition text-primary hover:scale-[115%] hover:opacity-100 ${pathname === item.route && itemSelect === item.title ? "opacity-100 scale-[115%]" : "opacity-70"}`}
              >
                {item.icon}
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

