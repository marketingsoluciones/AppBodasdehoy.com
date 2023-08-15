import Link from "next/link"
import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, LoadingContextProvider } from "../../context"
import { ArrowLeft, Icon036Profile, IconExit, IconLightBulb16, IconLogin, IconRegistered, IconShop, InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons"
import { useToast } from "../../hooks/useToast"
import { capitalize } from "../../utils/Capitalize"
import { Tooltip } from "./Tooltip"
import { useEffect } from "react"
import router, { useRouter } from "next/router";
import Cookies from "js-cookie"
import { getAuth, signOut } from "firebase/auth"

/* menu desplegable izquierdo en la vista movil con las opciones de redireccion de la app */
const Sidebar = ({ setShowSidebar, showSidebar }) => {
    const { setLoading } = LoadingContextProvider()
    const { user, config } = AuthContextProvider()
    const { event } = EventContextProvider()
    const { eventsGroup } = EventsGroupContextProvider()

    const { route } = useRouter()
    const toast = useToast()

    useEffect(() => {
        console.log(10002, eventsGroup)
        console.log(6000251, config, user)
    }, [eventsGroup])

    useEffect(() => {

    }, [config])


    const ListaNavbar = [
        {
            title: "Ir al directorio",
            icon: <IconShop className="w-6 h-6" />,
            onClick: async () => { router.push(config?.pathDirectory) },
            user: config?.pathDirectory ? "all" : null
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
            icon: <div className="bg-primary h-1 w-[240px] flex" />,
            user: eventsGroup?.length > 0 ? "all" : null
        },
        {
            title: "Perfil",
            icon: <Icon036Profile className="w-7 h-7" />,
            onClick: () => {
                router.push(config?.pathDirectory)
            },
            user: "loged"
        },
        {
            title: "Iniciar sesión",
            icon: <IconLogin className="w-6 h-6" />,
            onClick: () => {
                router.push(config?.pathLogin ? `${config?.pathLogin}?d=app` : `/login?d=${route}`)
            },
            user: "guest"
        },
        {
            title: "Registro",
            icon: <IconRegistered className="w-6 h-6" />,
            onClick: () => {
                router.push(config?.pathLogin ? `${config?.pathLogin}?d=app&q=register` : `/login?q=register&d=${route}`)
            },
            user: "guest"
        },
        {
            title: "Cerrar sesión",
            icon: <IconExit className="w-6 h-6" />,
            onClick: () => {
                console.log(600021, config, config?.domain)
                Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
                Cookies.remove("idToken", { domain: config?.domain ?? "" });
                signOut(getAuth());
                router.push(config?.pathDirectory ? `${config?.pathDirectory}/signout?end=true` : "/")
                setTimeout(() => {
                    setLoading(false)
                }, 600);
            },
            user: "loged"
        }
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
        <div className={`bg-white w-5/6 opacity-95 z-50 font-display shadow-lg fixed top-0 left-0 h-screen md:hidden transform transition duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
            <ArrowLeft className="absolute w-6 h-6 text-white cursor-pointer translate-x-5 translate-y-5" onClick={() => setShowSidebar(!showSidebar)} />
            <div className="bg-primary h-[160px] flex flex-col  items-center justify-center text-sm text-gray-500">
                <img
                    src={user?.photoURL ?? "/placeholder/user.png"}
                    className="object-cover w-16 h-16 rounded-full"
                    alt={user?.displayName}
                />

                <p className="text-lg text-white capitalize pt-2">
                    {user?.displayName !== "guest" && user?.displayName?.toLowerCase()}
                </p>
            </div>
            <Tooltip label="Primero debes crear un evento" icon={<IconLightBulb16 className="w-6 h-6" />} disabled={!!event?._id}>
                <ul className="flex flex-col pl-6 pt-2">
                    {ListaNavbarFilter.map((item, idx) => (
                        // eslint-disable-next-line @next/next/link-passhref
                        <li
                            key={idx}
                            onClick={(e) => { handleOnClip(e, item) }}
                            className="flex text-primary  py-2 font-display text-md items-center justify-start w-full cursor-pointer hover:text-gray-300 transition ">
                            <button className="flex gap-3" >{item.icon} {item.title && capitalize(item.title)}</button>
                        </li>
                    ))}
                </ul>
            </Tooltip>
            <p className="text-xs text-primary font-bold absolute h-max bottom-20 mx-auto w-max inset-x-0">Bodasdehoy.com</p>
        </div>
    )
}

export default Sidebar
