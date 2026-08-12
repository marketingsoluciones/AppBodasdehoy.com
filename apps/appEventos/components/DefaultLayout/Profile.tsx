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

const Profile = ({ user, state, set, studio = false, ...rest }) => {
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
        // Fase 3: logout completo — borrar TODAS las variantes de cada cookie de sesión
        // (Domain configurado + host-only + cross-app .tenant.com). Si una variante sobrevive,
        // getSharedAuthState sigue autenticando (isAuthenticated = idToken O sessionBodas).
        const _crossAppDomain = typeof window !== "undefined"
          ? "." + window.location.hostname.split(".").slice(-2).join(".")
          : undefined;
        const _removeAllVariants = (name?: string) => {
          if (!name) return;
          Cookies.remove(name, { domain: config?.domain ?? "" });
          Cookies.remove(name);
          if (_crossAppDomain) Cookies.remove(name, { domain: _crossAppDomain });
        };
        ["idTokenV0.1.0", "guestbodas", "current_development", config?.cookie].forEach(_removeAllVariants);
        clearDevBypass()
        // BUG-01 (informe QA 22-jun): el logout del menú de Profile no limpiaba
        // sessionBodas_fallback ni appEventos_activeEventId. Riesgo de fuga de
        // datos de sesión anterior en dispositivos compartidos.
        if (typeof window !== "undefined") {
          localStorage.removeItem('sessionBodas_fallback')
          localStorage.removeItem('appEventos_activeEventId')
        }
        // Fase 3 (cross-tab): avisar a otras pestañas de appEventos para cierre inmediato.
        try { new BroadcastChannel('appeventos-auth').postMessage({ type: 'logout' }) } catch { /* no soportado */ }
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
          <div className="items-center hidden md:flex gap-1 relative cursor-default shrink-0">
            <div onClick={() => {
              !event ? toast("error", t("nohaveeventscreated")) : !isAllowedRouter("/servicios") ? ht() : router.push("/servicios")
            }} title={t("Servicios")} className={`${!event ? "opacity-40" : ""} ${studio ? "w-[42px] h-[42px] shrink-0 bg-[#F7F6F8] hover:bg-[#FCE7F0] text-[#6b6b72] hover:text-[#EF5B94]" : "bg-slate-100 w-8 h-8 hover:bg-primary/10"} rounded-full flex items-center justify-center cursor-pointer transition`} >
              {studio ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" className="shrink-0"><path d="M4.5 6.5l1 1 2-2M4.5 12l1 1 2-2M4.5 17.5l1 1 2-2" /><path d="M11 6.5h8.5M11 12h8.5M11 17.5h8.5" /></svg>
              ) : (
                <GoTasklist className="text-primary w-5 h-5 scale-x-90" />
              )}
            </div>
          </div>
        }
        {isAuthenticatedUser &&
          <Notifications studio={studio} />
        }
        <ClickAwayListener onClickAway={() => dropdown && setDropwdon(false)}>
          <div
            data-testid="profile-menu-trigger"
            className={studio
              ? "relative flex items-center gap-2.5 cursor-pointer rounded-[26px] py-[5px] pl-[5px] pr-3 hover:bg-[#F7F6F8] transition"
              : "bg-white items-center pr-2 flex relative cursor-pointer"}
            onClick={() => setDropwdon(!dropdown)}>
            {dropdown && studio && (
              <div
                data-testid="profile-menu-dropdown"
                className="absolute right-0 top-full mt-2.5 z-[60] w-[300px] bg-white rounded-[18px] border border-[#f0f0f2] overflow-hidden"
                style={{ boxShadow: "0 24px 70px rgba(0,0,0,.16)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera */}
                <div className="px-6 pt-[22px] pb-[18px] text-center border-b border-[#f4f4f6]">
                  <div className="relative w-14 h-14 mx-auto mb-2.5">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-[#EF5B94]">
                      {isAuthenticatedUser ? <ImageAvatar user={user} disabledTooltip /> : <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-7 h-7 text-white" /></div>}
                    </div>
                    {isAuthenticatedUser && primaryRole && (
                      <span className="absolute -bottom-0.5 -right-1.5 bg-[#FEF6D8] text-[#B8860B] px-2 py-[3px] rounded-[10px] border-[1.5px] border-white uppercase" style={{ font: "700 8.5px Poppins", letterSpacing: ".6px" }}>{isAdmin ? "ADMIN" : t(primaryRole)}</span>
                    )}
                  </div>
                  <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>{isAuthenticatedUser ? (user?.displayName || user?.email || "—") : "Invitado"}</div>
                  {isAuthenticatedUser && <div style={{ font: "400 12px Poppins", color: "#8a8a90" }}>{user?.email || "—"}</div>}
                </div>

                {/* Opciones */}
                <div className="p-2.5">
                  <div onClick={() => { setDropwdon(false); config?.pathPerfil ? router.push(config.pathPerfil) : router.push("/configuracion"); }} className="flex items-center gap-[11px] px-[13px] py-2.5 rounded-[11px] cursor-pointer hover:bg-[#FCE7F0]" style={{ font: "500 13px Poppins", color: "#3A3A42" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" /></svg>
                    Mi perfil
                  </div>
                  <div onClick={() => { setDropwdon(false); router.push("/facturacion"); }} className="flex items-center gap-[11px] px-[13px] py-2.5 rounded-[11px] cursor-pointer hover:bg-[#FCE7F0]" style={{ font: "500 13px Poppins", color: "#3A3A42" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></svg>
                    Facturación
                  </div>
                  {/* Módulos (se conservan todas las acciones existentes) */}
                  {optionsReduceCenter.map((item: Option, idx) => (
                    <div key={`c-${idx}`} onClick={(e) => { setDropwdon(false); item.onClick?.(e); }} className="flex items-center gap-[11px] px-[13px] py-2.5 rounded-[11px] cursor-pointer hover:bg-[#FCE7F0]" style={{ font: "500 13px Poppins", color: "#3A3A42" }}>
                      <span className="w-4 h-4 flex items-center justify-center text-[#6b6b72]">{item.icon}</span>
                      {t(item.title)}
                    </div>
                  ))}
                  {optionsReduceEnd.filter((o: Option) => !["Mi perfil", "Cerrar Sesión", "Facturacion"].includes(o.title)).map((item: Option, idx) => (
                    <div key={`e-${idx}`} onClick={(e) => { setDropwdon(false); item.onClick?.(e); }} className="flex items-center gap-[11px] px-[13px] py-2.5 rounded-[11px] cursor-pointer hover:bg-[#FCE7F0]" style={{ font: "500 13px Poppins", color: "#3A3A42" }}>
                      <span className="w-4 h-4 flex items-center justify-center text-[#6b6b72]">{item.icon}</span>
                      {t(item.title)}
                    </div>
                  ))}
                  {/* Notificaciones push + toggle */}
                  {isAuthenticatedUser && (
                    <div className="flex items-center justify-between px-[13px] py-2.5 rounded-[11px] hover:bg-[#FCE7F0]" style={{ font: "500 13px Poppins", color: "#3A3A42" }}>
                      <div className="flex items-center gap-[11px]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></svg>
                        Notificaciones push
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); if (pushPermission !== 'granted') requestPushPermission(); }}
                        className={`w-9 h-5 rounded-xl relative flex-none transition-colors ${pushPermission === 'granted' ? 'bg-[#2FB37E] cursor-default' : 'bg-[#d4d4da] cursor-pointer'}`}
                        title={pushPermission === 'granted' ? 'Activadas' : 'Activar'}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${pushPermission === 'granted' ? 'left-[18px]' : 'left-0.5'}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
                      </div>
                    </div>
                  )}
                  {/* Idioma */}
                  <div onClick={(e) => { e.stopPropagation(); setShowFlags(!showFlags); }} className="flex items-center justify-between px-[13px] py-2.5 rounded-[11px] cursor-pointer hover:bg-[#FCE7F0]" style={{ font: "500 13px Poppins", color: "#3A3A42" }}>
                    <div className="flex items-center gap-[11px]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
                      Idioma
                    </div>
                    <span style={{ font: "500 12px Poppins", color: "#8a8a90" }}>{optionSelect?.value === 'en' ? 'English' : 'Español'} ›</span>
                  </div>
                  {showFlags && (
                    <div className="mx-[13px] mb-1 rounded-[10px] border border-gray-100 overflow-hidden">
                      {idiomaArray.map((elem, idx) => (
                        <div key={idx} onClick={(e) => { e.stopPropagation(); setOptionSelect(elem); setShowFlags(false); }} className="px-4 py-2 cursor-pointer hover:bg-gray-100" style={{ font: "500 12px Poppins", color: elem.value === optionSelect?.value ? "#EF5B94" : "#3A3A42" }}>
                          {elem.value === 'en' ? 'English' : 'Español'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-3.5 pt-3 pb-3.5 border-t border-[#f4f4f6] flex flex-col gap-2">
                  {!!user?.uid && !["guest", "anonymous"].includes(user?.displayName) && (
                    <button onClick={() => { setDropwdon(false); router.push("/facturacion"); }} className="py-[11px] rounded-[11px] text-white border-none cursor-pointer hover:bg-[#D83E7C]" style={{ background: "#EF5B94", font: "600 12.5px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>{t("Ver planes")}</button>
                  )}
                  <button onClick={(e) => { setDropwdon(false); const f = optionsEnd.find((o: Option) => o.title === "Cerrar Sesión")?.onClick; if (f) f(e); }} className="flex items-center justify-center gap-2 py-2 rounded-[10px] cursor-pointer border-none bg-transparent text-[#8a8a90] hover:bg-[#f5f5f7] hover:text-[#D83E7C]" style={{ font: "500 12.5px Poppins" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
            {dropdown && !studio && (
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
              studio ? (
                <>
                  <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-[#EF5B94] flex-none">
                    <ImageAvatar user={user} disabledTooltip />
                  </div>
                  <div className="hidden md:block" style={{ lineHeight: 1.2 }}>
                    <div style={{ font: "600 12.5px Poppins", color: "#3A3A42", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.displayName || user?.email}</div>
                    <div
                      className="relative flex items-center gap-1 mt-[1px] w-max"
                      style={{ font: "500 10.5px Poppins", color: "#8a8a90" }}
                      onClick={(e) => { e.stopPropagation(); setShowFlags(!showFlags); }}
                    >
                      <span>{optionSelect?.value === 'en' ? 'English' : 'Español'}</span>
                      {showFlags && (
                        <ClickAwayListener onClickAway={() => setShowFlags(false)}>
                          <div className="bg-white w-max h-max absolute left-0 top-full mt-1 z-[70] border border-gray-200 rounded-lg flex flex-col shadow-md" onClick={(e) => e.stopPropagation()}>
                            <ul className="w-full cursor-pointer text-gray-900 text-xs py-1">
                              {idiomaArray.map((elem, idx) => (
                                <li key={idx} onClick={(e) => { e.stopPropagation(); setOptionSelect(elem); setShowFlags(false); }} className="px-4 py-1.5 hover:bg-gray-100">
                                  <span className="text-gray-700">{elem.value === 'en' ? 'English' : 'Español'}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </ClickAwayListener>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-10 h-10">
                  <ImageAvatar user={user} disabledTooltip />
                </div>
              )
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
            {studio ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.2}><path d="M6 9l6 6 6-6" /></svg>
            ) : (
              <ArrowDownBodasIcon className="w-5 h-5 rotate-90 transform text-black" />
            )}
          </div>
        </ClickAwayListener>
        {!studio && <div onClick={() => { setShowFlags(!showFlags) }} className=" flex items-center cursor-pointer" >
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
        </div>}
      </div>
      {/* Modal ObtenerFullAcceso eliminado — el botón ahora navega a /facturacion directamente */}
    </>
  );
};

export default Profile;
