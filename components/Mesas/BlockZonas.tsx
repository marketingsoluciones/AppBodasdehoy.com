import { FC } from "react";
import { useRouter } from "next/router";
import { DiamanteIcon } from "../icons";
import Link from "next/link";

interface propsBlockZonas {

}

const BlockZonas: FC<propsBlockZonas> = () => {
    const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
    const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path
    const router = useRouter()
    return (
        <>
            {true && (
                <div className="flex flex-col items-center justify-center w-full h-full px-2">
                    <p className="bg-blue-100 w-full text-sm text-center">
                        <span className="text-primary ">Crear Zonas </span>
                        para organizar tu salón.
                    </p>
                    <p className="w-full text-sm text-center block px-4 mt-2">
                        Diseña la distribución de tu celebración con la libertad creativa que te facilita tu EventosOrganizador.
                    </p>
                    <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2 w-full text-sm cursor-default">
                        <div>
                            <DiamanteIcon />
                        </div>
                        <Link href={`${redireccionFacturacion}`}>
                            <p>
                                Activar la versión <span className="w-full font-semibold cursor-pointer">PREMIUM</span>
                            </p>
                        </Link>
                    </div>
                    <Link href={`${redireccionFacturacion}`}>
                        <button className="text-sm text-white bg-primary px-7 py-1 rounded-lg">
                            Empezar
                        </button>
                    </Link>
                </div>
            )
            }

        </>
    )
}

export default BlockZonas