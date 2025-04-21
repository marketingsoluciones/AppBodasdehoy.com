import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { t, use } from 'i18next';
import { PlusIcon } from '../icons';
import { getCurrency } from '../../utils/Funciones';
import ClickAwayListener from 'react-click-away-listener';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { GoArrowRight, GoEye, GoTasklist, GoEyeClosed } from 'react-icons/go';
import CellEditCopy from './CellEditCopy';
import { useExpanded, useTable, useRowSelect, useSortBy } from "react-table";
import { GrMoney } from "react-icons/gr";
import Grafico from './Grafico';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { item, expenses, estimate, estimateCategory, ModalInterface } from "../../utils/Interfaces";
import { PiNewspaperClippingLight } from "react-icons/pi";
import FormAddPago from '../Forms/FormAddPago';
import { Modal } from '../Utils/Modal';
import { ExportarExcelV2 } from '../Utils/ExportarExcelV2';
import { PresupuestoSelectionMenuTable } from './PresupuestoSelectionMenuTable';
import { DuplicatePresupuesto } from './DuplicatePesupuesto';
import { RiSettings4Fill } from "react-icons/ri";
import { ResumenInvitados } from './ResumenDeInvitadosPresupuesto';
import { ModalTaskList } from './ModalTaskList';
import { useAllowed } from '../../hooks/useAllowed';
import { TableBudgetV8 } from '../TablesComponents/TableBudgetV8';
import { BlockListaCategorias } from './BlockListaCategorias';
import { LoadingSpinner } from '../Utils/LoadingSpinner';
import { handleDelete } from '../TablesComponents/tableBudgetV8.handles';
import { SimpleDeleteConfirmation } from '../Utils/SimpleDeleteConfirmation';

interface Categoria {
    _id: string;
    nombre: string;
    gastos_array: any;
    pagado: number;
    coste_estimado: number;
    coste_final: number;
}

