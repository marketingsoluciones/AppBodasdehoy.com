import Link from "next/link"
import { useTranslation } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();

    const DataLinks = [
        {
            title: t("ompanyconditions"),
            router: "/",
        },
        {
            title: t("frequentlyaskedquestions"),
            router: "/",
        },
        {
            title: t("cookiepolicies"),
            router: "/",
        },
        {
            title: t("Howwork"),
            router: "/",
        },
        {
            title: t("privacy"),
            router: "/",
        },
    ]

    return (
        <>
            <div className="grid grid-cols-2 justify-items-center font-display  px-10 md:pb-0 md:px-0">
                <div className="grid md:grid-cols-2 md:ml-48 space-y-3 md:space-y-0">
                    {
                        DataLinks.map((itemm, idx) => (
                            <div key={idx} className="text-white text-sm  md:text-base ">
                                <Link href={itemm.router} passHref>{itemm.title}</Link>
                            </div>
                        ))
                    }

                </div>
                <div  >
                    <img src="/logoFoot.png" alt="Logo eventoorganizador.com" className="" />
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center md:mr-5 space-x-2 ">
                        <p className="text-white">{t("productof")}</p>
                        <img src="/logoBodas.png" alt="Logo Bodasdehoy.com" />
                    </div>
                </div>
            </div>
            <div className="flex items-center md:mr-5 space-x-2 pb-16 px-10 md:hidden  ">
                <p className="text-white">{t("productof")}</p>
                <img src="/logoBodas.png" alt="Logo Bodasdehoy.com" />
            </div>

        </>
    )
}