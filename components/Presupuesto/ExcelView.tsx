import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { BlockListaCategorias } from '../../pages/presupuesto';
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
import { item, expenses, estimate } from "../../utils/Interfaces";
import { PiNewspaperClippingLight } from "react-icons/pi";
import FormAddPago from '../Forms/FormAddPago';
import { Modal } from '../Utils/Modal';
import { ExportarExcelV2 } from '../Utils/ExportarExcelV2';
import { PresupuestoSelectionMenuTable } from './PresupuestoSelectionMenuTable';
import { DuplicatePresupuesto } from './DuplicatePesupuesto';

interface Categoria {
    _id: string;
    nombre: string;
    gastos_array: any;
    pagado: number;
    coste_estimado: number;
    coste_final: number;

}

export const ExcelView = ({ set, categorias_array, showCategoria }) => {

    const toast = useToast()
    const [windowsWidth, setWindowsWidth] = useState<number>()
    const { event, setEvent } = EventContextProvider()
    const [categoria, setCategoria] = useState<Categoria>(null);
    const [data, setData] = useState([]);
    const [GastoID, setGastoID] = useState({ id: "", crear: false })
    const [menuIzquierdo, setMenuIzquierdo] = useState(false)
    const [menuDerecho, setMenuDerecho] = useState(false)
    const cate = showCategoria?.id
    const [showFormPago, setShowFormPago] = useState({ id: "", state: false })
    const [showModalDuplicate, setShowModalDuplicate] = useState({ id: "", state: false })

    const totalCosteFinal = categoria?.gastos_array?.reduce((total, item) => total + item.coste_final, 0)
    const totalpagado = categoria?.gastos_array?.reduce((total, item) => total + item.pagado, 0)

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
            event?.presupuesto_objeto?.categorias_array.find(
                (item) => item._id == cate
            )
        );
        setData(
            event?.presupuesto_objeto?.categorias_array?.find(
                (item) => item._id == cate
            )?.gastos_array || []
        );
        setGastoID(old => ({ ...old, crear: false }))
    }, [cate, event, event?.presupuesto_objeto?.currency]);

    const sumarCosteEstimado = (gastosArray) => {
        return gastosArray?.reduce((total, item) => total + item.coste_estimado, 0);
    };
    const totalCosteEstimado = sumarCosteEstimado(categoria?.gastos_array);
    const AddGasto = async () => {
        try {
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
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex((item) => item?._id === categoria?._id)
        if (event?.presupuesto_objeto?.categorias_array[f1] != totalCosteFinal) {
            setEvent((old) => {
                old.presupuesto_objeto.categorias_array[f1].coste_final = totalCosteFinal
                return { ...old }
            })
        }
    }, [totalCosteFinal])

    return (
        <>
            {
                showFormPago.state && (
                    <Modal classe={"w-[500px] h-[90%] p-4 "} >
                        <div className="font-display text-gray-500 hover:text-gray-300 transition text-lg absolute top-5 right-5 cursor-pointer hover:scale-125" onClick={() => setShowFormPago({ id: "", state: false })}>X</div>
                        <FormAddPago GastoID={showFormPago?.id} cate={categoria?._id} />
                    </Modal>
                )
            }
            {
                showFormPago.state && (
                    <Modal classe={"w-[500px] h-[90%] p-4 "} >
                        <DuplicatePresupuesto />
                    </Modal>
                )
            }
            <div className="flex pl-3 h-[calc( 100vh-300px )] relative " >
                <div className="bg-transparent absolute h-full py-3 -top-12 left-0-" >
                    <button onClick={() => setMenuIzquierdo(!menuIzquierdo)} className="bg-white border border-primary rounded-r-md w-7 h-7 flex items-center justify-center">
                        <GoArrowRight className={` ${menuIzquierdo === true ? "" : "rotate-180"} h-5 w-5 transition-all`} />
                    </button>
                </div>
                <div className={`${windowsWidth < 1200 ? "hidden" : "bg-transparent absolute h-full py-3 -top-12 right-0"}  `}>
                    <button onClick={() => setMenuDerecho(!menuDerecho)} className="bg-white border border-primary rounded-l-md w-7 h-7 flex items-center justify-center">
                        <GoArrowRight className={` ${menuDerecho != true ? "" : "rotate-180"} h-5 w-5 transition-all`} />
                    </button>
                </div>
                <div className={`${menuIzquierdo ? "hidden " : " w-[15%] flex  items-center flex-col pr-4"} transition-all`}>
                    <div className=" mb-2 w-full">
                        <ResumenInvitados />
                    </div>
                    <BlockListaCategorias set={set} categorias_array={categorias_array} cate={showCategoria} />
                </div>
                <div className="flex-1 flex flex-col items-center pb-5">
                    <div className=' rounded-t-md w-full text-center capitalize bg-primary text-white py-1 ' >
                        {categoria?.nombre ? categoria?.nombre : "Categoria"}
                        {/* <ExportarExcelV2 data={event?.presupuesto_objeto} column={columnsToExcel} /> */}
                        {/* <button onClick={() => setShowModalDuplicate(!showModalDuplicate.state)}>
                            importar presupuesto
                        </button> */}
                    </div>
                    <TablePorProveedor data={data} categoria={categoria} set={setShowFormPago} />
                    <div className="flex px-3 w-full bg-slate-200  justify-items-center py-1 rounded-b-md text-xs ">
                        <div
                            onClick={() => AddGasto()}
                            className="font-display text-sm- text-primary w-full  flex gap-2 items-center cursor-pointer  col-span-2 "
                        >
                            <PlusIcon /> Añadir Part. de Gasto
                        </div>
                        <div className="w-full flex  items-center justify-end" >
                            <label className='mr-2'>Valor Total:</label> {getCurrency(totalCosteFinal, event?.presupuesto_objeto?.currency)}
                        </div>
                        <div className=" w-full flex  items-center justify-end" >
                            <label className='mr-2'> Valor Total Estimado:</label> {getCurrency(totalCosteEstimado, event?.presupuesto_objeto?.currency)}
                        </div>
                        <div className=" w-full flex  items-center justify-end  " >
                            <label className='mr-2'>Total Pagado:</label> {getCurrency(totalpagado, event?.presupuesto_objeto?.currency)}
                        </div>
                        <div className=" w-full flex  items-center justify-end " >
                            <label className='mr-2'>Total Pendiente:</label> {getCurrency(totalCosteFinal - totalpagado, event?.presupuesto_objeto?.currency)}
                        </div>
                    </div>
                </div>
                <div className={`${menuDerecho || windowsWidth < 1200 ? "hidden " : " w-[15%] flex  items-center flex-col pl-4"} transition-all`}>
                    <h2 className="font-display pb-2 text-xl text-gray-500 font-semibold text-center w-full">
                        {t("howost")}
                    </h2>
                    <Grafico categorias={categorias_array} />
                </div>
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
            </div>
        </>
    );
};

