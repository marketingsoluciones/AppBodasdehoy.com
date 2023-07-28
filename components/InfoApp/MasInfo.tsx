import { Card } from "./MicroComponente/Card"
import { InfoGrid } from "./MicroComponente/InfoGrid"

export const MasInfo = () => {

    const DataCards = [
        {
            title: "Wedding Planners y Organizadores de Eventos",
            texto: "Aborda cada detalle de tu planificación desde una sola herramienta.",
            button: "Crea evento",
            router: "/"
        },
        {
            title: "Especialitas en Catering",
            texto: "Interactúa con la lista de invitados para distribuir el menú y conocer los alérgenos o preferencias",
            button: "Crea evento",
            router: "/"
        },
    ]

    const DataGrid = [
        {
            title: "Fotografía y Social Media",
            texto: "Comparte las fotografías y videos. Tus invitados pueden compartir sus mejores momentos.",
            button: "ver más",
            router: "/",
        },
        {
            title: "Gestiona tu presupuesto",
            texto: "Registra cada movimiento. Precios, cotizaciones, facturas, presupuesto global del evento.",
            button: "ver más",
            router: "/",
        },
        {
            title: "Invitados e Invitaciones",
            texto: "Diseña y envía las invitaciones. Confirma asistencia y accesos directos a la lista de regalos.",
            button: "ver más",
            router: "/",
        },

    ]

    return (
        <>
            <div className="space-y-20 font-display">
                <Card DataCards={DataCards} />
                <InfoGrid DataGrid={DataGrid} />
            </div>
        </>
    )
}