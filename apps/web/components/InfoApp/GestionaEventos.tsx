import { GestionEventosItems } from "./MicroComponente/GestionEventosItems"
import { useTranslation } from 'react-i18next';


export const GestionaEventos = () => {
    const { t } = useTranslation();

    const DataObject = [
        {
            img: "/anillos.png",
            alt: "bodas",
            texto: t("wedding")
        },
        {
            img: "/comunion.png",
            alt: "comunion",
            texto: t("firstcommunion")
        },
        {
            img: "/birrete.png",
            alt: "graduacion",
            texto: t("graduation")
        },
        {
            img: "/coche.png",
            alt: "babyShower",
            texto: t("babyshower")
        },
        {
            img: "/globo.png",
            alt: "Globos",
            texto: t("birthday")
        },
        {
            img: "/boleto.png",
            alt: "evento corporativo",
            texto: t("corporateevents")
        },
    ]

    return (
        <>
            <div className="flex flex-col justify-center items-center pt-16 md:pt-10 font-display px-10 md:px-0">
                <p className="md:text-4xl text-2xl text-center text-secondaryOrg">{t("manageyourevents")}</p>
                <p className="md:text-2xl text-secondaryOrg">{t("manycelebrations")}</p>
                <div className="">
                    <GestionEventosItems DataObject={DataObject} />
                </div>
            </div>
        </>
    )
}