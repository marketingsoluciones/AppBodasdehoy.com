import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider } from "../../context"
import { GoX } from "react-icons/go";

export const ObtenerFullAcceso = () => {
    const { actionModals, setActionModals } = AuthContextProvider()

    const FullAccesoImgs = [
        {
            titulo: "Obten full acceso a las funciones para Crear tus Itinerarios",
            descripcion:"Haz que tu día especial sea perfecto con nuestro itinerario de boda, diseñado para que cada momento sea inolvidable y sin estrés. Obteniendo Actualizacion en tiempo real, Recordatorios, Compartir con invitados y diversas integraciones",
            img: "/FullAcceso/invitaciones.png",
            alt: "Itinerario"
        },
        {
            titulo: "Obten full acceso a las funciones para crear tus eventos",
            descripcion:"Planificar una boda nunca ha sido tan sencillo y emocionante. Descubre las ventajas de utilizar nuestro software de bodas y transforma tu día especial en una experiencia inolvidable. Con Planificacion Integral, Personalizacion Completa, Gestion de invitados entre otros ",
            img: "/FullAcceso/resumen.png",
            alt: "Eventos"
        },
        {
            titulo: "Obten full acceso a las funciones para tus Invitaciones",
            descripcion:"",
            img: "/FullAcceso/invitaciones.png",
            alt: "invitaciones"
        },
        {
            titulo: "Obten full acceso a las funciones para tu Presupuesto",
            descripcion:"",
            img: "/FullAcceso/presupuesto.png",
            alt: "presupuesto"
        },
        {
            titulo: "Obten full acceso a las funciones para crear tus Listas de Regalos",
            descripcion:"",
            img: "/FullAcceso/mesas.png",
            alt: "Lista de regalos"
        },
        {
            titulo: "Obten full acceso a las funciones para tus Planos",
            descripcion:"",
            img: "/FullAcceso/mesas.png",
            alt: "mesas"
        },
        {
            titulo: "Obten full acceso a las funciones para Crear tus Invitados",
            descripcion:"",
            img: "/FullAcceso/invitados.png",
            alt: "invitados"
        },
    ]

    return (
        <div className="p-4 overflow-y-auto h-full space-y-5 relative">
            <div onClick={() => setActionModals(!actionModals)} className="absolute right-10 cursor-pointer">
                <GoX className="w-6 h-6 transition hover:rotate-180" />
            </div>
            <div className="space-y-5">
                <h1 className="text-center text-primary text-[20px]">Obten full acceso a todas las funcionalidades</h1>
                <p className=" text-[13px] px-5">Para crear un evento completo y bien planificado con el acceso completo de las funcionalidades de la aplicacion, que te permita crear los eventos que desees, crear una lista con la cantidad de invitados que quieras, llevar un control de gastos, una planificacion detallada de la ubicacion del evento, enviar invitaciones automaticas y ademas crear tu lista de regalos soñada.</p>
            </div>
            <div className="bg-slate-100 -mx-4 py-10 space-y-5">
                <p className=" text-[13px] px-9">Los beneficios son innumerables, pero no dejes que te lo cuenten. <span className="text-primary cursor-pointer text-[15px] "> Obten el ful acceso ya. </span> </p>
                <div className="grid grid-cols-2  items-center justify-items-center">
                    {
                        FullAccesoImgs.map((item, idx) => (
                            <img key={idx} className="h-auto w-[50%]" src={item.img} alt={item.alt} />
                        ))
                    }
                </div>
            </div>
            <div className="flex  justify-center py-4">
                <button className="bg-primary text-white py-1 px-3 rounded-lg">Obtener full acceso</button>
            </div>
        </div>

    )
}