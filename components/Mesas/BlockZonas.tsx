import { FC } from "react";
import { useRouter } from "next/router";
import { DiamanteIcon } from "../icons";
import Link from "next/link";
import { useTranslation } from 'react-i18next';

interface propsBlockZonas {

}

const BlockZonas: FC<propsBlockZonas> = () => {
    const { t } = useTranslation();
    const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
    const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path
    const router = useRouter()
    return (
        <div className="w-full h-full overflow-auto">
            {true && (
                <div className="w-full py-2 text-xs 2xl:text-sm">
                    <div className="flex flex-col items-center justify-center w-full h-full px-2">
                        <p className="w-full text-center">
                            <span className="text-primary ">{t("createzones")} </span>
                            {t("livingroom")}
                        </p>
                        <p className="hidden md:block w-full text-center px-4 mt-2">
                            {t("designthelayout")}{t("creativefreedom")}{t("eventsOrganizer")}
                        </p>
                        <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2 w-full cursor-default">
                            <div>
                                <DiamanteIcon />
                            </div>
                            <Link href={`${redireccionFacturacion}`}>
                                <p>
                                    {t("Activar la versión")} <span className="w-full font-semibold cursor-pointer">{t("premium")}</span>
                                </p>
                            </Link>
                        </div>
                        <Link href={`${redireccionFacturacion}`}>
                            <button className="text-white bg-primary px-7 py-1 rounded-lg">
                                {t("begin")}
                            </button>
                        </Link>
                    </div>
                </div>
            )
            }

        </div>
    )
}

export default BlockZonas