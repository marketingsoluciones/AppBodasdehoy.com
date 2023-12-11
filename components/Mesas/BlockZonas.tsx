import { FC } from "react";
import { useRouter } from "next/router";
import { DiamanteIcon } from "../icons";
import Link from "next/link";

interface propsBlockZonas {

}

const BlockZonas: FC<propsBlockZonas> = () => {
    const redireccionFacturacion = window.origin.includes("://test") ? process.env.NEXT_PUBLIC_DIRECTORY_FACTURACION?.replace("//", "//test") : process.env.NEXT_PUBLIC_DIRECTORY_FACTURACION
    const router = useRouter()
    return (
        <>
            {true && (
                <div className="flex flex-col items-center justify-center h-full overflow-y-auto ">
                    <p className="text-sm font-display">
                        <span className="text-primary ">Crear Zonas </span>
                        para organizar tu salón.
                    </p>
                    <p className="text-sm text-center md:block hidden ">
                        Diseña la distribución de tu celebración con la <br /> libertad  creativa que te facilita tu<br /> EventosOrganizador.
                    </p>
                    <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2  text-sm cursor-default">
                        <div>
                            <DiamanteIcon />
                        </div>
                        <Link href={`${redireccionFacturacion}`}>
                            <p>
                                Activar la versión <span className="font-semibold cursor-pointer">PREMIUM</span>
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