const ColumnVisibilityModal = ({ columnVisibility, toggleColumnVisibility, closeModal }) => {
    return (
        <div className="absolute z-50 right-5 flex items-center justify-center text-azulCorporativo">
            <div className="bg-white p-4 rounded shadow-lg">
                <h2 className="text-lg  mb-1.5 border-b">Columnas Visibles</h2>
                {Object.keys(columnVisibility).map((columnId) => {
                    const column = columnVisibility[columnId];
                    return (
                        <div key={columnId} className="mb-2">
                            <label className="flex items-center cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={column.visible}
                                    onChange={() => toggleColumnVisibility(column.accessor)}
                                    className="mr-2 cursor-pointer text-primary"
                                />
                                {column.Header}
                            </label>
                        </div>
                    )
                })}
                <div className='w-full border-t'>
                    <button onClick={closeModal} className="mt-1.5 bg-primary text-white  py-1 rounded w-full text-sm ">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

const TablePorProveedor = ({ data = [], categoria, set }) => {
    const { event, setEvent } = EventContextProvider()
    const toast = useToast()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const idd = useId();
    const [columnVisibility, setColumnVisibility] = useState({
        nombre: { visible: true, Header: "Partida de Gasto", span: 2, accessor: "nombre" },
        columna1: { visible: true, Header: "Unidad", span: 1, accessor: "columna1" },
        columna2: { visible: true, Header: "Cantidad", span: 1, accessor: "columna2" },
        columna3: { visible: true, Header: "Item", span: 3, accessor: "columna3" },
        columna4: { visible: true, Header: "Valor Unitario", span: 1, accessor: "columna4" },
        coste_final: { visible: true, Header: "Total", span: 2, accessor: "coste_final" },
        coste_estimado: { visible: true, Header: "Coste Estimado", span: 2, accessor: "coste_estimado" },
        pagado: { visible: true, Header: "Pagado", span: 2, accessor: "pagado" },
        pendiente_pagar: { visible: true, Header: "Pendiente por Pagar", span: 2, accessor: "pendiente_pagar" },
        options: { visible: true, Header: "Opciones", span: 2, accessor: "options" }
    });
    const columns = useMemo(
        () => [
            {
                Header: "Part. de Gasto",
                accessor: "nombre",
                id: "nombre",
                className: 'sticky *lg:static z-10 left-0 relative',
                Cell: (props) => {
                    return (
                        <div className="flex w-full items-center overflow-hidden truncate  ">
                            <span key={props.cell.row.id} className=" flex flex-1 items-center pr-10  text-xs ">
                                <CellEditCopy categoriaID={categoria?._id} type={"string"} table={"principal"} {...props} />
                            </span>
                        </div>
                    )
                }
            },
            {
                Header: "Und.",
                accessor: "columna1",
            },
            {
                Header: "Can.",
                accessor: "columna2",
            },
            {
                Header: "Item",
                accessor: "columna3",
            },
            {
                Header: "Val. Unitario",
                accessor: "columna4",
            },
            {
                Header: "Total",
                accessor: "coste_final",
                Cell: (props) => {
                    const data = props?.row?.original?.items_array
                    const sumaTotal = data?.reduce((total, item) => total + item.total, 0)

                    useEffect(() => {
                        if (data.length > 0) {
                            console.log("entro")
                            fetchApiEventos({
                                query: queries.editGasto,
                                variables: {
                                    evento_id: event?._id,
                                    categoria_id: categoria?._id,
                                    gasto_id: props?.row?.original?._id,
                                    variable_reemplazar: "coste_final",
                                    valor_reemplazar: sumaTotal
                                }
                            }).then((result) => {

                            }).catch((error) => {
                                console.log(error);
                            })
                        }
                    }, [sumaTotal])

                    if (data?.length === 0) {
                        return (
                            <CellEditCopy categoriaID={categoria?._id} type={"number"} {...props} table={"principal"} />
                        )
                    }
                    if (data?.length > 0) {
                        return (
                            <div className="font-display w-full text-xs grid place-items-center h-full text-end pr-1.5 ">
                                <p className="w-full text-end">{getCurrency(sumaTotal, event?.presupuesto_objeto?.currency)}</p>
                            </div>
                        );
                    }
                },
            },
            {
                Header: "Coste Estimado",
                accessor: "coste_estimado",
                id: "coste_estimado",
                Cell: (props) => {
                    return (
                        <div className='w-full'>

                            <CellEditCopy categoriaID={categoria?._id} type={"number"} table={"principal"} {...props} />
                        </div>
                    )
                }
            },
            {
                Header: "Pagado",
                accessor: "pagado",
                id: "pagado",
                Cell: (props) => {
                    const [value, setValue] = useState(props?.value);
                    useEffect(() => {
                        setValue(props?.value)
                    }, [props?.value])
                    return (
                        <div className="font-display text-xs grid place-items-center h-full text-end w-full ">
                            <p className="w-full">{getCurrency(value, event?.presupuesto_objeto?.currency)}</p>
                        </div>
                    );
                },
            },
            {
                Header: "Pnd. por Pagar",
                accessor: "pendiente_pagar",
                id: "pendiente_pagar",
                Cell: (props) => {
                    const [value, setValue] = useState(0);
                    const total = props.row.original.items_array.reduce((acumulador, objeto) => acumulador + objeto.total, 0);
                    useEffect(() => {

                        if (props.row.original.coste_final === 0) {
                            setValue(0)
                        }
                        if (props.row.original.items_array.length > 0) {
                            setValue(total - props.row.original.pagado)
                        } else (
                            setValue(props.row.original.coste_final - props.row.original.pagado)
                        )


                    }, [props?.row.original])
                    return (
                        <div className="font-displaytext-xs grid place-items-center h-full text-end w-full ">
                            <p className="w-full">{getCurrency(value, event?.presupuesto_objeto?.currency)}</p>
                        </div>
                    );
                },
            },
            {
                // Header: "",
                accessor: "options",
                id: "options",
                className: 'relative',
                Cell: (props) => {
                    const [show, setShow] = useState(false);
                    const [showItem, setShowItem] = useState(props?.row?.original.estatus === null ? false : props?.row?.original.estatus);
                    const dataCategoria = categoria?.gastos_array.find((item) => item._id == props.row.original._id);
                    const handleRemove = async () => {
                        let data
                        try {
                            const params = {
                                query: `mutation{
                                          borraGasto(evento_id:"${event?._id}", categoria_id: "${categoria._id}", gasto_id: "${props?.row?.original?._id}"){
                                          coste_final
                                          coste_estimado
                                          pagado
                                            categorias_array {
                                              coste_estimado
                                              coste_final
                                              pagado
                                            }
                                          }
                                        }`,
                                variables: {},
                            }
                            const { data: res } = await api.ApiApp(params);
                            data = res?.data?.borraGasto
                        } catch (error) {
                            console.log(error);
                            toast("error", t("Agrega un monto a tu Presupuesto Estimado"))
                        } finally {
                            setEvent((old) => {
                                const idxCategoria = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria._id);
                                const filterGastos = old?.presupuesto_objeto?.categorias_array[idxCategoria].gastos_array?.filter((item) => item._id !== props?.row?.original?._id
                                );
                                old.presupuesto_objeto.coste_estimado = data?.coste_estimado
                                old.presupuesto_objeto.coste_final = data?.coste_final
                                old.presupuesto_objeto.pagado = data?.pagado
                                old.presupuesto_objeto.categorias_array[idxCategoria].coste_estimado = data?.categorias_array[0]?.coste_estimado
                                old.presupuesto_objeto.categorias_array[idxCategoria].coste_final = data?.categorias_array[0]?.coste_final
                                old.presupuesto_objeto.categorias_array[idxCategoria].pagado = data?.categorias_array[0]?.pagado
                                old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array = filterGastos;
                                return { ...old };
                            });
                            toast("success", t("Borrado exitoso"))
                        }
                    };
                    const handleCreateItem = () => {
                        fetchApiEventos({
                            query: queries.nuevoItemsGastos,
                            variables: {
                                evento_id: event?._id,
                                categoria_id: categoria?._id,
                                gasto_id: props.row.original._id,
                                itemsGastos: [{
                                    nombre: "Nuevo Item",
                                    cantidad: 1,
                                    valor_unitario: 0,
                                    total: 0,
                                    unidad: "xUni.",
                                    estatus: false
                                }]
                            },
                        }).then((result: estimate) => {
                            const f1 = result.categorias_array.findIndex((item) => item._id == categoria?._id)
                            const f2 = result.categorias_array[f1].gastos_array.findIndex((item) => item._id == props.row.original._id)
                            const data = result.categorias_array[f1].gastos_array[f2].items_array[result.categorias_array[f1].gastos_array[f2].items_array.length - 1];
                            setEvent((old) => {
                                const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                                const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == props.row.original._id);
                                old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array?.push(data)
                                return ({ ...old, })
                            })
                            toast("success", t("Creado con exito"))
                        }).catch((error) => {
                            console.log(error);
                        })
                    }
                    const handlePago = () => {
                        set({ id: props?.row?.original?._id, state: true })
                    }
                    const handleChangeState = () => {
                        fetchApiEventos({
                            query: queries.editGasto,
                            variables: {
                                evento_id: event?._id,
                                categoria_id: categoria?._id,
                                gasto_id: props?.row?.original?._id,
                                variable_reemplazar: "estatus",
                                valor_reemplazar: !showItem
                            }
                        }).then((result: estimate) => {
                            const f1 = result?.categorias_array.findIndex((item) => item._id == categoria?._id);
                            const f2 = result?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                            const dataRelult = result?.categorias_array[f1]?.gastos_array[f2]
                            setEvent((old) => {
                                const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                                const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                                old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].estatus = dataRelult?.estatus
                                return { ...old, }
                            })
                            toast("success", t("item actualizado con exito"))
                        }).catch((error) => {
                            console.log(error);
                        })
                    }
                    const Lista = [
                        {
                            icon: <GrMoney className="w-4 h-4" />,
                            title: "Pago",
                            onClick: () => handlePago()
                        },
                        {
                            icon: showItem ? <GoEye className="w-4 h-4" /> : <GoEyeClosed className="w-4 h-4" />,
                            title: "Estado",
                            onClick: () => handleChangeState()
                        },
                        {
                            icon: <GoTasklist className="w-4 h-4" />,
                            title: "Task",
                            //function: BorrarCategoria
                        },
                        {
                            icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
                            title: "Borrar",
                            onClick: () => handleRemove()
                        },
                        {
                            icon: <PiNewspaperClippingLight className="w-5 h-5" />,
                            title: "Agregar Item",
                            onClick: () => handleCreateItem()
                        },


                    ];
                    return (
                        <div className="absolute right-0 z-20 flex items-center ">

                            {showItem ?
                                <GoEye className="w-5 h-5" />
                                : null}
                            <PresupuestoSelectionMenuTable data={props} categoria={categoria} OptionList={Lista} /* setShowEditTask={setShowEditTask} showEditTask={showEditTask} */ />
                        </div>
                    );
                },
            },
        ],
        [categoria, event?.presupuesto_objeto?.currency, event]
    );
    const colSpan = {
        nombre: 3,
        columna1: 1,
        columna2: 1,
        columna3: 3,
        columna4: 2,
        coste_final: 2,
        coste_estimado: 2,
        pagado: 2,
        pendiente_pagar: 2,
        options: 1
    };
    const visibleColumns = useMemo(
        () => columns.filter(column => columnVisibility[column.accessor].visible),
        [columns, columnVisibility]
    );

    const toggleColumnVisibility = (accessor) => {
        setColumnVisibility((prev) => ({
            ...prev,
            [accessor]: {
                ...prev[accessor],
                visible: !prev[accessor].visible,
            },
        }));
    };

    const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable(
        { columns: visibleColumns, data }, useSortBy, useExpanded,
    );
    const renderRowSubComponent = useCallback(({ row, categoria }) => {
        return (
            <SubComponenteTable row={row} data={row.original.items_array} categoria={categoria} visibleColumns={visibleColumns} />
        )
    }, [categoria]);
    return (
        /* <table {...getTableProps()} className=" bg-slate-50  border-collapse w-full relative p-4 ">
            {isModalOpen && (
                <ColumnVisibilityModal
                    columnVisibility={columnVisibility}
                    toggleColumnVisibility={toggleColumnVisibility}
                    closeModal={() => setIsModalOpen(false)}
                />
            )}
            <thead className="relative text-xs text-gray-700 uppercase w-full bg-[#e6e6d7] ">
                {headerGroups.map((headerGroup, id) => (
                    <tr
                        {...headerGroup.getHeaderGroupProps()}
                        className={` grid grid-cols-18 py-2  `}
                        key={id}
                    >
                        {headerGroup.headers.map((column: any, id: any) => (
                            <th
                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                className={`leading-[1]-  text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]} ${column?.className}`}
                                key={id}
                            >
                                {typeof column.render("Header") == "string" && t(column.render("Header"))}
                                <span>
                                    {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                                </span>
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            {
                data.length > 0 ?
                    <tbody {...getTableBodyProps()} className="text-gray-500 text-sm w-full overflow-y-auto ">
                        {rows.map((row, id) => {
                            prepareRow(row);
                            return (
                                <React.Fragment key={row.id}>
                                    <tr
                                        key={id}
                                        {...row.getRowProps()}
                                        className={` w-full border-b border-base grid grid-cols-18 px-2 bg-[#eaecee] `}
                                    >
                                        {row.cells.map((cell, id) => {
                                            return (
                                                <td
                                                    key={id}
                                                    {...cell.getCellProps()}
                                                    className={` pr-2 font-display text-sm w-full text-left py-2 col-span-${colSpan[cell.column.id]
                                                        }`}
                                                >
                                                    {cell.render("Cell")}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    { /* row.isExpanded  true ? (
                                        <tr key={idd} className="h-max w-full">
                                            <td >
                                                {renderRowSubComponent({ row, categoria })}
                                            </td>
                                        </tr>
                                    ) : null}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    : <tbody className='h-[500px] capitalize flex items-center justify-center text-azulCorporativo'>
                        <tr>
                            <td colSpan={16}>No hay datos disponibles.</td>
                        </tr>
                    </tbody>
            }
        </table> */
        //< div className = "relative" >
        //<div className="col-span-2 col-span-3 col-span-4 col-span-5 col-span-6 col-span-7 col-span-8 col-span-9 col-span-10" />
        <table
            {...getTableProps()}
            className="table-auto border-collapse w-full rounded-lg relative p-4">
            <thead className="relative text-xs text-gray-700 uppercase w-full ">
                {headerGroups.map((headerGroup: any, id: any) => {
                    return (
                        <tr
                            {...headerGroup.getHeaderGroupProps()}
                            className="grid grid-cols-19"
                            key={id} >
                            {headerGroup.headers.map((column: any, id: any) => {
                                return (
                                    <th
                                        {...column.getHeaderProps(column.getSortByToggleProps())}
                                        className={`bg-[#e6e6d7] leading-[1] px-1 py-1 md:py-2 text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]
                                            } ${column?.className}`}
                                        key={id}
                                    >
                                        <>
                                            {typeof column.render("Header") == "string" && t(column.render("Header"))}
                                            <span>
                                                {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                                            </span>
                                        </>
                                    </th>
                                )
                            })}
                        </tr>
                    )
                })}
            </thead>
            <tbody {...getTableBodyProps()} className="text-gray-700 text-xs">
                {rows.length >= 1 ? rows.map((row, i) => {
                    prepareRow(row);
                    return (
                        <>
                            <tr
                                {...row.getRowProps()}
                                key={i}
                                className={`w-full font-display grid grid-cols-19`}

                            >
                                {row.cells.map((cell, i) => {

                                    return (
                                        <td
                                            {...cell.getCellProps()}
                                            key={i}
                                            className={`bg-[#eaecee] flex leading-[1.3] px-1 py-1 col-span-${colSpan[cell.column.id]} ${cell.column?.className}  `}
                                        >
                                            {cell.render("Cell")}
                                        </td>
                                    );
                                })}
                            </tr>
                            {
                                /* row.isExpanded */  true ? (
                                    <tr key={idd} className="h-max w-full">
                                        <td >
                                            {renderRowSubComponent({ row, categoria })}
                                        </td>
                                    </tr>
                                ) : null
                            }
                        </>

                    );
                }) : <tbody className='h-[50px] capitalize flex items-center justify-center text-azulCorporativo bg-white'>
                    <tr>
                        <td colSpan={16}>No hay datos disponibles.</td>
                    </tr>
                </tbody>}
            </tbody>
        </table>
        //</div >
    )
}

