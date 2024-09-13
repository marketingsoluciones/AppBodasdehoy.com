import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider } from "../../context"
import { GoX } from "react-icons/go";
import { useRouter } from "next/router";
import { useTranslation } from 'react-i18next';

export const ObtenerFullAcceso = () => {
    const { t } = useTranslation();
    const router = useRouter()
    const { actionModals, setActionModals } = AuthContextProvider()
    const DataInfoModulos = [
        {
            titulo: t("youritineraries"),
            descripcion: t("andvariousintegrations"),
            img: "/FullAcceso/invitaciones.png",
            alt: "/Itinerario",
            estado: false
        },
        {
            titulo: t("yourevents"),
            descripcion: t("managementamongothers"),
            img: "/FullAcceso/resumen.png",
            alt: "/Eventos",
            estado: true
        },
        {
            titulo: t("yourinvitations"),
            descripcion: t("thistoolprovides"),
            img: "/FullAcceso/invitaciones.png",
            alt: "/invitaciones",
            estado: false
        },
        {
            titulo: t("yourquote"),
            descripcion: t("calculateyouractivities"),
            img: "/FullAcceso/presupuesto.png",
            alt: "/presupuesto",
            estado: false
        },
        {
            titulo: t("yourregistries"),
            descripcion: t("simplydeposited"),
            img: "/FullAcceso/mesas.png",
            alt: "/Lista de regalos",
            estado: false
        },
        {
            titulo: t("yourdrawings"),
            descripcion: t("youreventspace"),
            img: "/FullAcceso/mesas.png",
            alt: "/mesas",
            estado: true
        },
        {
            titulo: t("huestsfeatures"),
            descripcion: t("guestsofyourchoice"),
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
                <p className=" text-[13px] px-9">{t("benefitscountless")}<span className="text-primary cursor-pointer text-[15px] ">{t("getaccess")}</span> </p>
                <div className="flex items-center justify-center">
                    <img className="h-auto w-[40%]" src={objetoEncontrado?.img} alt={objetoEncontrado?.alt} />
                </div>
            </div>
            <div className="flex  justify-center py-4">
                {
                    objetoEncontrado.estado ?
                        <button onClick={() => router.push("/facturacion")} className="bg-primary text-white py-1 px-3 rounded-lg">{t("getaccess")}</button> :
                        <button className="bg-primary text-white py-1 px-3 rounded-lg">
                            <a target="blank" href="https://wa.me/34910603622">
                                {t("Contactanos")}
                            </a>
                        </button>
                }
            </div>
        </div>
    )
}