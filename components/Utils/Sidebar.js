import { AuthContextProvider, EventsGroupContextProvider, LoadingContextProvider } from "../../context"
import { ArrowLeft, CompanyIcon, CorazonPaddinIcon, UserIcon, TarjetaIcon } from "../icons"
import { useToast } from "../../hooks/useToast"
import { capitalize } from "../../utils/Capitalize"
import router, { useRouter } from "next/router";
import { RiLoginBoxLine } from "react-icons/ri"
import { PiUserPlusLight } from "react-icons/pi"
import { MdLogout } from "react-icons/md";
import Cookies from "js-cookie";
import { useActivity } from "../../hooks/useActivity";
import { signOut, getAuth } from "firebase/auth";
import { useTranslation } from "react-i18next";

/* menu desplegable izquierdo en la vista movil con las opciones de redireccion de la app */
const Sidebar = ({ setShowSidebar, showSidebar }) => {
    const { setLoading } = LoadingContextProvider()
    const { user, config, setUser } = AuthContextProvider()
    const { eventsGroup } = EventsGroupContextProvider()
    const [updateActivity, updateActivityLink] = useActivity()
    const {t} = useTranslation()
    const { route } = useRouter()
    const toast = useToast()

    const ListaNavbar = [
        {
            title: "Iniciar sesión",
            icon: <RiLoginBoxLine className="w-6 h-6" />,
            onClick: () => {
                router.push(config?.pathLogin ? `${config?.pathLogin}?d=app` : `/login?d=${route}`)
            },
            development: ["bodasdehoy", "all"],
            user: "guest"
        },
        {
            title: "Registrarse",
            icon: <PiUserPlusLight className="w-6 h-6" />,
            onClick: () => {
                router.push(config?.pathLogin ? `${config?.pathLogin}?d=app&q=register` : `/login?q=register&d=${route}`)
            },
            development: ["bodasdehoy", "all"],
            user: "guest"
        },
        {
            title: "Mi perfil",
            icon: <UserIcon className="w-6 h-6 text-primary" />,
            onClick: async () => { config?.pathPerfil ? router.push(config?.pathPerfil) : router.push("/configuracion") },
            development: ["bodasdehoy", "all"],
            user: config?.pathDirectory ? "all" : null
        },
        {
            title: "Facturacion",
            icon: <TarjetaIcon className="w-6 h-6 text-primary" />,
            onClick: async () => { router.push("/facturacion") },
            development: ["bodasdehoy", "all"],
            user: config?.pathDirectory ? "all" : null
        },
        {
            title: "",
            icon: <div className="flex flex-col justify-start items-start">
                <div className="bg-primary h-[1px] w-[240px] flex" />
                <span className="mt-2 -mb-2">Nuestras Webs</span>
            </div>,
            development: ["bodasdehoy"],
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Ir a Bodasdehoy.com",
            icon: <CorazonPaddinIcon className="w-6 h-6 text-primary" />,
            onClick: async () => { router.push(config?.pathDirectory) },
            development: ["bodasdehoy"],
            user: config?.pathDirectory ? "all" : null
        },
        {
            title: "Ir a cms.Bodasdehoy.com",
            icon: <CompanyIcon className="w-6 h-6" />,
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push((user?.role?.includes("empresa")) ? path ?? "" : config?.pathLogin ? `${config?.pathDirectory}/info-empresa?d=app` : `/login?d=${route}`)
            },
            development: ["bodasdehoy"],
            user: config?.pathDirectory ? "all" : null
        },
        /* {
            title: "",
            icon: <div className="flex flex-col justify-start items-start">
                <div className="bg-primary h-[1px] w-[240px] flex" />
                <span className="mt-2 -mb-2">Módulos</span>
            </div>,
            development: ["bodasdehoy"],
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Lugares para bodas",
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/lugaresBodas`)
            },
            icon: <LugaresBodas />,
            development: ["bodasdehoy"],
            user: "all",
        },
        {
            title: "Catering de bodas",
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/cateringBodas`)
            },
            icon: <Catering />,
            development: ["bodasdehoy"],
            user: "all",
        },
        {
            title: "Wedding Planner",
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/weddingPlanner`)
            },
            icon: <WeddingPlanner />,
            development: ["bodasdehoy"],
            user: "all",
        },
        {
            title: "Fotografos",
            icon: <FotografoMenu />,
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/fotografo`)
            },
            development: ["bodasdehoy"],
            user: "all",
        },
        {
            title: "Mi Web Creador",
            icon: <TbWorldWww className="w-5 h-5" />,
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/webCreator`)
            },
            development: ["bodasdehoy"],
            user: "all",
        },*/
        /* {
            title: "Cerrar Sesión",
            icon: <CorazonPaddinIcon className="w-6 h-6 text-primary" />,
            onClick: async () => { router.push(config?.pathDirectory) },
            development: ["bodasdehoy", "all"],
            user: config?.pathDirectory ? "all" : null
        }, */
    ]
    const valirUser = user?.displayName == "guest" ? "guest" : "loged"
    const ListaNavbarFilter = ListaNavbar.filter(elem => { return (elem?.user === valirUser || elem?.user === "all") && (elem.development.includes(config?.development) || elem.development.includes("all")) })

    const handleOnClip = async (e, item) => {
        e.preventDefault();
        if (item?.onClick) {
            setShowSidebar(!showSidebar)
            await item?.onClick()
            await item?.route != route && setLoading(true)
        }
    }

    return (
        <div className={`bg-gray-200 flex flex-col w-5/6 opacity-95 z-[60] font-display shadow-lg h-full fixed top-0 left-0 md:hidden transform transition duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
            <ArrowLeft className="absolute w-6 h-6 text-white cursor-pointer translate-x-5 translate-y-5" onClick={() => setShowSidebar(!showSidebar)} />
            <div className="bg-primary h-[165px] flex flex-col  items-center justify-center text-sm text-gray-500 shadow-sm">
                <img
                    src={user?.photoURL ?? "/placeholder/user.png"}
                    className="object-cover w-16 h-16 rounded-full"
                    alt={user?.displayName}
                />

                <p className="text-lg text-white min-h-[36px] capitalize pt-2">
                    {user?.displayName !== "guest" && user?.displayName}
                </p>
            </div>
            {/* <Tooltip label="Primero debes crear un evento" icon={<IconLightBulb16 className="w-6 h-6" />} disabled={!!event?._id}> */}
            <div className="bg-white w-full h-[calc(100%-205px)] overflow-auto flex flex-col justify-between">
                <ul className="flex flex-col pl-6 pt-2">
                    {ListaNavbarFilter.map((item, idx) => (
                        // eslint-disable-next-line @next/next/link-passhref
                        <li
                            key={idx}
                            onClick={(e) => { handleOnClip(e, item) }}
                            className="flex text-primary py-2 font-display text-md items-center justify-start w-full cursor-pointer hover:text-gray-300 transition">
                            <button className="flex gap-3" >{item.icon} {item.title && capitalize(item.title)}</button>
                        </li>
                    ))}
                </ul>
                <ul className=" ">
                    <li
                        onClick={async () => {
                            setLoading(true)
                            updateActivity("logoutd")
                            updateActivityLink("logoutd")
                            Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
                            Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
                            signOut(getAuth()).then(() => {
                                if (["vivetuboda"].includes(config?.development)) {
                                    setUser()
                                    router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "/login")
                                    return
                                }
                                toast("success", t("loggedoutsuccessfully"))
                                router.push(config?.pathSignout ? `${config.pathSignout}?end=true` : "/")
                            })
                        }}
                        className="flex text-primary py-2 font-display text-md items-center justify-center w-full cursor-pointer hover:text-gray-300 transition">
                        <button className="flex gap-3" >
                            <MdLogout className="w-6 h-6 text-primary" />
                            {capitalize("Cerrar Sesion ")}
                        </button>
                    </li>
                </ul>
            </div>
            {/* </Tooltip> */}
            <p className="text-xs text-primary font-bold absolute h-max bottom-3 mx-auto w-max inset-x-0">Bodasdehoy.com</p>
        </div>
    )
}

export default Sidebar
