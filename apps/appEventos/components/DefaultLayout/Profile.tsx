import { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { ArrowDownBodasIcon, CompanyIcon, LivingRoomIcon, TarjetaIcon, UserIcon } from "../icons";
import { useRouter, usePathname } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { AuthContextProvider, EventContextProvider, LoadingContextProvider } from "../../context";
import Cookies from "js-cookie";
import { ListItemProfile, Option } from "./ListItemProfile"
import { RiLoginBoxLine } from "react-icons/ri";
import { PiUserPlusLight } from "react-icons/pi";
import { MdLogout } from "react-icons/md";
import { TbWorldWww } from "react-icons/tb";
import { BsImages } from "react-icons/bs";
import { Sparkles } from "lucide-react";
import { getCopilotBaseUrl } from "../Copilot/getCopilotBaseUrl";
import { useToast } from "../../hooks/useToast";
import { Notifications } from "../Notifications";
import { Modal } from "../Utils/Modal";
import { ObtenerFullAcceso } from "../InfoApp/ObtenerFullAcceso";
import { useActivity } from "../../hooks/useActivity";
import { useAllowedRouter } from "../../hooks/useAllowed";
import { useFCMToken } from "../../hooks/useFCMToken";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { flags } from "../../utils/flags"
import { IoIosArrowDown } from "react-icons/io";
import { GoTasklist } from "react-icons/go";
import { ImageAvatar } from "../Utils/ImageAvatar";
import { authBridge } from '@bodasdehoy/shared/auth';
import { usePlanLimits } from "../../hooks/usePlanLimits";

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

const clearDevBypass = () => {
  if (typeof window === 'undefined') return
  const keys = ['dev_bypass', 'dev_bypass_email', 'dev_bypass_uid', 'dev_bypass_role', 'dev_bypass_eventos']
  keys.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) })
  localStorage.removeItem('appEventos_activeEventId')
}

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
  const { plan, loading: planLoading } = usePlanLimits()
  const { permission: pushPermission, requestPermission: requestPushPermission, token: fcmToken } = useFCMToken(
    user?.uid,
    config?.development
  );
  const [showFlags, setShowFlags] = useState(false)
  const [optionSelect, setOptionSelect] = useState<Flag>(config.development === "champagne-events" ? idiomaArray[0] : idiomaArray[1])
  const isAuthenticatedUser = !!user?.uid && !["guest", "anonymous"].includes(user?.displayName) && !user?._isSafetyGuest
  const isAdmin = Array.isArray(user?.role) ? user.role.includes("admin") : user?.role === "admin"
  const primaryRole = Array.isArray(user?.role) ? user.role[0] : user?.role
  const hasSkuAccess = (sku: string) => {
    if (!plan) return false
    const limit = Array.isArray((plan as any)?.product_limits)
      ? (plan as any).product_limits.find((l: any) => l?.sku === sku)
      : null
    if (!limit) return false
    return limit?.free_quota > 0 || limit?.overage_enabled === true
  }
  const canUseCopilot = isAdmin ? true : hasSkuAccess("ai-tokens")
  const canUseDesignIA = isAdmin ? true : hasSkuAccess("image-gen")

  const cookieContent = JSON.parse(Cookies.get("guestbodas") ?? "{}")

  useEffect(() => {
    i18next.changeLanguage(optionSelect?.value);
  }, [optionSelect])


  const optionsStart: Option[] = [
    {
      title: "Iniciar sesión",
      onClick: async () => {
        if (config?.pathLogin) {
          window.location.href = `${config.pathLogin}?redirect=${encodeURIComponent(window.location.origin + pathname)}`
        } else {
          router.push(`/login?d=${pathname}`)
        }
      },
      icon: <RiLoginBoxLine />,
      development: ["bodasdehoy", "all"],
      rol: undefined,
    },
    {
      title: "Registrarse",
      onClick: async () => {
        if (config?.pathLogin) {
          window.location.href = `${config.pathLogin}?redirect=${encodeURIComponent(window.location.origin + pathname)}&q=register`
        } else {
          router.push(`/login?q=register&d=${pathname}`)
        }
      },
      icon: <PiUserPlusLight />,
      development: ["bodasdehoy", "all"],
      rol: undefined,
    },
  ];

  const optionsCenter: Option[] = [
    {
      title: "Momentos",
      icon: <BsImages />,
      onClick: async () => { router.push("/momentos") },
      development: ["all"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Mi Web Creador",
      icon: <TbWorldWww />,
      onClick: async () => { router.push("/mi-web-creador") },
      development: ["all"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Copilot IA",
      // MEJ-1 (informe QA 21-jun, Opción A): icono Sparkles de Lucide como estándar
      // de facto para agentes IA (ChatGPT, Notion AI, Copilot). Sustituye BsChatDots
      // (burbuja chat genérica) por algo que identifica al agente IA.
      icon: <Sparkles size={18} />,
      onClick: async () => {
        if (planLoading) {
          toast("warning", t("Cargando…"))
          return
        }
        if (!canUseCopilot) {
          router.push("/facturacion")
          return
        }
        // BUG-14 (informe QA 21-jun): NEXT_PUBLIC_CHAT directo apuntaba a chat.bodasdehoy.com
        // en runtime de app-dev → 404. getCopilotBaseUrl detecta el hostname (app-dev →
        // chat-dev, app-test → chat-test, app → chat) y devuelve el origin correcto del tenant.
        window.location.href = getCopilotBaseUrl()
      },
      development: ["all"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
    {
      title: "Suite",
      icon: <CompanyIcon />,
      onClick: async () => {
        router.push(user?.role?.includes("empresa") ? process.env.NEXT_PUBLIC_SUITE ?? "" : "/info-empresa")
      },
      development: ["bodasdehoy"],
      rol: ["empresa"],
    },
  ]

  const optionsEnd: Option[] = [
    {
      title: "Diseño IA",
      onClick: async () => {
        if (planLoading) {
          toast("warning", t("Cargando…"))
          return
        }
        if (!canUseDesignIA) {
          router.push("/facturacion")
          return
        }
        router.push("/diseno-espacios")
      },
      icon: <LivingRoomIcon className="w-5 h-5" />,
      development: ["all"],
      rol: ["novio", "novia", "otro", "empresa"],
    },
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
        authBridge.clearAuth()
        Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
        Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
        clearDevBypass()
        // BUG-01 (informe QA 22-jun): el logout del menú de Profile no limpiaba
        // sessionBodas_fallback ni appEventos_activeEventId. Riesgo de fuga de
        // datos de sesión anterior en dispositivos compartidos.
        if (typeof window !== "undefined") {
          localStorage.removeItem('sessionBodas_fallback')
          localStorage.removeItem('appEventos_activeEventId')
        }
        signOut(getAuth()).then(() => {
          // BUG-CW-N03 (informe QA 22-jun noche): el CopilotIframe puede volver a setear
          // jwt_token/mcp_jwt_token durante la transición de logout (race condition con el
          // bridge SSO). Re-limpiar tras signOut garantiza que /login no detecte sesión
          // zombie y rediriga a /.
          authBridge.clearAuth()
          setUser(null)
          toast("success", t("loggedoutsuccessfully"))
          router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "/")
        })
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

  const ALWAYS_SHOW_FOR_AUTH = ["Mi perfil", "Cerrar Sesión", "Facturacion"]

  const optionReduce = (options: Option[]) => {
    return options.reduce((acc: Option[], item: Option) => {
      if (item.development?.includes(config?.development) || item.development?.includes("all")) {
        if (["Copilot IA", "Diseño IA"].includes(item.title) && !(config?.copilotEnabled === true || isAdmin)) {
          return acc
        }
        // Entradas sin `rol` (p. ej. Iniciar sesión / Registrarse): solo invitado sin cuenta.
        if (item.rol === undefined) {
          if (!isAuthenticatedUser) acc.push(item)
        } else if (isAuthenticatedUser && ALWAYS_SHOW_FOR_AUTH.includes(item.title)) {
          // Opciones esenciales: siempre visibles para cualquier usuario autenticado
          acc.push(item)
        } else if (
          isAuthenticatedUser &&
          !user?.role?.length &&
          [
            "Momentos",
            "Mi Web Creador",
            "Copilot IA",
            "Diseño IA",
          ].includes(item.title)
        ) {
          acc.push(item)
        } else if (
          item.rol?.includes(Array.isArray(user?.role) ? user.role[0] : user?.role ?? "") ||
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
        {isAuthenticatedUser &&
          <div className="items-center hidden md:flex gap-1 relative cursor-default">
            <div onClick={() => {
              !event ? toast("error", t("nohaveeventscreated")) : !isAllowedRouter("/servicios") ? ht() : router.push("/servicios")
            }} title={t("Servicios")} className={`${!event ? "opacity-40" : ""} bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/10 cursor-pointer transition`} >
              <GoTasklist className="text-primary w-5 h-5 scale-x-90" />
            </div>
          </div>
        }
        {isAuthenticatedUser &&
          <Notifications />
        }
        <ClickAwayListener onClickAway={() => dropdown && setDropwdon(false)}>
          <div
            data-testid="profile-menu-trigger"
            className="bg-white items-center pr-2 flex relative cursor-pointer"
            onClick={() => setDropwdon(!dropdown)}>
            {dropdown && (
              <div data-testid="profile-menu-dropdown" className="bg-white rounded-lg w-80 h-max shadow-lg shadow-gray-400 absolute top-0 right-0 translate-y-[46px] translate-x-[20px] md:-translate-x-[0px]  overflow-hidden z-[60] title-display">
                <div className="w-full border-b border-gray-100 pb-2">
                  <p className="text-gray-500 font-extralight uppercase tracking-wider	text-xs text-center  cursor-default">
                    {isAuthenticatedUser && primaryRole ? t(primaryRole) : ""}
                  </p>
                  <h3 data-testid="profile-menu-display-name" className="text-primary font-medium w-full text-center cursor-default ">
                    {isAuthenticatedUser ? (user?.displayName || user?.email || "—") : "Invitado"}
                  </h3>
                  {isAuthenticatedUser && (
                    <div className="mt-0.5 text-[12px] text-center text-gray-500 cursor-default">
                      {user?.email || "—"}
                    </div>
                  )}
                </div>
                <ul className="grid grid-cols-2 gap-2 text-xs place-items-left p-2 ">
                  {optionsReduceStart.map((item: Option, idx) => (
                    <ListItemProfile key={idx} {...item} />
                  ))}
                  {(isAuthenticatedUser && optionsReduceCenter.length > 0) &&
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
                  {/* Botón activar notificaciones push */}
                  {isAuthenticatedUser && pushPermission !== 'granted' && (
                    <button
                      onClick={async () => { await requestPushPermission(); setDropwdon(false); }}
                      className="col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition text-left w-full"
                    >
                      <span className="text-base">🔔</span>
                      <span>Activar notificaciones push</span>
                    </button>
                  )}
                  {isAuthenticatedUser && pushPermission === 'granted' && (
                    <div className="col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-green-700 bg-green-50">
                      <span className="text-base">🔔</span>
                      <span>Notificaciones push activadas</span>
                    </div>
                  )}
                  {!!user?.uid && !["guest", "anonymous"].includes(user?.displayName) && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => { setDropwdon(false); router.push("/facturacion"); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDropwdon(false); router.push("/facturacion"); } }}
                      className="col-span-2 flex text-white gap-2 bg-primary hover:bg-slate-400 transition cursor-pointer rounded-lg py-1 px-2 items-center justify-center"
                    >
                      {t("Ver planes")}
                    </div>
                  )}
                </ul>
              </div >
            )}
            {/*
              BUG-2 (informe QA 21-jun): el icono guest era invisible (bg-gray-100/text-gray-500
              sin label) y un usuario nuevo no sabía que era el acceso a login. Fix en 3 capas:
                · CSS: colores de marca (bg-primary/10 + text-primary + border-primary/20)
                · UX: title="Iniciar sesión" para tooltip nativo + aria-label para a11y
                · Desktop: texto "Iniciar sesión" junto al icono en ≥lg
            */}
            {isAuthenticatedUser ? (
              <div className="w-10 h-10">
                <ImageAvatar user={user} disabledTooltip />
              </div>
            ) : (
              <div
                className="h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center gap-1.5 px-2 lg:px-3 text-primary hover:bg-primary/15 transition"
                title={t("signin")}
                aria-label={t("signin")}
              >
                <UserIcon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline text-sm font-medium whitespace-nowrap">{t("signin")}</span>
              </div>
            )}
            <ArrowDownBodasIcon className="w-5 h-5 rotate-90 transform text-black" />
          </div>
        </ClickAwayListener>
        <div onClick={() => { setShowFlags(!showFlags) }} className=" flex items-center cursor-pointer" >
          {
            optionSelect?.flag &&
            <div className="space-x-1 flex items-center justify-center text-sm -ml-4">
              <img alt={optionSelect?.title ?? 'idioma'} src={`/flags-svg/${optionSelect?.flag}.svg`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} width={22} className="border-[1px] border-gray-500" />
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
                        <img alt={elem.title ?? 'idioma'} src={`/flags-svg/${elem.flag}.svg`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} className="object-cover w-6 h-4" />
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
      {/* Modal ObtenerFullAcceso eliminado — el botón ahora navega a /facturacion directamente */}
    </>
  );
};

export default Profile;
