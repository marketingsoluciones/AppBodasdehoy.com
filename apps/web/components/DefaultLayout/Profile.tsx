import { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { ArrowDownBodasIcon, Catering, CompanyIcon, CorazonPaddinIcon, Eventos, FotografoMenu, LugaresBodas, Posts, TarjetaIcon, UserIcon, WeddingPage, WeddingPlanner } from "../icons";
import { useRouter, usePathname } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { AuthContextProvider, EventContextProvider, LoadingContextProvider } from "../../context";
import Cookies from "js-cookie";
import { ListItemProfile, Option } from "./ListItemProfile"
import { RiLoginBoxLine } from "react-icons/ri";
import { PiUserPlusLight } from "react-icons/pi";
import { MdLogout } from "react-icons/md";
import { TbWorldWww } from "react-icons/tb";
import { useToast } from "../../hooks/useToast";
import { Notifications } from "../Notifications";
import { Modal } from "../Utils/Modal";
import { ObtenerFullAcceso } from "../InfoApp/ObtenerFullAcceso";
import { useActivity } from "../../hooks/useActivity";
import { useAllowedRouter } from "../../hooks/useAllowed";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { flags } from "../../utils/flags.js"
import { IoIosArrowDown } from "react-icons/io";
import { GoTasklist } from "react-icons/go";
import { ImageAvatar } from "../Utils/ImageAvatar";
import { adaptUrlForTestEnv } from "../../utils/urlHelpers";

interface Flag {
  value: string
  title: string
  flag: string
}

const idiomaArray = [
  {
    value: "en",
    title: "en",
    flag: flags[0].pre

  },
  {
    value: "es",
    title: "es",
    flag: flags[68].pre

  }
]

const Profile = ({ user, state, set, ...rest }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const [updateActivity, updateActivityLink] = useActivity()
  const { config, setUser, setActionModals, actionModals } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const { event } = EventContextProvider()
  const [isAllowedRouter, ht] = useAllowedRouter()
  const [dropdown, setDropwdon] = useState(false);
  const [showFlags, setShowFlags] = useState(false)
  const [optionSelect, setOptionSelect] = useState<Flag>(config.development === "champagne-events" ? idiomaArray[0] : idiomaArray[1])

  const cookieContent = JSON.parse(Cookies.get("guestbodas") ?? "{}")

  useEffect(() => {
    i18next.changeLanguage(optionSelect?.value);
  }, [optionSelect])


  const optionsStart: Option[] = [
    {
      title: "Iniciar sesión",
      onClick: async () => { router.push(config?.pathLogin ? `${config?.pathLogin}?d=app` : `/login?d=${pathname}`) },
      icon: <RiLoginBoxLine />,
      development: ["bodasdehoy", "all"],
      rol: undefined,
    },
    {
      title: "Registrarse",
      onClick: async () => { router.push(config?.pathLogin ? `${config?.pathLogin}?d=app&q=register` : `/login?q=register&d=${pathname}`) },
      icon: <PiUserPlusLight />,
      development: ["bodasdehoy", "all"],
      rol: undefined,
    },
    {
      title: "Mis empresas",
      onClick: async () => {
        const path = adaptUrlForTestEnv(process.env.NEXT_PUBLIC_CMS ?? "")
        router.push((user?.role?.includes("empresa")) ? path ?? "" : config?.pathLogin ? `${config?.pathDirectory}/info-empresa?d=app` : `/login?d=${pathname}`)
      },
      icon: <CompanyIcon />,
      development: ["bodasdehoy"],
      rol: ["all"],
    },
    /* {
      title: "Mis notificaciones",
      onClick: async () => { setModal(!modal) },
      icon: <BiBell />,
      development: ["bodasdehoy", "all"],
      rol: ["novio", "novia", "otro", "empresa", "all"],
    }, */
    {
      title: "Mis publicaciones",
      onClick: async () => {
        const path = adaptUrlForTestEnv(process.env.NEXT_PUBLIC_CMS ?? "")
        const pathEnd = `${path}/InfoPage/publicaciones`
        router.push((user?.displayName !== "guest") ? `${path}/InfoPage/publicaciones` : config?.pathLogin ? `${config?.pathLogin}?d=app&end=${pathEnd}` : `/login?d=${pathname}`)
      },
      icon: <Posts />,
      development: ["bodasdehoy"],
      rol: ["all"],
    },
    {
      title: "Mi wedding page",
      onClick: async () => {
        router.push(adaptUrlForTestEnv(process.env.NEXT_PUBLIC_CUSTOMWEB ?? ""))
      },
      icon: <WeddingPage />,
      development: ["bodasdehoy"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mis eventos",
      onClick: async () => {
        router.push(cookieContent?.eventCreated || user?.uid ? adaptUrlForTestEnv(process.env.NEXT_PUBLIC_EVENTSAPP ?? "") : "/welcome-app")
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
      onClick: async () => { config?.pathPerfil ? router.push(config?.pathPerfil) : router.push("/configuracion") },
      icon: <UserIcon />,
      development: ["bodasdehoy", "all"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Cerrar Sesión",
      icon: <MdLogout />,
      onClick: async () => {
        setLoading(true)
        updateActivity("logoutd")
        updateActivityLink("logoutd")
        Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
        Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
        signOut(getAuth()).then(() => {
          toast("success", t("loggedoutsuccessfully"))
          router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "/")
        })
        setUser(null)
      },
      development: ["bodasdehoy", "all"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Facturacion",
      onClick: async () => { router.push("/facturacion") },
      icon: <TarjetaIcon />,
      development: ["all"],
      rol: ["novio", "novia", "otro", "empresa"]
    }
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

  return (
    <>
      <div className="text-gray-100 flex space-x-4 relative" {...rest} >
        {user &&
          <div className="items-center flex relative cursor-default ">
            <div onClick={() => {
              !event ? toast("error", t("nohaveeventscreated")) : !isAllowedRouter("/servicios") ? ht() : router.push("/servicios")
            }} className={`${!event ? "opacity-40" : ""} bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200* cursor-pointer`} >
              <GoTasklist className="text-primary w-6 h-6 scale-x-90" />
            </div>
          </div>
        }
        {user &&
          <Notifications />
        }
        <ClickAwayListener onClickAway={() => dropdown && setDropwdon(false)}>
          <div
            className="bg-white items-center pr-2 flex relative cursor-pointer"
            onClick={() => setDropwdon(!dropdown)}>
            {dropdown && (
              <div className="bg-white rounded-lg w-80 h-max shadow-lg shadow-gray-400 absolute top-0 right-0 translate-y-[46px] translate-x-[20px] md:-translate-x-[0px]  overflow-hidden z-[60] title-display">
                <div className="w-full border-b border-gray-100 pb-2">
                  <p className="text-gray-500 font-extralight uppercase tracking-wider	text-xs text-center  cursor-default">
                    {(user?.role && user?.role?.length > 0) && t(user?.role[0])}
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
                  {
                    true ?
                      <div onClick={() => setActionModals(!actionModals)} className="col-span-2 flex text-white gap-2 bg-primary hover:bg-slate-400 transition cursor-pointer rounded-lg py-1 px-2 items-center justify-center ">
                        {t("fullaccess")}
                      </div> :
                      null
                  }
                </ul>
              </div >
            )}
            <div className="w-10 h-10">
              <ImageAvatar user={user} disabledTooltip />
            </div>
            <ArrowDownBodasIcon className="w-5 h-5 rotate-90 transform text-black" />
          </div>
        </ClickAwayListener>
        <div onClick={() => { setShowFlags(!showFlags) }} className=" flex items-center cursor-pointer" >
          {
            optionSelect?.flag &&
            <div className="space-x-1 flex items-center justify-center text-sm -ml-4">
              <img src={`/flags-svg/${optionSelect?.flag}.svg`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} width={22} className="border-[1px] border-gray-500" />
              <span className="hidden md:flex text-gray-600">{optionSelect?.title}</span>
            </div >
          }
          <IoIosArrowDown className="text-gray-500" />
          {showFlags && <ClickAwayListener onClickAway={() => { setShowFlags(false) }}>
            <div className={`bg-white w-max h-max absolute translate-y-10 z-10 border-[1px] rounded-b-xl flex flex-col right-0 shadow-md`}>
              <ul className="w-full  cursor-pointer text-gray-900 text-xs py-1  ">
                {
                  idiomaArray.map((elem, idx) =>
                    <li key={idx} onClick={() => {
                      setOptionSelect(elem)
                      setShowFlags(false)
                    }} className="flex space-x-1 items-center justify-center hover:bg-gray-200 px-4 py-1">
                      <div className="border-[1px] border-gray-800">
                        <img src={`/flags-svg/${elem.flag}.svg`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} className="object-cover w-6 h-4" />
                      </div>
                      <div className="flex flex-1 truncate">
                        <span className="flex-1 text-gray-700">{elem.title}</span>
                      </div>
                    </li>
                  )}
              </ul>
            </div>
          </ClickAwayListener>
          }
        </div>
      </div>
      {
        actionModals && (
          <Modal classe={"w-[95%] md:w-[750px] h-[62%] flex items-center justify-center"} >
            <ObtenerFullAcceso />
          </Modal>
        )
      }
    </>
  );
};

export default Profile;
