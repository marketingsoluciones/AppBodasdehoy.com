import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockListaCategorias } from '../../pages/presupuesto';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { t } from 'i18next';
import { CanceladoIcon, ConfirmadosIcon, DotsOpcionesIcon, PencilEdit, PendienteIcon, PlusIcon } from '../icons';
import { getCurrency } from '../../utils/Funciones';
import ClickAwayListener from 'react-click-away-listener';
import { useToast } from '../../hooks/useToast';
import { useAllowed } from '../../hooks/useAllowed';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { GoArrowRight, GoEye, GoTasklist } from 'react-icons/go';
import { RiBillLine } from 'react-icons/ri';
import CellEditCopy from './CellEditCopy';
import { useExpanded, useTable } from "react-table";
import { GrMoney } from "react-icons/gr";
import Grafico from './Grafico';
import { config, title } from 'process';
import { fetchApiBodas, fetchApiEventos, queries } from '../../utils/Fetching';
import { item, expenses, estimate } from "../../utils/Interfaces";
import { PiNewspaperClippingLight } from "react-icons/pi";
import FormAddPago from '../Forms/FormAddPago';
import { Modal } from '../Utils/Modal';


interface Categoria {
    _id: string;
    nombre: string;
    gastos_array: any;
    pagado: number;
    coste_estimado: number;
    coste_final: number;

}

export const ExcelView = ({ set, categorias_array, showCategoria }) => {
    const { event, setEvent } = EventContextProvider()
    const [categoria, setCategoria] = useState<Categoria>(null);
    const [data, setData] = useState([]);
    const [GastoID, setGastoID] = useState({ id: "", crear: false })
    const [isMounted, setIsMounted] = useState([false, ""]);
    const [hoveredIndex, setHoveredIndex] = useState({ idx: null, item: null });
    const [edit, setEdit] = useState(false);
    const [menuIzquierdo, setMenuIzquierdo] = useState(false)
    const [menuDerecho, setMenuDerecho] = useState(false)
    const cate = showCategoria?.id
    const [showFormPago, setShowFormPago] = useState({ id: "", state: false })
    const totalCosteFinal = categoria?.gastos_array?.reduce((total, item) => total + item.coste_final, 0)
    const totalpagado = categoria?.gastos_array?.reduce((total, item) => total + item.pagado, 0)
    const totalPendientePagado = categoria?.gastos_array?.reduce((total, item) => total + item.pagado, 0)


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
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            {
                showFormPago.state && (
                    <Modal classe={"w-[750px] h-[90%] p-4 "} >
                        <div className="font-display text-gray-500 hover:text-gray-300 transition text-lg absolute top-5 right-5 cursor-pointer hover:scale-125" onClick={() => setShowFormPago({ id: "", state: false })}>X</div>
                        <FormAddPago GastoID={showFormPago?.id} cate={categoria?._id} setShowFormPago={setShowFormPago} />
                    </Modal>
                )
            }

            <div className="flex pl-3 h-[calc( 100vh-300px )] relative " >
                <div className="bg-transparent absolute h-full py-3 -top-12 left-0-" >
                    <button onClick={() => setMenuIzquierdo(!menuIzquierdo)} className="bg-white border border-primary rounded-r-md w-7 h-7 flex items-center justify-center">
                        <GoArrowRight className={` ${menuIzquierdo === true ? "" : "rotate-180"} h-5 w-5 transition-all`} />
                    </button>
                </div>
                <div className="bg-transparent absolute h-full py-3 -top-12 right-0" >
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
                <div className="flex-1 flex flex-col items-center">
                    <div className=' rounded-t-md w-full text-center capitalize bg-primary text-white py-1 ' >
                        {categoria?.nombre ? categoria?.nombre : "Categoria"}
                    </div>
                    <TablePorProveedor data={data} categoria={categoria} set={setShowFormPago} />
                    <div className="flex px-3 w-full bg-slate-200  justify-items-center py-1 rounded-b-md ">
                        <div
                            onClick={() => AddGasto()}
                            className="font-display text-sm- text-primary w-full  flex gap-2 items-center cursor-pointer  col-span-2 "
                        >
                            <PlusIcon /> Añadir Part. de Gasto
                        </div>
                        <div className="w-full flex text-sm items-center justify-end" >
                            <label className='mr-2'>Valor Total:</label> {getCurrency(totalCosteFinal, event?.presupuesto_objeto?.currency)}
                        </div>
                        <div className=" w-full flex text-sm items-center justify-end" >
                            <label className='mr-2'> Valor Total Estimado:</label> {getCurrency(totalCosteEstimado, event?.presupuesto_objeto?.currency)}
                        </div>
                        <div className=" w-full flex text-sm items-center justify-end  " >
                            <label className='mr-2'>Total Pagado:</label> {getCurrency(totalpagado, event?.presupuesto_objeto?.currency)}
                        </div>
                        <div className=" w-full flex text-sm items-center justify-end " >
                            <label className='mr-2'>Total Pendiente:</label> {getCurrency(totalCosteFinal - totalpagado, event?.presupuesto_objeto?.currency)}
                        </div>
                    </div>
                </div>
                <div className={`${menuDerecho ? "hidden " : " w-[15%] flex  items-center flex-col pl-4"} transition-all`}>
                    <h2 className="font-display pb-2 text-xl text-gray-500 font-semibold text-center w-full">
                        {t("howost")}
                    </h2>
                    <Grafico categorias={categorias_array} />
                </div>
            </div>

        </>

    );
};