export const ExcelView = ({ setShowCategoria, categorias_array, showCategoria }) => {
    const toast = useToast()
    const [windowsWidth, setWindowsWidth] = useState<number>()
    const { event, setEvent } = EventContextProvider()
    const [categoria, setCategoria] = useState<Categoria>(null);
    const [data, setData] = useState([]);
    const [menuIzquierdo, setMenuIzquierdo] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showModalDelete, setShowModalDelete] = useState<ModalInterface>({ state: false })
    const totalCosteFinal = categoria?.gastos_array?.reduce((total, item) => total + item.coste_final, 0)
    const [isAllowed, ht] = useAllowed()

    window.addEventListener("resize", () => {
        const nuevoAncho = window.innerWidth;
        setWindowsWidth(nuevoAncho);
    })

    const columnsToExcel = [
        { column: "A", title: "Partida de Gasto", accessor: "nombre" },
        { column: "B", title: "Unidad", accessor: "columna1" },
        { column: "C", title: "Cantidad", accessor: "columna2" },
        { column: "D", title: "Item", accessor: "columna3" },
        { column: "E", title: "Valor Unitario", accessor: "columna4" },
        { column: "F", title: "Total", accessor: "coste_final" },
        { column: "G", title: "Coste Estimado", accessor: "coste_estimado" },
        { column: "H", title: "Pagado", accessor: "pagado" },
        { column: "I", title: "Pendiente por Pagar", accessor: "pendiente_pagar" },
        { column: "J", title: "Opciones", accessor: "options" }
    ];

    useEffect(() => {

        setCategoria(
            event?.presupuesto_objeto?.categorias_array?.find(
                (item) => item._id == showCategoria?._id
            )
        );
        const data = event?.presupuesto_objeto?.categorias_array?.filter(elem => !!showCategoria?._id ? showCategoria?._id === elem._id : true)
        setData([...data]);
        // setGastoID(old => ({ ...old, crear: false }))
    }, [showCategoria, event, event?.presupuesto_objeto?.currency]);

    const sumarCosteEstimado = (gastosArray) => {
        return gastosArray?.reduce((total, item) => total + item.coste_estimado, 0);
    };
    const totalCosteEstimado = sumarCosteEstimado(categoria?.gastos_array);
    const AddGasto = async () => {
        try {
            if (isAllowed()) {
                const rest: any = await fetchApiEventos({
                    query: queries.nuevoGasto,
                    variables: {
                        evento_id: event?._id,
                        categoria_id: categoria?._id,
                        nombre: "Nueva part. de gasto",
                    }
                });
                setEvent((old) => {
                    const f1 = old?.presupuesto_objeto?.categorias_array?.findIndex(
                        (item) => item._id == categoria._id
                    );
                    if (old.presupuesto_objeto.categorias_array[f1].gastos_array === null) {
                        old.presupuesto_objeto.categorias_array[f1].gastos_array = [];
                    }
                    old.presupuesto_objeto.categorias_array[f1].gastos_array = [
                        ...old.presupuesto_objeto.categorias_array[f1].gastos_array,
                        rest,
                    ];
                    const f2 = old.presupuesto_objeto.categorias_array[f1].gastos_array.findIndex((elemt) => elemt._id == rest._id)
                    old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].pagos_array = []
                    old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array = []
                    return { ...old };
                });
                toast("success", t("Creado con exito"))
            } else {
                ht()
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex((item) => item?._id === categoria?._id)
        // if (event?.presupuesto_objeto?.categorias_array[f1] != totalCosteFinal) {
        //     setEvent((old) => {
        //         old.presupuesto_objeto.categorias_array[f1].coste_final = totalCosteFinal
        //         return { ...old }
        //     })
        // }
    }, [totalCosteFinal])

    return (
        <div className='w-full h-full'>
            <div className="absolute left-0" >
                <button onClick={() => setMenuIzquierdo(!menuIzquierdo)} className="bg-white rounded-r-md w-7 h-7 md:flex items-center justify-center -translate-y-full">
                    <GoArrowRight className={` ${menuIzquierdo === true ? "" : "rotate-180"} h-5 w-5 transition-all`} />
                </button>
            </div>

            {showModalDelete.state && <SimpleDeleteConfirmation
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
            />}
            {/* <LoadingSpinner loading={loading} /> */}

            <div className="flex flex-col md:flex-row w-full h-[calc(100vh-300px)] md:h-[calc(100vh-266px)]" >
                <div className={`${menuIzquierdo ? "hidden" : "md:w-[300px] flex items-center flex-col mb-3 md:mb-0"} transition-all duration-300 ease-in-out`}>
                    <div className="mb-2 w-full">
                        <ResumenInvitados />
                    </div>
                    <BlockListaCategorias setShowCategoria={setShowCategoria} categorias_array={categorias_array} showCategoria={showCategoria} />
                </div>
                {
                    true &&
                    <div className={`flex ${menuIzquierdo ? "w-full" : "md:w-[calc(100%-300px)]"} h-full`}>
                        <div className='bg-blue-50 w-full h-full flex'>
                            <TableBudgetV8 showModalDelete={showModalDelete} setShowModalDelete={setShowModalDelete} setLoading={setLoading}
                                data={data.reduce((acc, item) => {
                                    let coste_final_categoria = 0
                                    let valirFirtsChild = true
                                    item?.gastos_array?.map((elem, idxElem) => {
                                        let coste_final_gasto = !!elem?.items_array?.length ? 0 : elem.coste_final
                                        let accessorEditables = ["coste_estimado"]
                                        !elem?.items_array?.length && accessorEditables.push("coste_final")
                                        let valirFirtsChildGasto = true
                                        elem?.items_array?.map((el, idxEl) => {
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
                                            coste_final_gasto = coste_final_gasto + coste_final_item
                                            valirFirtsChildGasto = false
                                            valirFirtsChild = false
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
                                                ...(idxEl === 0 && { firstChildItem: true }),
                                                ...((idxElem === 0 && idxEl === 0) && { firstChildGasto: true }),
                                                ...((idxElem === 0 && idxEl === 0) && { firstChild: true }),
                                                ...((idxEl === elem.items_array.length - 1) && { lastChildGasto: true }),
                                                idxElem,
                                                idxEl,
                                                accessorEditables
                                            })
                                        })
                                        coste_final_categoria = coste_final_categoria + coste_final_gasto
                                        acc.push({
                                            ...elem,
                                            object: "gasto",
                                            categoria: item.nombre,
                                            categoriaID: item._id,
                                            categoriaOriginal: { ...item },
                                            gasto: elem.nombre,
                                            gastoID: elem._id,
                                            gastoOriginal: { ...elem },
                                            ...((valirFirtsChildGasto) && { firstChildItem: true }),
                                            ...((idxElem === 0 && valirFirtsChildGasto) && { firstChildGasto: true }),
                                            ...((idxElem === 0 && valirFirtsChild) && { firstChild: true }),
                                            fatherGasto: true,
                                            coste_final: coste_final_gasto,
                                            pendiente_pagar: coste_final_gasto - elem.pagado,
                                            accessorEditables
                                        })
                                        valirFirtsChild = false
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
                                        ...((valirFirtsChild) && { firstChild: true }),
                                    })
                                    return acc
                                }, [])} />
                        </div>
                    </div>
                }
                <style jsx>
                    {`
                    .CuadroInvitados {
                        width: full;
                    }
                    @media only screen and (max-width: 1650px) {
                        .CuadroInvitados {
                        flex-direction: column;

                        }
                    }
                    `}
                </style>
            </div >
        </div>
    );
};




