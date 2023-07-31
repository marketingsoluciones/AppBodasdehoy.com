import { GestionEventosItems } from "./MicroComponente/GestionEventosItems"


export const GestionaEventos = () => {

    const DataObject = [
        {
            img: "/anillos.png",
            alt: "bodas",
            texto: "Bodas"
        },
        {
            img: "/comunion.png",
            alt: "comunion",
            texto: "Primera Comunión"
        },
        {
            img: "/birrete.png",
            alt: "graduacion",
            texto: "Graduación"
        },
        {
            img: "/coche.png",
            alt: "babyShower",
            texto: "Baby Shower"
        },
        {
            img: "/globo.png",
            alt: "Globos",
            texto: "Cumpleaños"
        },
        {
            img: "/boleto.png",
            alt: "evento corporativo",
            texto: "Eventos corporativos"
        },
    ]

    return (
        <>
            <div className="flex flex-col justify-center items-center pt-16 md:pt-10 font-display px-10 md:px-0">
                <p className="md:text-4xl text-2xl text-center text-secondaryOrg">Gestiona tus eventos de forma gratuita </p>
                <p className="md:text-2xl text-secondaryOrg">Crea cuantas celebraciones desees:</p>
                <div className="">
                    <GestionEventosItems DataObject={DataObject} />
                </div>
            </div>
        </>
    )
}