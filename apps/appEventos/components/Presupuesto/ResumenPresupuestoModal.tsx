import { t } from "i18next";
import { getCurrency } from "../../utils/Funciones";
import { CardCategorias } from "./ComponentesModalPresupuesto/CardCategorias"
import { ResumenMontosPresupuesto } from "./ComponentesModalPresupuesto/ResumenMontosPresupuesto";



export const ResumenPresupuestoModal = ({ categorias, presupuesto, estimadoState }) => {


    return (
        <div className="p-4">
            <div className="flex items-center justify-center text-3xl text-azulCorporativo capitalize underline"> Resumen de tu presupuesto</div>
            <ResumenMontosPresupuesto presupuesto={presupuesto}  estimadoState={estimadoState}   />
            <div className="grid grid-cols-4 grid-flow-row gap-4 ">
                {
                    categorias?.map((categoria, idx) => {
                        if (categoria.gastos_array.length === 0) return null; // Si no hay gastos, no renderizar
                        return (
                            <div key={idx} className={` h-max
                                ${categoria?.gastos_array?.length > 4 && 'row-span-2 '}
                                ${categoria?.gastos_array?.length > 8 && 'row-span-3 '}
                                ${categoria?.gastos_array?.length > 12 && 'row-span-4 '}
                                ${categoria?.gastos_array?.length > 16 && 'row-span-5 '}
                            `} >
                                <CardCategorias
                                    titulo={categoria.nombre}
                                    items={categoria.gastos_array}

                                />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}