const SubComponenteTable = ({ row, data = [], categoria, visibleColumns }) => {
    const { user, config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [showMenu, setShowMenu] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const toast = useToast()
    const menuRef = useRef(null);
    const idd = useId();

    const options = [
        {
            title: "Insertar Item arriba"
        },
        {
            title: "Insertar Item abajo"
        }
    ]
    useEffect(() => {
        const handleClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);

    const columns = useMemo(
        () => [
            {
                Header: "Part. de Gasto",
                accessor: "columna1",
                id: "columna1",
                //Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"string"} {...props} />
            },
            {
                Header: "Und.",
                accessor: "unidad",
                id: "unidad",
                Cell: (data) => {
                    const dataCategoria = categoria?.gastos_array.find((item) => item.items_array.some((item) => item._id == data.row.original._id));
                    const [show, setShow] = useState(false);
                    const Lista = [
                        { title: "xUni." },
                        { title: "xInv." },
                        { title: "xAdultos." },
                        { title: "xNiños." },
                    ]

                    const handleChange = (value) => {
                        fetchApiEventos({
                            query: queries.editItemGasto,
                            variables: {
                                evento_id: event?._id,
                                categoria_id: categoria?._id,
                                gasto_id: dataCategoria?._id,
                                itemGasto_id: data.row.original._id,
                                variable: "unidad",
                                valor: value
                            }
                        }).then((result: estimate) => {
                            const f1 = result?.categorias_array.findIndex((item) => item._id == categoria?._id);
                            const f2 = result?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                            const dataRelult = result?.categorias_array[f1]?.gastos_array[f2]?.items_array.find((item) => item._id == data.row.original._id);
                            setEvent((old) => {
                                const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                                const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                                const f3 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array.findIndex((item) => item._id == data.row.original._id);
                                old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3] = dataRelult
                                return ({ ...old })
                            })
                            //toast("success", t("item actualizado con exito"))
                        }).catch((error) => {
                            console.log(error);
                        })
                    }
                    return (
                        <>
                            <ClickAwayListener onClickAway={() => show && setShow(false)}>
                                <div onClick={() => setShow(!show)} className="cursor-pointer w-full h-6 flex items-center justify-center text-xs">
                                    <span className="flex items-center justify-center  text-right w-full relative"> {data.value}</span>
                                    {
                                        show && (
                                            <div className="absolute  top-8 bg-white z-50 rounded-md shadow-md">
                                                {Lista.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleChange(item.title)}
                                                        className="px-3 py-1.5 hover:bg-base transition flex gap-2 text-gray-600 cursor-pointer "
                                                    >
                                                        <p className=''>
                                                            {item.title}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </div>

                            </ClickAwayListener>
                        </>

                    )
                },
            },
            {
                Header: "Can.",
                accessor: "cantidad",
                id: "cantidad",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"cantidad"} table={"subtable"} {...props} />
            },
            {
                Header: "Item",
                accessor: "nombre",
                id: "nombre",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"string"} table={"subtable"}  {...props} />

            },
            {
                Header: "Velor Unitario",
                accessor: "valor_unitario",
                id: "valor_unitario",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"number"} table={"subtable"} {...props} />
            },
            {
                Header: "Total",
                accessor: "total",
                id: "total",
                Cell: (data) => {
                    const dataCategoria = categoria?.gastos_array.find((item) => item.items_array.some((item) => item._id == data.row.original._id));
                    const total = data.row.original.cantidad * data.row.original.valor_unitario
                    const f1Event = event?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                    const f2Event = event?.presupuesto_objeto?.categorias_array[f1Event]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                    const f3Event = event?.presupuesto_objeto?.categorias_array[f1Event]?.gastos_array[f2Event]?.items_array.findIndex((item) => item._id == data.row.original._id);
                    if (event.presupuesto_objeto.categorias_array[f1Event].gastos_array[f2Event] === undefined) {
                        null
                    } else {
                        event.presupuesto_objeto.categorias_array[f1Event].gastos_array[f2Event].items_array[f3Event].total = total
                    }

                    useEffect(() => {
                        fetchApiEventos({
                            query: queries.editItemGasto,
                            variables: {
                                evento_id: event?._id,
                                categoria_id: categoria?._id,
                                gasto_id: dataCategoria?._id,
                                itemGasto_id: data.row.original._id,
                                variable: "total",
                                valor: total
                            }
                        }).then((result) => {

                        }).catch((error) => {
                            console.log(error);
                        })
                    }, [total])
                    return (
                        <span className="flex items-center justify-end capitalize text-right w-full">
                            {getCurrency(total, event?.presupuesto_objeto?.currency)}
                        </span>
                    )
                },
            },
            {
                Header: "Coste Estimado",
                accessor: "columna2",
                id: "columna2",
            },
            {
                Header: "Pagado",
                accessor: "columna3",
                id: "columna3",
            },
            {
                Header: "Pnd. por Pagar",
                accessor: "columna4",
                id: "columna4",
            },
            {
                Header: "",
                accessor: "options",
                id: "options",
                Cell: (props) => {
                    const [showItem, setShowItem] = useState(props?.row?.original.estatus === null ? false : props?.row?.original.estatus);
                    const dataCategoria = categoria?.gastos_array.find((item) => item.items_array.some((item) => item._id == props.row.original._id));

                    const Lista = [
                        {
                            icon: showItem ? <GoEye className="w-4 h-4" /> : <GoEyeClosed className="w-4 h-4" />,
                            title: "Estado",
                            onClick: () => handleChangeState()
                        },
                        {
                            icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
                            title: "Borrar",
                            onClick: () => handleBorrarItem()
                        },
                    ];
                    const handleBorrarItem = () => {
                        fetchApiEventos({
                            query: queries.borrarItemsGastos,
                            variables: {
                                evento_id: event?._id,
                                categoria_id: categoria?._id,
                                gasto_id: dataCategoria?._id,
                                itemsGastos_ids: [props.row.original._id]
                            }
                        }).then((result: estimate) => {
                            const f1 = result?.categorias_array.findIndex((item) => item._id == categoria?._id);
                            const f2 = result?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                            const dataRelult = result?.categorias_array[f1]?.gastos_array[f2]?.items_array
                            setEvent((old) => {
                                const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                                const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                                if (old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array) {
                                    old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array = dataRelult;
                                }
                                return { ...old, }
                            });
                            toast("success", t("Eliminado con exito"))
                        }).catch((error) => {
                            console.log(error);
                        })
                    }
                    const handleChangeState = () => {
                        fetchApiEventos({
                            query: queries.editItemGasto,
                            variables: {
                                evento_id: event?._id,
                                categoria_id: categoria?._id,
                                gasto_id: dataCategoria?._id,
                                itemGasto_id: props?.row?.original?._id,
                                variable: "estatus",
                                valor: !showItem
                            }
                        }).then((result: estimate) => {
                            const f1 = result?.categorias_array.findIndex((item) => item._id == categoria?._id);
                            const f2 = result?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                            const dataRelult = result?.categorias_array[f1]?.gastos_array[f2]?.items_array.find((item) => item._id == props.row.original._id);
                            setEvent((old) => {
                                const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                                const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == dataCategoria?._id);
                                const f3 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array.findIndex((item) => item._id == props.row.original._id);
                                old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3].estatus = dataRelult?.estatus
                                return { ...old, }
                            })
                            toast("success", t("item actualizado con exito"))
                        }).catch((error) => {
                            console.log(error);
                        })
                    }

                    return (
                        <div className="absolute right-0 z-10 flex items-center">
                            {showItem ?
                                <GoEye className="w-5 h-5" />
                                : null}
                            <PresupuestoSelectionMenuTable data={props} categoria={categoria} OptionList={Lista} />
                        </div>
                    );
                },
            },
        ],
        [categoria, event?.presupuesto_objeto?.currency, event]
    );
    const colSpan = {
        columna1: 3,
        unidad: 1,
        cantidad: 1,
        nombre: 3,
        valor_unitario: 2,
        total: 2,
        columna2: 2,
        columna3: 2,
        columna4: 2,
        options: 1
    };

    const { getTableBodyProps, prepareRow, rows } = useTable({ columns, data }, useExpanded);

    return (
        <table className="w-full">
            {
                <tbody {...getTableBodyProps()} className=" bg-slate-50 w-full ">
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <>
                                <tr
                                    key={idd}
                                    {...row.getRowProps()}
                                    className="w-full  border-b border-base hover:bg-base grid grid-cols-19 px-2 relative "
                                >
                                    {

                                        row.cells.map((cell, i) => {
                                            return (
                                                <td
                                                    key={idd}
                                                    {...cell.getCellProps()}
                                                    className={` pr-2 font-display text-xs w-full text-left py-2 col-span-${colSpan[cell.column.id]}`}
                                                >
                                                    {cell.render("Cell")}
                                                </td>
                                            );
                                        })
                                    }
                                </tr>
                                {/* {showMenu && (
                                    <div
                                        ref={menuRef}
                                        style={{
                                            top: (position.y - 290),
                                            left: (position.x - 290),
                                            backgroundColor: 'white',
                                        }}
                                        className='flex flex-col shadow-sm rounded-md truncate z-50 absolute '
                                    >
                                        {
                                            options.map((item, idx) => {
                                                return (
                                                    <button className='cursor-pointer hover:bg-slate-100 p-2 ' key={idd}>
                                                        {item.title}
                                                    </button>
                                                )
                                            })
                                        }
                                    </div>
                                )} */}
                            </>
                        );
                    })}
                </tbody>
            }
        </table>
    )
}

