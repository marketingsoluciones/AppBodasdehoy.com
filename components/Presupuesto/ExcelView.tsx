import React, { useEffect, useState } from 'react';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { ModalInterface } from "../../utils/Interfaces";
import { handleDelete } from '../TablesComponents/tableBudgetV8.handles';
import { SimpleDeleteConfirmation } from '../Utils/SimpleDeleteConfirmation';
import { TableBudgetV2 } from './PresupuestoV2/TableBudgetV2 copy';


interface Categoria {
    _id: string;
    nombre: string;
    gastos_array: any;
    pagado: number;
    coste_estimado: number;
    coste_final: number;
}

export const ExcelView = ({ showCategoria }) => {
    const [windowsWidth, setWindowsWidth] = useState<number>()
    const { user } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [categoria, setCategoria] = useState<Categoria>(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false)
    const [showModalDelete, setShowModalDelete] = useState<ModalInterface>({ state: false })
    const [showDataState, setShowDataState] = useState(true)

    window.addEventListener("resize", () => {
        const nuevoAncho = window.innerWidth;
        setWindowsWidth(nuevoAncho);
    })

    useEffect(() => {
        setCategoria(
            event?.presupuesto_objeto?.categorias_array?.find(
                (item) => item._id == showCategoria?._id
            )
        );
        if (event?.usuario_id === user?.uid || event?.permissions?.find(elem => elem?.title === "presupuesto").value === "edit") {
            const data = event?.presupuesto_objeto?.categorias_array?.filter(elem => !!showCategoria?._id ? showCategoria?._id === elem._id : true)
            setData([...data]);
        } else {
            const data = event?.presupuesto_objeto?.categorias_array?.filter(elem => !!showCategoria?._id ? showCategoria?._id === elem._id : true)
            const dataView = data.map(elem => {
                elem.gastos_array = elem.gastos_array.filter(el => el?.estatus !== false)
                return elem
            })
            setData([...dataView]);
        }

        const categoriasFiltradas = event?.presupuesto_objeto?.categorias_array?.filter(
            elem => !!showCategoria?._id ? showCategoria?._id === elem._id : true
        );

        if (showDataState) {
            setData([...categoriasFiltradas]);
        } else {
            const dataView = categoriasFiltradas.map(categoria => ({
                ...categoria,
                gastos_array: categoria.gastos_array
                    .filter(gasto => gasto?.estatus !== false)
                    .map(gasto => ({
                        ...gasto,
                        items_array: gasto.items_array
                            ? gasto.items_array.filter(item => item?.estatus !== true)
                            : []
                    }))
            }));
            setData([...dataView]);
        }
    }, [showCategoria, event, event?.presupuesto_objeto?.currency, showDataState]);

    return (
        <div className='w-full h-full'>
            {
                showModalDelete.state && <SimpleDeleteConfirmation
                    loading={loading}
                    setModal={setShowModalDelete}
                    handleDelete={() => handleDelete({ showModalDelete, event, setEvent, setLoading, setShowModalDelete })}
                    message={
                        <p className="text-azulCorporativo mx-8 text-center" >
                            {`Estas seguro de borrar ${showModalDelete.values?.object === "categoria"
                                ? "Categoria"
                                : showModalDelete.values?.object === "gasto"
                                    ? "Partida de gasto" :
                                    "Item"}: `}
                            <span className='font-semibold capitalize'>
                                {showModalDelete.title}
                            </span>
                        </p>}
                />
            }
            <div className="flex  w-full h-[calc(100vh-300px)] md:h-[calc(100vh-266px)]  justify-center items-center" >
                {
                    true &&
                    <div className={`flex w-full h-full TableWidth pl-2 `}>
                        <TableBudgetV2 showDataState={showDataState} setShowDataState={setShowDataState} setShowModalDelete={setShowModalDelete}
                            data={data.reduce((acc, item) => {
                                let coste_final_categoria = 0
                                let valirFirtsChild = true

                                // PRIMERO: Agregar la categoría
                                item?.gastos_array?.map((elem, idxElem) => {
                                    let coste_final_gasto = !!elem?.items_array?.length ? 0 : elem.coste_final
                                    let accessorEditables = ["coste_estimado"]
                                    !elem?.items_array?.length && accessorEditables.push("coste_final")
                                    let valirFirtsChildGasto = true

                                    elem?.items_array?.map((el, idxEl) => {
                                        if (
                                            event?.usuario_id !== user?.uid &&
                                            el.estatus !== false
                                        ) {
                                            return;
                                        }
                                        const cantidad = el.unidad === "xUni."
                                            ? el.cantidad
                                            : el.unidad === "xNiños."
                                                ? event?.presupuesto_objeto?.totalStimatedGuests?.children
                                                : el.unidad === "xAdultos."
                                                    ? event?.presupuesto_objeto?.totalStimatedGuests?.adults
                                                    : event?.presupuesto_objeto?.totalStimatedGuests?.children + event?.presupuesto_objeto?.totalStimatedGuests?.adults
                                        let coste_final_item = cantidad * el.valor_unitario
                                        coste_final_gasto = coste_final_gasto + coste_final_item
                                        valirFirtsChildGasto = false
                                        valirFirtsChild = false
                                    })
                                    coste_final_categoria = coste_final_categoria + coste_final_gasto
                                })
                                acc.push({
                                    ...item,
                                    object: "categoria",
                                    categoria: item.nombre,
                                    categoriaID: item._id,
                                    categoriaOriginal: { ...item },
                                    fatherCategoria: true,
                                    coste_final: coste_final_categoria,
                                    pendiente_pagar: coste_final_categoria - item.pagado,
                                    firstChild: true,
                                })
                                item?.gastos_array?.map((elem, idxElem) => {
                                    let coste_final_gasto = !!elem?.items_array?.length ? 0 : elem.coste_final
                                    let accessorEditables = ["coste_estimado"]
                                    !elem?.items_array?.length && accessorEditables.push("coste_final")
                                    let valirFirtsChildGasto = true
                                    elem?.items_array?.map((el, idxEl) => {
                                        if (
                                            event?.usuario_id !== user?.uid &&
                                            el.estatus !== false
                                        ) {
                                            return;
                                        }
                                        const cantidad = el.unidad === "xUni."
                                            ? el.cantidad
                                            : el.unidad === "xNiños."
                                                ? event?.presupuesto_objeto?.totalStimatedGuests?.children
                                                : el.unidad === "xAdultos."
                                                    ? event?.presupuesto_objeto?.totalStimatedGuests?.adults
                                                    : event?.presupuesto_objeto?.totalStimatedGuests?.children + event?.presupuesto_objeto?.totalStimatedGuests?.adults
                                        let coste_final_item = cantidad * el.valor_unitario
                                        coste_final_gasto = coste_final_gasto + coste_final_item
                                        valirFirtsChildGasto = false
                                    })
                                    acc.push({
                                        ...elem,
                                        object: "gasto",
                                        categoria: item.nombre,
                                        categoriaID: item._id,
                                        categoriaOriginal: { ...item },
                                        gasto: elem.nombre,
                                        gastoID: elem._id,
                                        gastoOriginal: { ...elem },
                                        firstChildItem: valirFirtsChildGasto,
                                        firstChildGasto: idxElem === 0,
                                        fatherGasto: true,
                                        coste_final: coste_final_gasto,
                                        pendiente_pagar: coste_final_gasto - elem.pagado,
                                        accessorEditables
                                    })
                                    elem?.items_array?.map((el, idxEl) => {
                                        if (
                                            event?.usuario_id !== user?.uid &&
                                            el.estatus !== false
                                        ) {
                                            return;
                                        }
                                        let accessorEditables = []
                                        el.unidad === "xUni." && accessorEditables.push("cantidad")
                                        const cantidad = el.unidad === "xUni."
                                            ? el.cantidad
                                            : el.unidad === "xNiños."
                                                ? event?.presupuesto_objeto?.totalStimatedGuests?.children
                                                : el.unidad === "xAdultos."
                                                    ? event?.presupuesto_objeto?.totalStimatedGuests?.adults
                                                    : event?.presupuesto_objeto?.totalStimatedGuests?.children + event?.presupuesto_objeto?.totalStimatedGuests?.adults
                                        let coste_final_item = cantidad * el.valor_unitario
                                        acc.push({
                                            ...el,
                                            object: "item",
                                            categoria: item.nombre,
                                            categoriaID: item._id,
                                            categoriaOriginal: { ...item },
                                            gasto: elem.nombre,
                                            gastoID: elem._id,
                                            gastoOriginal: { ...elem },
                                            item: el.nombre,
                                            itemID: el._id,
                                            itemOriginal: { ...el },
                                            coste_final: coste_final_item,
                                            cantidad,
                                            firstChildItem: idxEl === 0,
                                            lastChildGasto: idxEl === elem.items_array.length - 1,
                                            idxElem,
                                            idxEl,
                                            accessorEditables
                                        })
                                    })
                                })

                                return acc
                            }, [])} />
                    </div>
                }
                <style >
                    {`
                    .TableWidth {
                        width: full;
                    }
                    @media only screen and (min-width: 1930px) {
                        .TableWidth {
                        width: 70%
                        }
                    }
                    `}
                </style>
            </div >
           
        </div>
    );
};




