import Link from "next/link"
import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider } from "../../context"
import { InvitacionesIcon, InvitadosIcon, ListaRegalosIcon, MesasIcon, MisEventosIcon, PresupuestoIcon } from "../icons"

const Sidebar = ({  set , state }) => {
    const { user } = AuthContextProvider()

    const ListaNavbar = [
        { title: "Mis eventos", icon: <MisEventosIcon className="w-6 h-6" />, route: "/" },
        { title: "Invitados", icon: <InvitadosIcon className="w-6 h-6" />, route: "/invitados" },
        { title: "Mesas", icon: <MesasIcon className="w-6 h-6" />, route: "/mesas" },
        { title: "Lista", icon: <ListaRegalosIcon className="w-6 h-6" />, route: "/lista-regalos" },
        { title: "Presupuesto", icon: <PresupuestoIcon className="w-6 h-6" />, route: "/presupuesto" },
        { title: "Invitaciones", icon: <InvitacionesIcon className="w-6 h-6" />, route: "/invitaciones" }
    ]
    return (
        <ClickAwayListener onClickAway={() => state ? set(false) : set(true) }>
            <div className={`w-2/3 pl-4 opacity-95 z-50 bg-white shadow-lg fixed top-0 left-0 h-screen md:hidden transform transition duration-300 ${state ? "translate-x-0" : "-translate-x-full"}`}>
                <p className="py-4 font-display text-sm text-gray-500">{user?.displayName}</p>
                <ul className="flex flex-col ">
                    {ListaNavbar.map((item, idx) => (
                        // eslint-disable-next-line @next/next/link-passhref
                        <Link key={idx} href={item.route}>
                            <li onClick={() => set(!state)} className="flex text-primary gap-3 py-3 font-display text-md items-center justify-start w-full cursor-pointer hover:text-gray-300 transition ">{item.icon}  {item.title}</li>
                        </Link>
                    ))}
                </ul>
                <p className="text-xs text-primary font-display font-bold absolute h-max bottom-20 mx-auto w-max inset-x-0">Bodasdehoy.com</p>
            </div>
        </ClickAwayListener>
    )
}

export default Sidebar
