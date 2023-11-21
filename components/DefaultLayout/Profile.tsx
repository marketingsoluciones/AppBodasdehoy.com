import Link from "next/link";
import { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { capitalize } from "../../utils/Capitalize";
import { CompanyIcon, CorazonPaddinIcon, Eventos, MensajeIcon, Posts, UserIcon, WeddingPage } from "../icons";
import { useRouter } from "next/router";
import { getAuth, signOut } from "firebase/auth";
import { AuthContextProvider } from "../../context";
import Cookies from "js-cookie";
import { ListItemProfile, Option } from "./ListItemProfile"
import { RiLoginBoxLine } from "react-icons/ri";
import { PiUserPlusLight } from "react-icons/pi";
import { BiBell } from "react-icons/bi";
import { MdLogout } from "react-icons/md";

const Profile = ({ user, state, set, ...rest }) => {
  const { config } = AuthContextProvider()
  const [dropdown, setDropwdon] = useState(false);
  const router = useRouter()
  const cookieContent = JSON.parse(Cookies.get("guestbodas") ?? "{}")
  const options: Option[] = [
    {
      title: "Iniciar sesión",
      onClick: async () => { router.push(`/login?d=${router.asPath.slice(1, router.asPath.length)}`) },
      icon: <RiLoginBoxLine />,
      rol: undefined,
    },
    {
      title: "Registrarse",
      onClick: async () => { router.push(`/login?q=register&d=${router.asPath.slice(1, router.asPath.length)}`) },
      icon: <PiUserPlusLight />,
      rol: undefined,
    },
    {
      title: "Mis empresas",
      onClick: async () => {
        const path = window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS
        router.push(user?.role?.includes("empresa") ? path ?? "" : "/info-empresa")
      },
      icon: <CompanyIcon />,
      rol: ["all"],
    },
    {
      title: "Notificaciones",
      onClick: async () => { /*setModal(!modal)*/ },
      icon: <BiBell />,
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mis publicaciones",
      onClick: async () => {
        //!user?.uid && toast("success", "debes ininiciar sessión o registrarte")
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}/InfoPage/publicaciones`
        router.push(user?.uid ? path ?? "" : `/login?d=${router.asPath.slice(1, router.asPath.length)}&end=${path}`)
      },
      icon: <Posts />,
      rol: ["all"],
    },
    {
      title: "Wedding page",
      onClick: async () => { /*setModal(!modal)*/ },
      icon: <WeddingPage />,
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mis eventos",
      onClick: async () => {
        router.push(cookieContent?.eventCreated || user?.uid ? window.origin.includes("://test") ? process.env.NEXT_PUBLIC_EVENTSAPP?.replace("//", "//test") ?? "" : process.env.NEXT_PUBLIC_EVENTSAPP ?? "" : "/welcome-app",)
      },
      icon: <Eventos />,
      rol: ["all"],
    },
    {
      title: "Proveedores",
      onClick: async () => {
        router.push(cookieContent?.eventCreated || user?.uid ? window.origin.includes("://test") ? process.env.NEXT_PUBLIC_DIRECTORY?.replace("//", "//test.") ?? "" : process.env.NEXT_PUBLIC_DIRECTORY ?? "" : "/welcome-app",)
      },
      icon: <CorazonPaddinIcon />,
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mi perfil",
      onClick: async () => {
        router.push(cookieContent?.eventCreated || user?.uid ? window.origin.includes("://test") ? `${process.env.NEXT_PUBLIC_DIRECTORY}/configuracion`?.replace("//", "//test.") ?? "" : `${process.env.NEXT_PUBLIC_DIRECTORY}/configuracion` ?? "" : "/welcome-app",)
      },
      icon: <UserIcon />,
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Cerrar Sesión",
      icon: <MdLogout />,
      // onClick: async () => {
      //   setHovered(false)
      //   setLoading(true);
      //   _signOut()
      // },
      rol: ["novio", "novia", "otro", "empresa"],
    },
  ];

  const optionsReduce = options.reduce((acc: Option[], item: Option) => {
    if (
      item.rol?.includes(user?.role ? user.role[0] : "") ||
      item.rol?.includes("all") ||
      item.rol === user?.role
    ) {
      acc.push(item)
    }
    return acc
  }, [])
  const valirUser = user?.displayName == "guest" ? "guest" : "loged"
  //const ListaDropdownFilter = ListaDropdown.filter(elem => elem?.user === valirUser || elem?.user === "all")
  return (
    <>
      <div
        className="text-gray-100 flex gap-6 cursor-pointer hover:text-gray-300 relative"
        {...rest}
      >
        <span className="flex items-center gap-2 relative">
          {/* <CorazonIcono
            className="cursor-pointer hover:opacity-80 transition"
            onClick={() => set(!state)}
          /> */}

          {/* <a href={process.env.NEXT_PUBLIC_CHAT ?? "/"} >
            <MensajeIcon className="cursor-pointer hover:opacity-80 transition" />
          </a> */}
        </span>

        <ClickAwayListener onClickAway={() => dropdown && setDropwdon(false)}>
          <div
            className="bg-blue-300 items-center gap-2 profile hidden md:flex relative"
            onClick={() => setDropwdon(!dropdown)}
          >
            {dropdown && (
              <div className="bg-white rounded-lg w-80 h-max shadow-lg absolute bottom-0 right-0 transform translate-y-[210px] overflow-hidden z-40 title-display">
                {/* < div className={`bg-red w-80 p-3 rounded-xl h-max shadow-md absolute bottom-0 right-0 inset-y-full translate-y-1 overflow-hidden z-50}`}> */}
                <div className="w-full border-b border-gray-100 pb-2">
                  <p className="text-gray-500 font-extralight uppercase tracking-wider	text-xs text-center  cursor-default">
                    {user?.role && user?.role?.length > 0 && user?.role[0]}
                  </p>
                  <h3 className="text-primary font-medium w-full text-center cursor-default ">
                    {user?.displayName}
                  </h3>
                </div>
                <ul className="grid grid-cols-2 gap-2 text-xs place-items-left p-2 ">
                  {optionsReduce.map((item: Option, idx) => (
                    <ListItemProfile key={idx} {...item} />
                  ))}
                </ul>
              </div >
            )}

            <img
              src={user?.photoURL ?? "/placeholder/user.png"}
              className="object-cover w-11 h-11 rounded-full"
              alt={user?.displayName}
            />
            <p className="font-display text-sm text-gray-500 capitalize">
              {user?.displayName !== "guest" && user?.displayName?.toLowerCase()}
            </p>
          </div>
        </ClickAwayListener>
      </div>
      <style jsx>
        {`
          .profile {
            min-width: 200px;
          }
        `}
      </style>
    </>
  );
};

export default Profile;
