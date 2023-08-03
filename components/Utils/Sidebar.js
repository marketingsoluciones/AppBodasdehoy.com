import Link from "next/link"
import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider, EventContextProvider } from "../../context"
import { ArrowLeft, Icon036Profile, IconExit, IconLightBulb16, IconLogin, IconRegistered, IconShop, InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon, ResumenIcon } from "../icons"
import { useToast } from "../../hooks/useToast"
import { capitalize } from "../../utils/Capitalize"
import { Tooltip } from "./Tooltip"
import { useEffect } from "react"
import { useRouter } from "next/router"

/* menu desplegable izquierdo en la vista movil con las opciones de redireccion de la app */
const Sidebar = ({ setShowSidebar, showSidebar }) => {
    const { user } = AuthContextProvider()
    const { event, config } = EventContextProvider()
    const router = useRouter();
    const toast = useToast()


    const ListaNavbar = [
        {
            title: "Ir al directorio",
            icon: <IconShop className="w-6 h-6" />,
            onClick: async () => { router.push(`${config?.pathDirectory}/login?d=app&q=register`) },
            user: "all"
        },
        {
            title: "Mis eventos",
            icon: <MisEventosIcon className="w-6 h-6" />,
            onClick: async () => { router.push(`/`) },
            user: "loged"
        },
        {
            title: "Resumen",
            icon: <ResumenIcon className="w-6 h-6" />,
            onClick: async () => { router.push(`/resumen-evento`) },
            user: "loged"
        },
        {
            title: "Invitados",
            icon: <InvitadosIcon className="w-6 h-6" />,
            onClick: async () => { router.push(`/invitados`) },
            user: "loged"
        },
        {
            title: "Mesas",
            icon: <MesasIcon className="w-6 h-6" />,
            onClick: async () => { router.push(`mesas`) },
            user: "loged"
        },
        {
            title: "Lista de regalos",
            icon: <ListaRegalosIcon className="w-6 h-6" />,
            ronClick: async () => { router.push(`lista-regalos`) },
            user: "loged"
        },
        {
            title: "Presupuesto",
            icon: <PresupuestoIcon className="w-6 h-6" />,
            onClick: async () => { router.push(`presupuesto`) },
            user: "loged"
        },
        {
            title: "Invitaciones",
            icon: <InvitacionesIcon className="w-6 h-6" />,
            onClick: async () => { router.push(`$invitaciones`) },
            user: "loged"
        },
        {
            title: "Perfil",
            icon: <Icon036Profile className="w-7 h-7" />,
            onClick: async () => { router.push(process.env.NEXT_PUBLIC_DIRECTORY) },
            user: "loged"
        },
        {
            title: "Iniciar sesión",
            icon: <IconLogin className="w-6 h-6" />,
            onClick: async () => { router.push(`${config?.pathDirectory}/login?d=app`) },
            user: "guest"
        },
        {
            title: "Registro",
            icon: <IconRegistered className="w-6 h-6" />,
            onClick: async () => { router.push(`${config?.pathDirectory}/login?d=app&q=register`) },
            user: "guest"
        },
        {
            title: "Cerrar sesión",
            icon: <IconExit className="w-6 h-6" />,
            onClick: async () => {
                Cookies.remove("sessionBodas", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "" });
                Cookies.remove("idToken", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "" });
                await signOut(getAuth());
                router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/signout?end=true` ?? "")
            },
            user: "loged"
        }
    ]
    const valirUser = user?.displayName == "guest" ? "guest" : "loged"
    const ListaNavbarFilter = ListaNavbar.filter(elem => elem?.user === valirUser || elem?.user === "all")



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
                            //onClick={() => { event ? set(!showSidebar) : toast("error", "Debes crear un evento") }}
                            className="flex text-primary  py-2 font-display text-md items-center justify-start w-full cursor-pointer hover:text-gray-300 transition ">
                            <button className="flex gap-3" onClick={item?.onClick}>{item.icon} {item.title && capitalize(item.title)}</button>
                        </li>
                    ))}
                </ul>
            </Tooltip>
            <p className="text-xs text-primary font-bold absolute h-max bottom-20 mx-auto w-max inset-x-0">Bodasdehoy.com</p>
        </div>
    )
}

export default Sidebar
