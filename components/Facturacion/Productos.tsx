import { useState } from "react"
import ClickAwayListener from "react-click-away-listener"
import { ExclamacionIcon } from "../icons"


export const Productos = ({ data, setProducts, products }) => {


    const options: object = {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
    }
    

    return (
        <div className="space-y-5 pb-5">
            {data?.map((item: any, idx: any) => {
                const status = !!item?.subscriptionId
                    ? new Date().getTime() < new Date(item?.current_period_end).getTime()
                        ? "ACTIVO"
                        : "SUPENDIDO"
                    : "ACTIVO"
                return (
                    <div key={idx} className="bg-white flex flex-col md:flex-row rounded-lg md:h-max md:p-3 p-10 gap-5 md:gap-0 md:space-x-3 items-center justify-center ">
                        <div className="bg-gray-200 flex items-center w-32 justify-center rounded-lg">
                            <img
                                src={item.images.length > 0 ? item?.images[0] : "/placeholder/image.png"}
                                alt={item.name}
                                className="rounded-lg object-contain w-[70px] h-[70px]"
                            />
                        </div>
                        <div className="flex-1 md:border-r-2 h-full capitalize flex flex-col justify-center">
                            <div className="text-[22px]">
                                {item.name}
                            </div>
                            <div className="text-[13px] text-gray-500">
                                {item.description}
                            </div>
                            <div className="grid grid-cols-3 mt-1">
                                {item?.metadata?.caracteristica?.split(", ").map((el: any, idx: any) => {
                                    return <InfoModulos key={idx} item={el} />
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col w-36 md:h-full h-[75px] items-center justify-center capitalize">
                            {item.usage
                                ? <div className={`${status.toLowerCase() === "activo" ? "bg-green" : "bg-orange-300"} flex w-full h-11 rounded-lg items-center justify-center relative`}>
                                    <span style={{ userSelect: "none" }} className="text-[16px] font-semibold text-white">
                                        {status}
                                    </span>
                                    {!!item?.subscriptionId && <span className="text-gray-600 text-xs absolute -bottom-4 ">
                                        {`${new Date(item?.current_period_start).toLocaleDateString(undefined, options)} - ${new Date(item?.current_period_end).toLocaleDateString(undefined, options)}`}
                                    </span>}
                                </div>
                                : <>
                                    <div>
                                        {`${item?.prices[0]?.currency === "usd" ? "$" : "€"} ${(item?.prices[0]?.unit_amount / 100).toFixed(2)}`}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <button
                                            disabled={!item?.prices[0]?.currency}
                                            onClick={() => {
                                                const f1 = products.findIndex(elem => elem?.id === item?.id)
                                                if (f1 > -1) {
                                                    products.splice(f1, 1)
                                                    setProducts([...products])
                                                    return
                                                }
                                                products.push(item)
                                                setProducts([...products])
                                            }}
                                            className={`bg-primary py-1 w-full text-[13px] rounded-lg capitalize hover:opacity-90 cursor-pointer ${products?.findIndex(elem => elem?.id === item?.id) > -1 ? "bg-white border border-primary text-primary" : "bg-primary text-white"} `}>
                                            {products?.findIndex(elem => elem?.id === item?.id) > -1 ? "- Quitar complemento" : "+ Añadir complemento"}
                                        </button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const InfoModulos = ({ item }) => {
    const [showInfo, setShowInfo] = useState(false)
    return (
        < div className="text-azulCorporativo text-[13px] flex items-center  space-x-2 mb-0.5 cursor-default " >
            <ClickAwayListener onClickAway={() => setShowInfo(false)}>
                <div className="relative ">
                    {showInfo && <div className="bg-white w-[220px] top-5 left-5 border  border-primary rounded-lg p-2 shadow-lg text-[14px] absolute z-50">
                         {InfoItemsFacturation.find(elem => elem?.title === item)?.texto}
                    </div>}
                    <p className={`cursor-pointer ${showInfo ? "text-primary" : ""}`} onClick={() => setShowInfo(true)}>
                        <ExclamacionIcon />
                    </p>
                </div>
            </ClickAwayListener>
            <p>
                {item}
            </p>
        </div>
    )
}

export const InfoItemsFacturation = [

    {
      /* el include sera la clave para que se visualice con stripe */
      include:"visor-eventos",
      title: "Visor de eventos",
      texto: "Visualiza tus eventos o crea nuevos para empezar a organizar."
    },
    {
      title: "Carta de productos",
      texto: "Añade tus platos y bebidas para crear tu carta de productos y utilizarlos en tus menús."
    },
    {
      title: "Plantilla del menú",
      texto: "Crea tus propias plantillas de menú y genera tu propia base adaptable para todos tus eventos."
    },
    {
      title: "Menú del evento",
      texto: "Asigna a cada uno de tus eventos un menú y organizalo según las necesidades de tus clientes. "
    },
    {
      title: "Confirmación",
      texto: "Envia a la lista de invitados un mensaje de reconfirmación de asistencia, alérgenos y plato seleccionado. "
    },
    {
      title: "Lista de invitados",
      texto: "Lleva el control de la lista de invitados de tus eventos, la mesa asignada y confirmación de asistencia."
    },
    {
      title: "Visor de itinerario",
      texto: "Visualiza el intinerario de cada evento para conocer las horas y tareas de cada responsable.  "
    },
    {
      title: "Chat en línea",
      texto: "Ten contacto en tiempo real con invitados, organizadores y profesionales de cada evento."
    },
    {
      title: "Contactos",
      texto: "Crea tu lista de contactos de personas/empresas y centralizalas en un sólo lugar. "
    },
    {
      title: "Calendario",
      texto: "Agenda tus citas, eventos, programa tus reuniones  en tu calendario sincronizado."
    },
    {
      title: "Enviar invitaciones",
      texto: "Envia las invitaciones del evento por email. SMS o whatsapp en forma simultanea y confirma la asistencia al evento."
    },
    {
      title: "Presupuesto",
      texto: "Gestiona el presupuesto según evento y lleva el control del costo y pagos realizados."
    },
    {
      title: "Crea itinerarios",
      texto: "Crea el itinerario, ordenando tareas y asignado responsables según el evento."
    },
    {
      title: "Planos del evento",
      texto: "Asigna a cada uno de tus eventos un plano y diseña la distribución del salón, mobiliario, proveedores e invitados."
    },
    {
      title: "Colecciones",
      texto: "Publica las colecciones de fotos y videos de tus eventos con link de descarga."
    },
    {
      title: "Proyectos",
      texto: "Organiza tus proyectos según evento y ordena en un sólo lugar contrato, cuestionarios y facturas."
    },
    {
      title: "Diseño de invitaciones",
      texto: "Obtén un diseño de invitacion personalizado de nuestro marketplace."
    },
    {
      title: "Plantilla del salón",
      texto: "Crea plantillas de los planos de tus salones para reutilizar en tus eventos y añadir a la versión novios."
    }
  ]