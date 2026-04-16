import { t } from "i18next"
import { getCurrency } from "../../../utils/Funciones"

export const ResumenMontosPresupuesto = ({ presupuesto, estimadoState }) => {

    const saldo = presupuesto.coste_estimado - presupuesto.coste_final;
    const porcentaje = (presupuesto?.coste_estimado / presupuesto?.coste_final) * 100
    return (
        <div className="flex flex-col items-center justify-center py-5 w-full">
            <div className={`flex ${estimadoState ? "justify-between" : "justify-center"}  w-[40%] capitalize`}>
                <div className="flex flex-col items-center text-azulCorporativo">
                    <label className="text-2xl">
                        {getCurrency(presupuesto.coste_final)}
                    </label>
                    <label>
                        final
                    </label>
                </div>
                {estimadoState && <div className="flex flex-col items-center text-azulCorporativo">
                    <label className="text-2xl">
                        {getCurrency(presupuesto.coste_estimado)}
                    </label>
                    <label >
                        estimado
                    </label>
                </div>}
            </div>
            {estimadoState && <div className=" w-4/6 mx-auto flex gap-1 items-center py-2 inset-x-0">
                <div className="bg-gray-300 rounded-xl flex items-center overflow-hidden md:h-5 w-full relative">
                    <p className="font-display text-xs text-white pl-2 z-10 relative p-3">
                        {
                            Math.abs(saldo) == saldo ? `Saldo a favor ${getCurrency(presupuesto.coste_final)}` : `${t("balanceagainst")} ${getCurrency(saldo)}`
                        }
                    </p>
                    <svg
                        className={`bg-${Math.abs(saldo) == saldo ? "green" : "red"
                            } h-full absolute top-0 left-0 z-0  transition-all duration-700 `}
                        width={`${porcentaje}%`}
                    ></svg>
                </div>
            </div>}
        </div>
    )
}