const ResumenInvitados = ({ }) => {
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const totalSegun = (prop, param) => {
        return event?.invitados_array?.filter((item) => item[prop] == param);
    };
    const ObjInvitado = {
        total: event?.invitados_array?.length,
    };
    return (

        <div style={{ minWidth: '100px' }} className="  gap-4 CuadroInvitados flex  items-center justify-center h-full w-full  md:p-4 mt-1  rounded-md shadow-md bg-white">
            <div className="flex gap-1 items-center justify-end ">
                <p className="font-display font-semibold text-2xl md:text-4xl text-primary">
                    {ObjInvitado?.total}
                </p>
                <p className="font-display text-sm md:text-[16px] text-primary">{t("Invitados")}</p>
            </div>
            <div className="flex flex-col items-start justify-center gap-1 ">
                <p className="font-display font-semibold text-xs text-gray-500 flex gap-1">
                    {totalSegun("grupo_edad", "adulto")?.length}{" "}
                    <span className="text-xs font-light">{t("adults")}</span>
                </p>
                <p className="font-display font-semibold text-xs text-gray-500 flex gap-1">
                    {totalSegun("grupo_edad", "niño")?.length}{" "}
                    <span className="text-xs font-light">{t("childrenandbabies")}</span>
                </p>
            </div>
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
        </div>

    )
}