const TablePorProveedor = ({ data, categoria, set }) => {
    const { event, setEvent } = EventContextProvider()
    const toast = useToast()
    const columnsWithItems = useMemo(
        () => [
            {
                Header: "Part. de Gasto",
                accessor: "nombre",
                id: "nombre",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"string"} {...props} />
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
                    const [value, setValue] = useState(props?.value);
                    const data = props?.row.original.items_array
                    const sumaTotal = data.reduce((total, item) => total + item.total, 0)
                    useEffect(() => {
                        setValue(props?.value)
                    }, [props?.value])

                    if (data.length === 0) {
                        return (
                            <CellEditCopy categoriaID={categoria?._id} type={"number"} {...props} />
                        )
                    }
                    if (data.length > 0) {
                        return (
                            <div className="font-display  text-gray-500 text-[15px] grid place-items-center h-full text-end ">
                                <p className="w-full">{getCurrency(sumaTotal, event?.presupuesto_objeto?.currency)}</p>
                            </div>
                        );
                    }
                },
            },
            {
                Header: "Coste Estimado",
                accessor: "coste_estimado",
                id: "coste_estimado",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"number"} {...props} />
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
                        <div className="font-display text-gray-500 text-[15px] grid place-items-center h-full text-end ">
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
                    useEffect(() => {

                        if (props.row.original.coste_final === 0) {
                            setValue(0)
                        }
                        if (props.row.original.coste_final > 0) {
                            setValue(props.row.original.coste_final - props.row.original.pagado)
                        }
                    }, [props?.row.original])
                    return (
                        <div className="font-display text-gray-500 text-[15px] grid place-items-center h-full text-end ">
                            <p className="w-full">{getCurrency(value, event?.presupuesto_objeto?.currency)}</p>
                        </div>
                    );
                },
            },
            {
                Header: "",
                accessor: "options",
                id: "options",
                Cell: (props) => {
                    const [show, setShow] = useState(false);
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
                                // Encontrar posicion de la categoria en el array categorias
                                const idxCategoria = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria._id);
                                // Sustraer el gasto a eliminar del array de gastos
                                const filterGastos = old?.presupuesto_objeto?.categorias_array[idxCategoria].gastos_array?.filter((item) => item._id !== props?.row?.original?._id
                                );
                                //Actualizar estimado, final y pagado del evento
                                old.presupuesto_objeto.coste_estimado = data?.coste_estimado
                                old.presupuesto_objeto.coste_final = data?.coste_final
                                old.presupuesto_objeto.pagado = data?.pagado
                                //Actualizar estimado, final y pagado de la categoria
                                old.presupuesto_objeto.categorias_array[idxCategoria].coste_estimado = data?.categorias_array[0]?.coste_estimado
                                old.presupuesto_objeto.categorias_array[idxCategoria].coste_final = data?.categorias_array[0]?.coste_final
                                old.presupuesto_objeto.categorias_array[idxCategoria].pagado = data?.categorias_array[0]?.pagado
                                // Sobrescribir arr de gastos anterior por el nuevo
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
                                    unidad: "xUni."
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

                    const Lista = [
                        {
                            icon: <GrMoney className="w-4 h-4" />,
                            title: "Pago",
                            function: () => handlePago()
                        },
                        {
                            icon: <GoEye className="w-4 h-4" />,
                            title: "Estado",
                            //function: BorrarCategoria
                        },
                        {
                            icon: <GoTasklist className="w-4 h-4" />,
                            title: "Task",
                            //function: BorrarCategoria
                        },
                        {
                            icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
                            title: "Borrar",
                            function: () => handleRemove()
                        },
                        {
                            icon: <PiNewspaperClippingLight className="w-5 h-5" />,
                            title: "Agregar Item",
                            function: () => handleCreateItem()
                        },


                    ];


                    return (
                        <div className='w-full h-full flex items-center justify-end pr-2 relative  '>
                            {
                                Lista.map((item, idx) => {
                                    return (
                                        <div
                                            key={idx}
                                            className='cursor-pointer hover:bg-slate-50 rounded-full p-1'
                                            onClick={item.function && item.function}
                                        >
                                            {item.icon}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    );
                },
            },
        ],
        [categoria, event?.presupuesto_objeto?.currency, event]
    );
    const columnsWithoutItems = useMemo(
        () => [
            {
                Header: "Part. de Gasto",
                accessor: "nombre",
                id: "nombre",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"string"} {...props} />
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
                accessor: "columna5",
                Cell: (props) => {
                    const [value, setValue] = useState(props?.value);
                    useEffect(() => {
                        setValue(props?.value)
                    }, [props?.value])
                    return (
                        <div className="font-display font-semibold text-gray-500 text-[15px] grid place-items-center h-full text-end ">
                            <p className="w-full">{getCurrency(value, event?.presupuesto_objeto?.currency)}</p>
                        </div>
                    );
                },
            },
            {
                Header: "Coste Estimado",
                accessor: "coste_estimado",
                id: "coste_estimado",
                Cell: (props) => {
                    const [value, setValue] = useState(props?.value);
                    useEffect(() => {
                        setValue(props?.value)
                    }, [props?.value])
                    return (
                        <div className="font-display font-semibold text-gray-500 text-[15px] grid place-items-center h-full text-end ">
                            <p className="w-full">{getCurrency(value, event?.presupuesto_objeto?.currency)}</p>
                        </div>
                    );
                },
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
                        <div className="font-display font-semibold text-gray-500 text-[15px] grid place-items-center h-full text-end ">
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
                    const [value, setValue] = useState(props?.value);
                    useEffect(() => {
                        setValue(props?.value)
                    }, [props?.value])
                    return (
                        <div className="font-display font-semibold text-gray-500 text-[15px] grid place-items-center h-full text-end ">
                            <p className="w-full">{getCurrency(value, event?.presupuesto_objeto?.currency)}</p>
                        </div>
                    );
                },
            },
            {
                Header: "",
                accessor: "options",
                id: "options",
                Cell: (props) => {
                    const [show, setShow] = useState(false);
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
                                // Encontrar posicion de la categoria en el array categorias
                                const idxCategoria = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria._id);
                                // Sustraer el gasto a eliminar del array de gastos
                                const filterGastos = old?.presupuesto_objeto?.categorias_array[idxCategoria].gastos_array?.filter((item) => item._id !== props?.row?.original?._id
                                );
                                //Actualizar estimado, final y pagado del evento
                                old.presupuesto_objeto.coste_estimado = data?.coste_estimado
                                old.presupuesto_objeto.coste_final = data?.coste_final
                                old.presupuesto_objeto.pagado = data?.pagado
                                //Actualizar estimado, final y pagado de la categoria
                                old.presupuesto_objeto.categorias_array[idxCategoria].coste_estimado = data?.categorias_array[0]?.coste_estimado
                                old.presupuesto_objeto.categorias_array[idxCategoria].coste_final = data?.categorias_array[0]?.coste_final
                                old.presupuesto_objeto.categorias_array[idxCategoria].pagado = data?.categorias_array[0]?.pagado
                                // Sobrescribir arr de gastos anterior por el nuevo
                                old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array = filterGastos;
                                return { ...old };
                            });
                            toast("success", t("Borrado exitoso"))
                        }
                    };

                    const Lista = [
                        {
                            icon: <GrMoney className="w-4 h-4" />,
                            title: "Pago",
                            //function: EditarCategoria
                        },
                        {
                            icon: <GoEye className="w-4 h-4" />,
                            title: "Estado",
                            //function: BorrarCategoria
                        },
                        {
                            icon: <GoTasklist className="w-4 h-4" />,
                            title: "Task",
                            //function: BorrarCategoria
                        },
                        {
                            icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
                            title: "Borrar",
                            function: () => handleRemove()
                        },
                    ];


                    return (
                        <div className='w-full h-full flex items-center justify-end pr-2 relative space-x-1 '>
                            {
                                Lista.map((item, idx) => {
                                    return (
                                        <div
                                            key={idx}
                                            className='cursor-pointer hover:bg-slate-50 rounded-full p-1'
                                            onClick={item.function && item.function}
                                        >
                                            {item.icon}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    );
                },
            },
        ],
        [categoria, event?.presupuesto_objeto?.currency, event]
    );


    const columns = data.length > 0 ? columnsWithItems : columnsWithoutItems;

    const colSpan = {
        nombre: 2,
        columna1: 1,
        columna2: 1,
        columna3: 3,
        columna4: 1,
        coste_final: 2,
        coste_estimado: 2,
        pagado: 2,
        pendiente_pagar: 2,
        options: 2
    };

    const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows, state: { expanded } } = useTable({ columns, data }, useExpanded);

    const renderRowSubComponent = useCallback(({ row, categoria }) => {
        return (
            <SubComponenteTable row={row} data={row.original.items_array} categoria={categoria} />
        )
    },
        [categoria]
    )

    return (
        <table {...getTableProps()} className="w-full rounded-lg relative bg-slate-50">
            <thead>
                {headerGroups.map((headerGroup, id) => (
                    <tr
                        {...headerGroup.getHeaderGroupProps()}
                        className="w-full grid grid-cols-18 py-2 bg-[#e6e6d7]"
                        key={id}
                    >
                        {headerGroup.headers.map((column, id) => (
                            <th
                                {...column.getHeaderProps()}
                                className={`font-display font-semibold text-gray-500 text-[12.1px] flex items-center justify-center col-span-${colSpan[column.id]
                                    }`}
                                key={id}
                            >
                                {column.render("Header")}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <div className="overflow-y-auto max-h-[500px] w-full">
                <table className="w-full">
                    {
                        data.length > 0 ?
                            <tbody {...getTableBodyProps()} className="text-gray-500 text-sm w-full">
                                {rows.map((row, i) => {
                                    prepareRow(row);
                                    return (
                                        <>
                                            <tr
                                                key={i}
                                                {...row.getRowProps()}
                                                className="w-full border-b border-base grid grid-cols-18 px-2 bg-[#eaecee] "
                                            >
                                                {row.cells.map((cell, i) => {
                                                    return (
                                                        <td
                                                            key={i}
                                                            {...cell.getCellProps()}
                                                            className={` pr-2 font-display text-sm w-full text-left py-2 col-span-${colSpan[cell.column.id]
                                                                }`}
                                                        >
                                                            {cell.render("Cell")}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                            { /* row.isExpanded */ true ? (
                                                <tr key={i} className="h-max w-full">
                                                    <td >
                                                        {renderRowSubComponent({ row, categoria })}
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </>
                                    );
                                })}
                            </tbody>
                            : <div className='h-[500px] capitalize flex items-center justify-center text-azulCorporativo'>
                                selecciona una categoria de la lista
                            </div>
                    }

                </table>
            </div>
        </table>

    )
}

const SubComponenteTable = ({ row, data, categoria }) => {
    const { user, config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [showMenu, setShowMenu] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef(null);
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
    const handleContextMenu = (event) => {
        event.preventDefault();
        setPosition({ x: event.clientX, y: event.clientY });
        setShowMenu(true);
    };
    const columns = useMemo(
        () => [
            {
                Header: "Part. de Gasto",
                accessor: "columna1",
                //Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"string"} {...props} />
            },
            {
                Header: "Und.",
                accessor: "unidad",
                Cell: (data) => {
                    const [show, setShow] = useState(false);
                    const Lista = [
                        { title: "x Uni." },
                        { title: "x Inv." },
                        { title: "x Adultos." },
                        { title: "x Niños." },
                    ]
                    return (
                        <>
                            <ClickAwayListener onClickAway={() => show && setShow(false)}>
                                <div onClick={() => setShow(!show)} className="cursor-pointer w-full h-6 flex items-center justify-center ">
                                    <span className="flex items-center justify-center  text-right w-full relative"> {data.value}</span>
                                    {
                                        show && (
                                            <div className="absolute  top-8 bg-white z-50 rounded-md shadow-md">
                                                {Lista.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        //onClick={() => item.function()}
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
                Cell: /* (data) => {
                    return (
                        <span className="flex items-center justify-center capitalize text-right w-full"> {data.value}</span>
                    )
                }, */
                    (props) => <CellEditCopy categoriaID={categoria?._id} type={"cantidad"} {...props} />
            },
            {
                Header: "Item",
                accessor: "nombre",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"string"} {...props} />

            },
            {
                Header: "Velor Unitario",
                accessor: "valor_unitario",
                id: "valor_unitario",
                Cell: (props) => <CellEditCopy categoriaID={categoria?._id} type={"number"} {...props} />
            },
            {
                Header: "Total",
                accessor: "total",
                Cell: (data) => {
                    const Total = data.row.original.cantidad * data.row.original.valor_unitario
                    return (
                        <span className="flex items-center justify-end capitalize text-right w-full">
                            {getCurrency(Total, event?.presupuesto_objeto?.currency)}
                        </span>
                    )
                },
            },
            {
                Header: "Coste Estimado",
                accessor: "columna2",
            },
            {
                Header: "Pagado",
                accessor: "columna3",
            },
            {
                Header: "Pnd. por Pagar",
                accessor: "columna4",
            },
            {
                Header: "",
                accessor: "options",
                id: "options",
                Cell: (props) => {
                    const [show, setShow] = useState(false);
                    const Lista = [
                        {
                            icon: <GoEye className="w-4 h-4" />,
                            title: "Estado",
                            //function: BorrarCategoria
                        },
                        {
                            icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
                            title: "Borrar",
                            //function: BorrarCategoria
                        },
                    ];

                    /*  const handleRemove = async () => {
                         let data
                         try {
                             const params = {
                                 query: `mutation{
                       borraGasto(evento_id:"${event?._id}", categoria_id: "${cate}", gasto_id: "${props?.row?.original?._id}"){
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
                         } finally {
                             setEvent((old) => {
                                 // Encontrar posicion de la categoria en el array categorias
                                 const idxCategoria =
                                     old?.presupuesto_objeto?.categorias_array.findIndex(
                                         (item) => item._id == cate
                                     );
                                 // Sustraer el gasto a eliminar del array de gastos
                                 const filterGastos = old?.presupuesto_objeto?.categorias_array[
                                     idxCategoria
                                 ].gastos_array?.filter(
                                     (item) => item._id !== props?.row?.original?._id
                                 );
 
                                 //Actualizar estimado, final y pagado del evento
                                 old.presupuesto_objeto.coste_estimado = data?.coste_estimado
                                 old.presupuesto_objeto.coste_final = data?.coste_final
                                 old.presupuesto_objeto.pagado = data?.pagado
 
                                 //Actualizar estimado, final y pagado de la categoria
                                 old.presupuesto_objeto.categorias_array[idxCategoria].coste_estimado = data?.categorias_array[0]?.coste_estimado
                                 old.presupuesto_objeto.categorias_array[idxCategoria].coste_final = data?.categorias_array[0]?.coste_final
                                 old.presupuesto_objeto.categorias_array[idxCategoria].pagado = data?.categorias_array[0]?.pagado
 
                                 // Sobrescribir arr de gastos anterior por el nuevo
                                 old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array = filterGastos;
 
                                 return { ...old };
                             });
                         }
                     }; */

                    return (
                        <div className='w-full h-full flex items-center justify-end pr-2 relative '>
                            {
                                Lista.map((item, idx) => {
                                    return (
                                        <div key={idx} className='cursor-pointer hover:bg-slate-50 rounded-full p-1'>
                                            {item.icon}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    );
                },
            },

        ],
        [categoria, event?.presupuesto_objeto?.currency, event]
    );
    const colSpan = {
        columna1: 2,
        unidad: 1,
        cantidad: 1,
        nombre: 3,
        valor_unitario: 1,
        total: 2,
        columna2: 2,
        columna3: 2,
        columna4: 2,
        options: 2
    };
    const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows, state: { expanded } } = useTable({ columns, data }, useExpanded);

    const handleCreateItem = () => {
        fetchApiEventos({
            query: queries.nuevoItemsGastos,
            variables: {
                evento_id: event?._id,
                categoria_id: categoria?._id,
                gasto_id: row.original._id,
                itemsGastos: [{
                    nombre: "Nuevo Item",
                    cantidad: 1,
                    valor_unitario: 0,
                    total: 0,
                    unidad: "xUni."
                }]
            },
        }).then((result: item) => {
            console.log("result", result)
            setEvent((old) => {
                const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == row.original._id);
                old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array?.push(result)
                return ({ ...old, })
            })
        }).catch((error) => {
            console.log(error);
        })
    }

    return (
        <table className="w-full">
            {
                <tbody {...getTableBodyProps()} className="text-gray-500 text-sm bg-slate-50 w-full ">
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <>
                                <tr
                                    onContextMenu={handleContextMenu}
                                    key={i}
                                    {...row.getRowProps()}
                                    className="w-full  border-b border-base hover:bg-base grid grid-cols-18 px-2 relative "
                                >
                                    {

                                        row.cells.map((cell, i) => {
                                            return (
                                                <td
                                                    key={i}
                                                    {...cell.getCellProps()}
                                                    className={` pr-2 font-display text-sm w-full text-left py-2 col-span-${colSpan[cell.column.id]}`}
                                                >
                                                    {cell.render("Cell")}
                                                </td>
                                            );
                                        })
                                    }
                                </tr>
                                {showMenu && (
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
                                                    <button className='cursor-pointer hover:bg-slate-100 p-2 ' key={idx}>
                                                        {item.title}
                                                    </button>
                                                )
                                            })
                                        }
                                    </div>
                                )}
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
    /* const TotalList = [
        {
            title: `${totalSegun("asistencia", "pendiente")?.length} de ${ObjInvitado?.total
                }`,
            subtitle: "por confirmar",
            icon: <PendienteIcon />,
        },
        {
            title: `${totalSegun("asistencia", "confirmado")?.length} de ${ObjInvitado?.total
                }`,
            subtitle: "confirmados",
            icon: <ConfirmadosIcon />,
        },
        {
            title: `${totalSegun("asistencia", "cancelado")?.length} de ${ObjInvitado?.total
                }`,
            subtitle: "cancelados",
            icon: <CanceladoIcon />,
        },
    ]; */
    return (
        <div className='w-full'>

            <div className="flex gap-10 items-center justify-center h-full w-full md:col-span-2 md:p-4 rounded-md shadow-md bg-white">
                <div className="flex gap-1 items-center justify-end ">
                    <p className="font-display font-semibold text-2xl md:text-4xl text-primary">
                        {ObjInvitado?.total}
                    </p>
                    <p className="font-display text-sm md:text-[16px] text-primary">{t("Invitados")}</p>
                </div>
                <div className="flex flex-col md:gap-1 items-start justify-center h-full col-span-1">
                    <p className="font-display font-semibold text-sm md:text-[16px] text-gray-500 flex gap-1">
                        {totalSegun("grupo_edad", "adulto")?.length}{" "}
                        <span className="text-xs font-light">{t("adults")}</span>
                    </p>
                    <p className="font-display font-semibold text-sm  md:text-[16px] text-gray-500 flex gap-1">
                        {totalSegun("grupo_edad", "niño")?.length}{" "}
                        <span className="text-xs font-light">{t("childrenandbabies")}</span>
                    </p>
                </div>
            </div>
            {/* <div className="bg-white rounded-xl col-span-3 shadow-lg flex  md:items-center pb-1  w-full h-[88px] md:h-auto relative justify-between md:px-10">
                {TotalList.map((item, idx) => (
                    <div key={idx} className={`${idx == 0 ? "hidden md:flex" : "flex"} gap-2 items-center justify-center`}>
                        {item?.icon}
                        <span>
                            <p className="font-display md:text-lg font-semibold text-gray-700 leading-5">
                                {t(item?.title)}
                            </p>
                            <p className="font-display text-xs font-medium text-gray-500">
                                {t(item?.subtitle)}
                            </p>
                        </span>
                    </div>
                ))}
            </div> */}
        </div>
    )
}