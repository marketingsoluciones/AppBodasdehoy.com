import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider } from "../../context"
import { GoX } from "react-icons/go";
import { useRouter } from "next/router";

export const ObtenerFullAcceso = () => {
    const router = useRouter()
    const { actionModals, setActionModals } = AuthContextProvider()
    const DataInfoModulos = [
        {
            titulo: "Obten full acceso a las funciones para Crear tus Itinerarios",
            descripcion: "Haz que tu día especial sea perfecto con nuestro itinerario de boda, diseñado para que cada momento sea inolvidable y sin estrés. Obteniendo Actualizacion en tiempo real, Recordatorios, Compartir con invitados y diversas integraciones",
            img: "/FullAcceso/invitaciones.png",
            alt: "/Itinerario",
            estado: false
        },
        {
            titulo: "Obten full acceso a las funciones para crear tus eventos",
            descripcion: "Planificar una boda nunca ha sido tan sencillo y emocionante. Descubre las ventajas de utilizar nuestro software de bodas y transforma tu día especial en una experiencia inolvidable. Con Planificacion Integral, Personalizacion Completa, Gestion de invitados entre otros ",
            img: "/FullAcceso/resumen.png",
            alt: "/Eventos",
            estado: true
        },
        {
            titulo: "Obten full acceso a las funciones para tus Invitaciones",
            descripcion: "Las invitaciones a tus eventos son una parte importante para tu planificacion, obten todas las funcionalidades y accesos que ter brinda esta herramienta.",
            img: "/FullAcceso/invitaciones.png",
            alt: "/invitaciones",
            estado: false
        },
        {
            titulo: "Obten full acceso a las funciones para tu Presupuesto",
            descripcion: "Llevar un control de tu presupuesto puede lograr que un evento sea excitoso y facil de planificar, deja que la herramienta calcule por ti tus actividades.",
            img: "/FullAcceso/presupuesto.png",
            alt: "/presupuesto",
            estado: false
        },
        {
            titulo: "Obten full acceso a las funciones para crear tus Listas de Regalos",
            descripcion: "La lista de regalos sera de gran utulidad para tus invitados en los eventos, dale la oportunidad de saber que deseas o simplemente que te depositen",
            img: "/FullAcceso/mesas.png",
            alt: "/Lista de regalos",
            estado: false
        },
        {
            titulo: "Obten full acceso a las funciones para tus Planos",
            descripcion: "Llevar el croqui de tus eventos nunca fue mas facil que con nuestro planificador, visualiza, crea, customisa, comparte y planifica cada detalle del espacio de tu evento.",
            img: "/FullAcceso/mesas.png",
            alt: "/mesas",
            estado: true
        },
        {
            titulo: "Obten full acceso a las funciones para Crear tus Invitados",
            descripcion: "Tus invitados son la pieza fundamental de tu evento, crea tu lista de invitados sin limitaciones con menus perzonalizados y grupos de invitados de tu preferencia",
            img: "/FullAcceso/invitados.png",
            alt: "/invitados",
            estado: true
        },
    ]
    const objetoEncontrado = DataInfoModulos?.find(objeto => objeto?.alt === router?.asPath);


    return (
        <div className="p-4 overflow-y-auto h-full space-y-5 relative">
            <div onClick={() => setActionModals(!actionModals)} className="absolute right-10 cursor-pointer">
                <GoX className="w-6 h-6 transition hover:rotate-180" />
            </div>

            <div className="space-y-5">
                <h1 className="text-center text-primary text-[20px]">{objetoEncontrado?.titulo}</h1>
                <p className=" text-[13px] px-5">{objetoEncontrado?.descripcion}</p>
            </div>
            <div className="bg-slate-100 -mx-4 py-10 space-y-5">
                <p className=" text-[13px] px-9">Los beneficios son innumerables, pero no dejes que te lo cuenten. <span className="text-primary cursor-pointer text-[15px] "> Obten el ful acceso ya. </span> </p>
                <div className="flex items-center justify-center">
                    <img className="h-auto w-[40%]" src={objetoEncontrado?.img} alt={objetoEncontrado?.alt} />
                </div>
            </div>
            <div className="flex  justify-center py-4">
                {
                    objetoEncontrado.estado ?
                        <button onClick={() => router.push("/facturacion")} className="bg-primary text-white py-1 px-3 rounded-lg">Obtener full acceso</button> :
                        <button className="bg-primary text-white py-1 px-3 rounded-lg">
                            <a target="blank" href="https://wa.me/34910603622">
                                Contactanos
                            </a>
                        </button>
                }
            </div>
        </div>
    )
}