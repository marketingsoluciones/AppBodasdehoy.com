import Link from "next/link"
import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider, EventContextProvider } from "../../context"
import { InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon } from "../icons"
import { useToast } from "../../hooks/useToast"

const Sidebar = ({ set, state }) => {
    const { user } = AuthContextProvider()
    const { event } = EventContextProvider
    const toast = useToast()

    const ListaNavbar = [
        {
            title: "Mis eventos",
            icon: <MisEventosIcon className="w-6 h-6" />,
            route: "/",
            condicion: event?._id ? "verdadero" : "falso"
        },
        {
            title: "Invitados",
            icon: <InvitadosIcon className="w-6 h-6" />,
            route: event?._id ? "/invitados" : "/",
            condicion: event?._id ? "verdadero" : "falso"
        },
        {
            title: "Mesas",
            icon: <MesasIcon className="w-6 h-6" />,
            route: event?._id ? "/mesas" : "/",
            condicion: event?._id ? "verdadero" : "falso"
        },
        {
            title: "Lista",
            icon: <ListaRegalosIcon className="w-6 h-6" />,
            route: event?._id ? "/lista-regalos" : "/",
            condicion: event?._id ? "verdadero" : "falso"
        },
        {
            title: "Presupuesto",
            icon: <PresupuestoIcon className="w-6 h-6" />,
            route: event?._id ? "/presupuesto" : "/",
            condicion: event?._id ? "verdadero" : "falso"
        },
        {
            title: "Invitaciones",
            icon: <InvitacionesIcon className="w-6 h-6" />,
            route: event?._id ? "/invitaciones" : "/",
            condicion: event?._id ? "verdadero" : "falso"
        }
    ]
    return (
        <ClickAwayListener onClickAway={() => state ? set(true) : false}>
            <div className={`w-2/3 pl-4 opacity-95 z-50 bg-white shadow-lg fixed top-0 left-0 h-screen md:hidden transform transition duration-300 ${state ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex justify-between  font-display text-sm text-gray-500">
                    <p className="py-4">{user?.displayName}</p>
                    <p onClick={() => set(!state)} className="text-2xl pr-5 py-3">x</p>
                </div>
                <ul className="flex flex-col ">
                    {ListaNavbar.map((item, idx) => (
                        // eslint-disable-next-line @next/next/link-passhref
                        <Link key={idx} href={item.route}>
                            <li onClick={() => {item.condicion==="verdadero"?set(!state):toast("error","Debes crear un evento")                    
                  }} className="flex text-primary gap-3 py-3 font-display text-md items-center justify-start w-full cursor-pointer hover:text-gray-300 transition ">{item.icon}  {item.title}</li>
                        </Link>
                    ))}
                </ul>
                <p className="text-xs text-primary font-display font-bold absolute h-max bottom-20 mx-auto w-max inset-x-0">Bodasdehoy.com</p>
            </div>
        </ClickAwayListener>
    )
}

export default Sidebar
