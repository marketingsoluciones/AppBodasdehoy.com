import { useEffect, useRef, useState } from "react";
import { AuthContextProvider, EventContextProvider, LoadingContextProvider } from "../../context";
import Link from "next/link";
import { InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons";
import router from "next/router";
import { useToast } from "../../hooks/useToast";
import Cookies from "js-cookie";
import { getAuth, signOut } from "firebase/auth";
import { useActivity } from "../../hooks/useActivity";
import { useTranslation } from 'react-i18next';
import { BsCalendarHeartFill } from "react-icons/bs";
import { IoIosArrowDown } from "react-icons/io";
import ClickAwayListener from "react-click-away-listener";

const useOutsideSetShow = (ref, setShow) => {
  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setTimeout(() => {
        setShow(false)
      }, 50);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });
};
/* menu inferior con las opciones de redireccion de la app en vista movil */
const NavigationMobile = () => {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const toast = useToast();
  const { event } = EventContextProvider();
  const { user } = AuthContextProvider();
  const [show, setShow] = useState(false)
  const [itemSelect, setItemSelect] = useState()

  const Navbar = [
    {
      title: "Mis eventos",
      icon: <MisEventosIcon className="text-primary w-7 h-7" />,
      route: "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Resumen",
      icon: <ResumenIcon />,
      route: "/resumen-evento",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Invitados",
      icon: <InvitadosIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/invitados" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Mesas",
      icon: <MesasIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/mesas" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Presupuesto",
      icon: <PresupuestoIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/presupuesto" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Invitaciones",
      icon: <InvitacionesIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/invitaciones" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Lista de regalos",
      icon: <ListaRegalosIcon />,
      route: "/lista-regalos",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Itinerario",
      icon: <BsCalendarHeartFill className="w-7 h-7" />,
      route: "/itinerario",
      condicion: event?._id ? "verdadero" : "falso"
    },
  ]

  useOutsideSetShow(wrapperRef, setShow);

  return (
    <div className="w-full flex justify-center relative">
      <ClickAwayListener onClickAway={() => setShow(false)}>
        <ul onClick={() => { show && setShow(false) }} className={`${window?.location?.pathname === "/login" ? "hidden" : "flex flex-col"} md:hidden bg-white z-50 rounded-t-2xl Shadow w-full fixed bottom-0 transition duration-300 ease-in-out ${!show && "translate-y-[54px]"}`}>
          <div className="w-full grid grid-cols-6 py-5 place-items-center">
            <div onClick={() => setShow(!show)} className="w-9 h-9 flex items-center justify-center absolute z-[90] top-0 -translate-y-1/2 rounded-full bg-white Shadow2 text-gray-600 text-primary" >
              <IoIosArrowDown className={`w-6 h-6 transition duration-500 ease-in-out ${!show ? "scale-y-[-1]" : "scale-y-[1]"}`} />
            </div>
            {Navbar.slice(0, 6).map((item, idx) => (
              <Link key={idx} href={item.route} className="">
                <li
                  onClick={() => { item.condicion === "verdadero" ? setItemSelect(item.title) : toast("error", t("youmustcreateevent")) }}
                  className={`cursor-pointer transition text-primary hover:scale-[115%] hover:opacity-100 ${window?.location?.pathname === item.route && itemSelect === item.title ? "opacity-100 scale-[115%]" : "opacity-70"}`}>
                  {item.icon}
                </li>
              </Link>
            ))}
          </div>
          <div className={`w-full grid grid-cols-6 pt-1 pb-5 place-items-center`}>
            {Navbar.slice(6, 8).map((item, idx) => (
              <Link key={idx} href={item.route}>
                <li
                  onClick={() => { item.condicion === "verdadero" ? setItemSelect(item.title) : toast("error", t("youmustcreateevent")) }}
                  className={`cursor-pointer transition text-primary hover:scale-[115%] hover:opacity-100 ${window?.location?.pathname === item.route && itemSelect === item.title ? "opacity-100 scale-[115%]" : "opacity-70"}`}>
                  {item.icon}
                </li>
              </Link>
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

const ProfileMenu = () => {
  const { t } = useTranslation();
  const { user, setUser, config } = AuthContextProvider();
  const { setLoading } = LoadingContextProvider();
  const toast = useToast()
  const [updateActivity, updateActivityLink] = useActivity()

  return (
    <div className={`bg-white w-40 rounded-md shadow-md overflow-hidden absolute transform translate-x-[calc(-122px)] -translate-y-[calc(100%+44px)]`}>
      <ul className="w-full">
        {!user && <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
          <button onClick={async () => { router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? "") }}>{t("login")}</button>
        </li>}
        {config?.pathDirectory && <Link href={config?.pathDirectory ?? ""} passHref>
          <li
            className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm"
          >
            <p>{t("gotodirectory")}</p>
          </li>
        </Link>}
        {(user?.uid && user.displayName !== "guest") && <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
          <button onClick={async () => {
            setLoading(true)
            Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
            Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
            signOut(getAuth()).then(() => {
              if (["vivetuboda"].includes(config?.development)) {
                setUser()
                router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "/login")
                return
              }
              toast("success", t(`loggedoutsuccessfully`))
              updateActivity("logoutd")
              updateActivityLink("logoutd")
              router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "/")
            })
          }}>{t("logoff")}</button>
        </li>}
      </ul>
    </div>
  )
};

export default NavigationMobile;

