import { AuthContextProvider, EventsGroupContextProvider, LoadingContextProvider } from "../../context"
import { ArrowLeft, CompanyIcon, CorazonPaddinIcon, Icon036Profile, IconExit, IconRegistered, IconShop, InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, LugaresBodas, MesasIcon, MisEventosIcon, Posts, PresupuestoIcon, ResumenIcon, FotografoMenu, WeddingPlanner, Catering } from "../icons"
import { useToast } from "../../hooks/useToast"
import { capitalize } from "../../utils/Capitalize"
import { useEffect } from "react"
import router, { useRouter } from "next/router";
import Cookies from "js-cookie"
import { getAuth, signOut } from "firebase/auth"
import { RiLoginBoxLine } from "react-icons/ri"
import { PiUserPlusLight } from "react-icons/pi"
import { BiBell } from "react-icons/bi";
import { MdLogout } from "react-icons/md";
import { TbWorldWww } from "react-icons/tb";

/* menu desplegable izquierdo en la vista movil con las opciones de redireccion de la app */
const Sidebar = ({ setShowSidebar, showSidebar }) => {
    const { setLoading } = LoadingContextProvider()
    const { user, config } = AuthContextProvider()
    const { eventsGroup } = EventsGroupContextProvider()

    const { route } = useRouter()
    const toast = useToast()

    const ListaNavbar = [
        {
            title: "Iniciar sesión",
            icon: <RiLoginBoxLine className="w-6 h-6" />,
            onClick: () => {
                router.push(config?.pathLogin ? `${config?.pathLogin}?d=app` : `/login?d=${route}`)
            },
            user: "guest"
        },
        {
            title: "Registrarse",
            icon: <PiUserPlusLight className="w-6 h-6" />,
            onClick: () => {
                router.push(config?.pathLogin ? `${config?.pathLogin}?d=app&q=register` : `/login?q=register&d=${route}`)
            },
            user: "guest"
        },
        {
            title: "Mis empresas",
            icon: <CompanyIcon className="w-6 h-6" />,
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push((user?.role?.includes("empresa")) ? path ?? "" : config?.pathLogin ? `${config?.pathDirectory}/info-empresa?d=app` : `/login?d=${route}`)
            },
            user: config?.pathDirectory ? "all" : null
        },
        {
            title: "Mis publicaciones",
            icon: <Posts className="w-6 h-6" />,
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                const pathEnd = `${window.origin.includes("://test.") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}/InfoPage/publicaciones`
                router.push((user?.displayName !== "guest") ? `${path}/InfoPage/publicaciones` ?? "" : config?.pathLogin ? `${config?.pathLogin}?d=app&end=${pathEnd}` : `/login?d=${route}`)
            },
            user: config?.pathDirectory ? "all" : null
        },
        {
            title: "Mis proveedores",
            icon: <CorazonPaddinIcon className="w-6 h-6 text-primary" />,
            onClick: async () => { router.push(config?.pathDirectory) },
            user: config?.pathDirectory ? "all" : null
        },
        {
            title: "",
            icon: <div className="bg-primary h-[1px] w-[240px] flex" />,
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Mis eventos",
            route: "/",
            icon: <MisEventosIcon className="w-6 h-6" />,
            onClick: async () => { router.push(`/`) },
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Resumen",
            route: "/resumen-evento",
            icon: <ResumenIcon className="w-6 h-6" />,
            onClick: () => {
                router.push(`/resumen-evento`)
            },
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Invitados",
            route: "/invitados",
            icon: <InvitadosIcon className="w-6 h-6" />,
            onClick: () => {
                router.push(`/invitados`)
            },
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Mesas",
            route: "",
            icon: <MesasIcon className="w-6 h-6" />,
            onClick: () => {
                router.push(`/mesas`)
            },
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Lista de regalos",
            route: "/lista-regalos",
            icon: <ListaRegalosIcon className="w-6 h-6" />,
            onClick: () => {
                router.push(`/lista-regalos`)
            },
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Presupuesto",
            route: "/presupuesto",
            icon: <PresupuestoIcon className="w-6 h-6" />,
            onClick: () => {
                router.push(`presupuesto`)
            },
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Invitaciones",
            route: "/invitaciones",
            icon: <InvitacionesIcon className="w-6 h-6" />,
            onClick: () => {
                router.push(`invitaciones`)
            },
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "",
            icon: <div className="flex flex-col justify-start items-start">
                <div className="bg-primary h-[1px] w-[240px] flex" />
                <span className="mt-2 -mb-2">Módulos</span>
            </div>,
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Lugares para bodas",
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/lugaresBodas`)
            },
            icon: <LugaresBodas />,
            user: "all",
        },
        {
            title: "Catering de bodas",
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/cateringBodas`)
            },
            icon: <Catering />,
            user: "all",
        },
        {
            title: "Wedding Planner",
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/weddingPlanner`)
            },
            icon: <WeddingPlanner />,
            user: "all",
        },
        {
            title: "Fotografos",
            icon: <FotografoMenu />,
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/fotografo`)
            },
            user: "all",
        },
        {
            title: "Mi Web Creador",
            icon: <TbWorldWww className="w-5 h-5" />,
            onClick: async () => {
                const path = `${window.origin.includes("://test") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS}`
                router.push(`${path}/webCreator`)
            },
            user: "all",
        },
        // {
        //     title: "Perfil",
        //     icon: <Icon036Profile className="w-7 h-7" />,
        //     onClick: () => {
        //         router.push(config?.pathPerfil)
        //     },
        //     user: "loged"
        // },

        // {
        //     title: "Cerrar sesión",
        //     icon: <MdLogout className="w-6 h-6" />,
        //     onClick: () => {
        //         Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
        //         Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
        //         signOut(getAuth());
        //         router.push(config?.pathDirectory ? `${config?.pathDirectory}/signout?end=true` : "/")
        //         setTimeout(() => {
        //             setLoading(false)
        //         }, 600);
        //     },
        //     user: "loged"
        // }
    ]
    const valirUser = user?.displayName == "guest" ? "guest" : "loged"
    const ListaNavbarFilter = ListaNavbar.filter(elem => elem?.user === valirUser || elem?.user === "all")

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
            <div className="bg-white w-full h-[calc(100%-205px)] overflow-auto">
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
            </div>
            {/* </Tooltip> */}
            <p className="text-xs text-primary font-bold absolute h-max bottom-3 mx-auto w-max inset-x-0">Bodasdehoy.com</p>
        </div>
    )
}

export default Sidebar
