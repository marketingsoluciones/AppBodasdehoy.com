import Link from "next/link";
import { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { capitalize } from "../../utils/Capitalize";
import { ArrowDown, ArrowDownBodasIcon, ArrowLeft, Catering, CompanyIcon, CorazonPaddinIcon, Eventos, FotografoMenu, LugaresBodas, MensajeIcon, Posts, UserIcon, WeddingPage, WeddingPlanner } from "../icons";
import router, { useRouter } from "next/router";
import { getAuth, signOut } from "firebase/auth";
import { AuthContextProvider } from "../../context";
import Cookies from "js-cookie";
import { ListItemProfile, Option } from "./ListItemProfile"
import { RiLoginBoxLine } from "react-icons/ri";
import { PiUserPlusLight } from "react-icons/pi";
import { BiBell } from "react-icons/bi";
import { MdLogout } from "react-icons/md";
import { TbWorldWww } from "react-icons/tb";

const Profile = ({ user, state, set, ...rest }) => {
  const { config } = AuthContextProvider()
  const [dropdown, setDropwdon] = useState(false);
  const { route } = useRouter()
  const cookieContent = JSON.parse(Cookies.get("guestbodas") ?? "{}")
  const optionsStart: Option[] = [
    {
      title: "Iniciar sesión",
      onClick: async () => { router.push(config?.pathLogin ? `${config?.pathLogin}?d=app` : `/login?d=${route}`) },
      icon: <RiLoginBoxLine />,
      development: ["bodasdehoy", "all"],
      rol: undefined,
    },
    {
      title: "Registrarse",
      onClick: async () => { router.push(config?.pathLogin ? `${config?.pathLogin}?d=app&q=register` : `/login?q=register&d=${route}`) },
      icon: <PiUserPlusLight />,
      development: ["bodasdehoy", "all"],
      rol: undefined,
    },
    {
      title: "Mis empresas",
      onClick: async () => {
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
        router.push((user?.role?.includes("empresa")) ? path ?? "" : config?.pathLogin ? `${config?.pathDirectory}/info-empresa?d=app` : `/login?d=${route}`)
      },
      icon: <CompanyIcon />,
      development: ["bodasdehoy"],
      rol: ["all"],
    },
    {
      title: "Mis notificaciones",
      onClick: async () => { /*setModal(!modal)*/ },
      icon: <BiBell />,
      development: ["bodasdehoy", "all"],
      rol: ["novio", "novia", "otro", "empresa", "all"],
    },
    {
      title: "Mis publicaciones",
      onClick: async () => {
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
        const pathEnd = `${window.origin.includes("://test.") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}/InfoPage/publicaciones`
        router.push((user?.displayName !== "guest") ? `${path}/InfoPage/publicaciones` ?? "" : config?.pathLogin ? `${config?.pathLogin}?d=app&end=${pathEnd}` : `/login?d=${route}`)
      },
      icon: <Posts />,
      development: ["bodasdehoy"],
      rol: ["all"],
    },
    {
      title: "Mi wedding page",
      onClick: async () => {
        router.push(window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CUSTOMWEB?.replace("//", "//test") ?? "" : process.env.NEXT_PUBLIC_CUSTOMWEB ?? "")
      },
      icon: <WeddingPage />,
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mis eventos",
      onClick: async () => {
        router.push(cookieContent?.eventCreated || user?.uid ? window.origin.includes("://test") ? process.env.NEXT_PUBLIC_EVENTSAPP?.replace("//", "//test") ?? "" : process.env.NEXT_PUBLIC_EVENTSAPP ?? "" : "/welcome-app",)
      },
      icon: <Eventos />,
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mis proveedores",
      onClick: async () => { router.push(config?.pathDirectory) },
      icon: <CorazonPaddinIcon />,
      development: ["bodasdehoy"],
      rol: ["all"],
    },
  ];

  const optionsCenter: Option[] = [
    {
      title: "Lugares para bodas",
      onClick: async () => {
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
        router.push(`${path}/lugaresBodas`)
      },
      icon: <LugaresBodas />,
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Catering de bodas",
      onClick: async () => {
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
        router.push(`${path}/cateringBodas`)
      },
      icon: <Catering />,
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Wedding Planner",
      onClick: async () => {
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
        router.push(`${path}/weddingPlanner`)
      },
      icon: <WeddingPlanner />,
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Fotografos",
      icon: <FotografoMenu />,
      onClick: async () => {
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
        router.push(`${path}/fotografo`)
      },
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mi Web Creador",
      icon: <TbWorldWww />,
      onClick: async () => {
        const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
        router.push(`${path}/webCreator`)
      },
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
  ]

  const optionsEnd: Option[] = [
    {
      title: "Mi perfil",
      onClick: async () => { config?.pathPerfil && router.push(config?.pathPerfil) },
      icon: <UserIcon />,
      development: ["bodasdehoy", "all"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Cerrar Sesión",
      icon: <MdLogout />,
      onClick: async () => {
        Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
        Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
        signOut(getAuth());
        router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "")
      },
      development: ["bodasdehoy", "all"],
      rol: ["novio", "novia", "otro"],
    },
  ]

  const optionReduce = (options: Option[]) => {
    return options.reduce((acc: Option[], item: Option) => {
      if (item.development?.includes(config?.development) || item.development?.includes("all")) {
        if (
          item.rol?.includes(user?.role ? user.role[0] : "") ||
          item.rol?.includes("all") ||
          item.rol === user?.role
        ) {
          acc.push(item)
        }
      }
      return acc
    }, [])
  }


  const optionsReduceStart = optionReduce(optionsStart)
  const optionsReduceCenter = optionReduce(optionsCenter)
  const optionsReduceEnd = optionReduce(optionsEnd)


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
            className="bg-white items-center gap-2 profile hidden md:flex relative"
            onClick={() => setDropwdon(!dropdown)}
          >
            {dropdown && (
              <div className="bg-white rounded-lg w-80 h-max shadow-lg absolute top-0 right-0 translate-y-[46px] overflow-hidden z-40 title-display">
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

                  {optionsReduceStart.map((item: Option, idx) => (
                    <ListItemProfile key={idx} {...item} />
                  ))}
                  {(user?.displayName !== "guest" && config?.development === "bodasdehoy") &&
                    <>
                      <hr className="col-span-2" />
                      <span className="col-span-2 text-gray-700 font-semibold">Módulos:</span>
                      {optionsReduceCenter.map((item: Option, idx) => (
                        <ListItemProfile key={idx} {...item} />
                      ))}
                      <hr className="col-span-2" />
                    </>
                  }
                  {optionsReduceEnd.map((item: Option, idx) => (
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
            <ArrowDownBodasIcon className="w-5 h-5 rotate-90 transform cursor-pointer text-black" />
            <p className="font-display text-sm text-gray-500 capitalize">
              {/* {user?.displayName !== "guest" && user?.displayName?.toLowerCase()} */}
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
