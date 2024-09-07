import { useEffect, useRef, useState } from "react";
import { AuthContextProvider, EventContextProvider, LoadingContextProvider } from "../../context";
import Link from "next/link";
import { InvitacionesIcon, InvitadosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon } from "../icons";
import router from "next/router";
import { useToast } from "../../hooks/useToast";
import Cookies from "js-cookie";
import { getAuth, signOut } from "firebase/auth";
import { useActivity } from "../../hooks/useActivity";

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
  const wrapperRef = useRef(null);
  const toast = useToast();
  const { event } = EventContextProvider();
  const { user } = AuthContextProvider();
  const [show, setShow] = useState(false)

  const Navbar = [
    {
      title: "Mis eventos",
      icon: <MisEventosIcon className="text-primary w-7 h-7" />,
      route: "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Invitados",
      icon: <InvitadosIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/invitados" : "/",
      condicion: event?._id ? "verdadero" : "falso"
    },
    {
      title: "Invitaciones",
      icon: <InvitacionesIcon className="text-primary w-7 h-7" />,
      route: event?._id ? "/invitaciones" : "/",
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
  ]
  useOutsideSetShow(wrapperRef, setShow);
  return (
    <>
      <ul className={`${window?.location?.pathname === "/login" ? "hidden" : "grid"} grid-cols-5 md:hidden f-bottom bg-white z-50 rounded-t-2xl py-5 shadow-lg w-full fixed bottom-0 place-items-center`}>
        {Navbar.map((item, idx) => (
          <Link key={idx} href={item.route}>
            <li
              onClick={() => { item.condicion === "verdadero" ? "" : toast("error", "Debes crear un evento") }}
              className="cursor-pointer transition text-primary">
              {item.icon}
            </li>
          </Link>
        ))}
       {/*  <div className="w-10 h-10 truncate">
          <li onClick={() => {
            setShow(!show)
          }} className="text-blue-primary hover:text-blue-secondary cursor-pointer transition" >
            <img src={user?.photoURL ?? "/placeholder/user.png"} className="w-10 h-10 rounded-full" />
          </li>
          {show && <div ref={wrapperRef} >
            <ProfileMenu />
          </div>}
        </div> */}
      </ul>
    </>
  );
};

const ProfileMenu = () => {
  const { user, setUser, config } = AuthContextProvider();
  const { setLoading } = LoadingContextProvider();
  const toast = useToast()
  const [updateActivity, updateActivityLink] = useActivity()

  return (
    <div className={`bg-white w-40 rounded-md shadow-md overflow-hidden absolute transform translate-x-[calc(-122px)] -translate-y-[calc(100%+44px)]`}>
      <ul className="w-full">
        {!user && <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
          <button onClick={async () => { router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? "") }}>Login</button>
        </li>}
        {config?.pathDirectory && <Link href={config?.pathDirectory ?? ""} passHref>
          <li
            className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm"
          >
            <p>Ir al directorio</p>
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
              toast("success", `Cerró sesión con éxito`)
              updateActivity("logoutd")
              updateActivityLink("logoutd")
              router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "/")
            })
          }}>Cerrar Sesión</button>
        </li>}
      </ul>
    </div>
  )
};

export default NavigationMobile;

