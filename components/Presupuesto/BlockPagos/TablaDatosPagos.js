import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { GrDocumentDownload } from "react-icons/gr";
import { PiTrashSimple } from "react-icons/pi";
import DataTable from "./DataTable";
import { EventContextProvider } from "../../../context";
import { getCurrency } from "../../../utils/Funciones";
import FormEditarPago from "../../Forms/FormEditarPago";
import { EditarIcon } from "../../icons";
import { capitalize } from "../../../utils/Capitalize";
import { useAllowed } from "../../../hooks/useAllowed";
import { GrDocumentMissing } from "react-icons/gr";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { Variable } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "../../../api";

const TablaDatosPagos = ({ estado, getId, setGetId, cate, showSoporte, setShowSoporte }) => {
    const { t } = useTranslation();
    const { event, setEvent } = EventContextProvider()
    const categorias = event?.presupuesto_objeto?.categorias_array;
    const [PagosOrFormAdd, setShowPagos] = useState(true)
    const [PagoID, setPagoID] = useState("")
    const [GastoID, setGastoID] = useState("")
    const [isAllowed, ht] = useAllowed()

    const Columna = useMemo(
        () =>
            [
                {
                    Header: "state",
                    accessor: "estado",
                    id: "estado",
                    Cell: (props) => {
                        const [value, setValue] = useState(props?.value);
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="grid place-items-center h-full w-full">
                                <p
                                    className={`${value == "pendiente" ? "text-red" : "text-green"
                                        } font-display font-medium capitalize`}
                                >
                                    {value}
                                </p>
                            </div>
                        );
                    },
                },
                {
                    Header: "supplier",
                    accessor: "nombreGasto",
                    id: "gasto",
                    Cell: (props) => {
                        const [value, setValue] = useState();
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="w-full flex flex-col justify-center h-full ">
                                <p className="font-display font-semibold text-gray-500 text-[14px] leading-5 ">
                                    {capitalize(value)} <br />
                                    <span className="text-xs font-light">{capitalize(props?.row?.original?.nombreCategoria)}</span>
                                </p>
                            </div>
                        );
                    },
                },
                {
                    Header: "paymentdate",
                    accessor: "fecha_pago",
                    id: "detalles",
                    Cell: (props) => {
                        const [value, setValue] = useState();
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="font-display text-gray-500 flex items-center justify-center flex-col h-full">
                                {value && <p className="w-full"> {value}</p>}
                            </div>
                        );
                    },
                },
                {
                    Header: "amount",
                    accessor: "importe",
                    id: "importe",
                    Cell: (props) => {
                        const [value, setValue] = useState(props?.value);
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="font-display font-semibold text-gray-500 text-[15px] grid place-items-center h-full ">
                                <p className="w-4/5">{getCurrency(value)}</p>
                            </div>
                        );
                    },
                },
                {
                    Header: "paymentmethod",
                    accessor: "medio_pago",
                    id: "medio_pago",
                    Cell: (props) => {
                        const [value, setValue] = useState(props?.value);
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className=" text-gray-500 grid place-items-center h-full truncate ">
                                <p className="">{value ? value : "sin medo de pago"}</p>
                            </div>
                        );
                    },
                },
                {
                    Header: "concept",
                    accessor: "concepto",
                    id: "concepto",
                    Cell: (props) => {
                        const [value, setValue] = useState(props?.value);
                        const [showName, setShowName] = useState()
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="text-gray-500 grid place-items-center h-full  relative ">
                                <div>
                                    {value ? value : "Sin concepto"}
                                </div>
                            </div>
                        );
                    },
                },
                {
                    Header: "Acciones",
                    accessor: "acciones",
                    id: "acciones",
                    Cell: (props) => {
                        const handleSoporte = () => {
                            if (props?.row?.original?.soporte?.image_url != null) {
                                setShowSoporte({ state: true, data: props?.row?.original?.soporte?.image_url })
                            }
                        }
                        const handleEdit = () => {
                            try {
                                setShowPagos(!PagosOrFormAdd)
                            } catch (error) {
                                console.log(error)
                            } finally {
                                setPagoID(props?.row?.original?._id)
                                setGetId(props?.row?.original?.idGasto)
                                setGastoID(props?.row?.original?.idGasto)
                            }
                        }
                        const handleDelete = async () => {
                            const dataProp = props.row.original

                            let data;
                            const params = {
                                query: `mutation {
                                borraPago(evento_id:"${event?._id}", categoria_id: "${dataProp.idCategoria}", gasto_id: "${dataProp.idGasto}", pago_id: "${dataProp._id}"){
                                  pagado
                                  categorias_array{
                                    pagado
                                    gastos_array{
                                      pagado
                                    }
                                  }
                                }
                              }`,
                                variables: {},
                            };

                            try {
                                const { data: res } = await api.ApiApp(params);
                                data = res.data.borraPago;
                            } catch (error) {
                                console.log(error);
                            } finally {

                                setEvent((old) => {
                                    // Encontrar posicion de la categoria en el array categorias
                                    const idxCategoria =
                                        old?.presupuesto_objeto?.categorias_array?.findIndex(
                                            (item) => item._id == dataProp.idCategoria
                                        );

                                    const idxGastos = old?.presupuesto_objeto?.categorias_array[
                                        idxCategoria
                                    ]?.gastos_array?.findIndex((item) => item._id == dataProp.idGasto);

                                    // Sustraer el gasto a eliminar del array de gastos
                                    const filterPagosArray = old?.presupuesto_objeto?.categorias_array[
                                        idxCategoria
                                    ]?.gastos_array[idxGastos]?.pagos_array?.filter(
                                        (item) => item._id !== dataProp._id
                                    );

                                    //Actualizar pagado del evento
                                    old.presupuesto_objeto.pagado = data?.pagado;

                                    //Actualizar pagado de la categoria
                                    old.presupuesto_objeto.categorias_array[idxCategoria].pagado =
                                        data?.categorias_array[0]?.pagado;

                                    //Actualizar pagado del gasto
                                    old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[
                                        idxGastos
                                    ].pagado = data?.categorias_array[0]?.gastos_array[0]?.pagado;

                                    // Sobrescribir arr de pagos anterior por el nuevo
                                    old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[
                                        idxGastos
                                    ].pagos_array = filterPagosArray;

                                    toast("success", t("success"))

                                    return { ...old };
                                });
                            }
                        }

                        return (
                            <div className="flex items-center justify-center gap-2 h-full">
                                {props?.row?.original?.soporte?.image_url
                                    ? <div onClick={handleSoporte} className="flex items-center justify-center p-1  hover:bg-gray-300 rounded-md cursor-pointer ">
                                        <GrDocumentDownload className="w-4 h-4" />
                                    </div>
                                    : <div onClick={handleSoporte} className="flex items-center justify-center p-1  hover:bg-gray-300 rounded-md cursor-not-allowed ">
                                        <GrDocumentMissing className="w-4 h-4 " />
                                    </div>
                                }
                                <div onClick={() => !isAllowed() ? ht() : handleEdit()} className="flex items-center justify-center h-full cursor-pointer mb-[2px] ml-[2px]">
                                    <EditarIcon className="w-6 h-6 p-0.5  hover:bg-gray-300 rounded-md" />
                                </div>
                                <button onClick={() => handleDelete()} className=" flex items-center justify-center p-0.5  hover:bg-gray-300 rounded-md">
                                    <PiTrashSimple className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    },
                },
            ],
        [event?.presupuesto_objeto?.currency]
    );

    const Columna2 = useMemo(
        () =>
            [
                {
                    Header: "state",
                    accessor: "estado",
                    id: "estado",
                    Cell: (props) => {
                        const [value, setValue] = useState(props?.value);
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="grid place-items-center h-full w-full">
                                <p
                                    className={`${value == "pendiente" ? "text-red" : "text-green"
                                        } font-display font-medium capitalize`}
                                >
                                    {value}
                                </p>
                            </div>
                        );
                    },
                },
                {
                    Header: "supplier",
                    accessor: "nombreGasto",
                    id: "gasto",
                    Cell: (props) => {
                        const [value, setValue] = useState();
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="w-full flex flex-col justify-center h-full ">
                                <p className="font-display font-semibold text-gray-500 text-[14px] leading-5 ">
                                    {capitalize(value)} <br />
                                    <span className="text-xs font-light">{capitalize(props?.row?.original?.nombreCategoria)}</span>
                                </p>
                            </div>
                        );
                    },
                },
                {
                    Header: "futurepaymentdate",
                    accessor: "fecha_pago",
                    id: "detalles",
                    Cell: (props) => {
                        const [value, setValue] = useState();
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="font-display text-gray-500 flex items-center justify-center flex-col h-full">
                                {value && <p className="w-full"> {value}</p>}
                            </div>
                        );
                    },
                },
                {
                    Header: "concept",
                    accessor: "concepto",
                    id: "concepto",
                    Cell: (props) => {
                        const [value, setValue] = useState(props?.value);
                        useEffect(() => {
                            setValue(props?.value)
                        }, [props?.value])
                        return (
                            <div className="text-gray-500 grid place-items-center h-full ">
                                <p className="w-4/5">{value ? value : "Sin concepto"}</p>
                            </div>
                        );
                    },
                },
                {
                    Header: "Acciones",
                    accessor: "acciones",
                    id: "acciones",
                    Cell: (props) => {
                        const handleSoporte = () => {
                            if (props?.row?.original?.soporte?.image_url != null) {
                                setShowSoporte({ state: true, data: props?.row?.original?.soporte?.image_url })
                            }
                        }
                        const handleEdit = () => {
                            try {
                                setShowPagos(!PagosOrFormAdd)
                            } catch (error) {
                                console.log(error)
                            } finally {
                                setPagoID(props?.row?.original?._id)
                                setGetId(props?.row?.original?.idGasto)
                            }
                        }
                        const handleDelete = async () => {
                            const dataProp = props.row.original

                            let data;
                            const params = {
                                query: `mutation {
                                borraPago(evento_id:"${event?._id}", categoria_id: "${dataProp.idCategoria}", gasto_id: "${dataProp.idGasto}", pago_id: "${dataProp._id}"){
                                  pagado
                                  categorias_array{
                                    pagado
                                    gastos_array{
                                      pagado
                                    }
                                  }
                                }
                              }`,
                                variables: {},
                            };

                            try {
                                const { data: res } = await api.ApiApp(params);
                                data = res.data.borraPago;
                            } catch (error) {
                                console.log(error);
                            } finally {
                                setEvent((old) => {
                                    // Encontrar posicion de la categoria en el array categorias
                                    const idxCategoria =
                                        old?.presupuesto_objeto?.categorias_array?.findIndex(
                                            (item) => item._id == dataProp.idCategoria
                                        );

                                    const idxGastos = old?.presupuesto_objeto?.categorias_array[
                                        idxCategoria
                                    ]?.gastos_array?.findIndex((item) => item._id == dataProp.idGasto);

                                    // Sustraer el gasto a eliminar del array de gastos
                                    const filterPagosArray = old?.presupuesto_objeto?.categorias_array[
                                        idxCategoria
                                    ]?.gastos_array[idxGastos]?.pagos_array?.filter(
                                        (item) => item._id !== dataProp._id
                                    );

                                    //Actualizar pagado del evento
                                    old.presupuesto_objeto.pagado = data?.pagado;

                                    //Actualizar pagado de la categoria
                                    old.presupuesto_objeto.categorias_array[idxCategoria].pagado =
                                        data?.categorias_array[0]?.pagado;

                                    //Actualizar pagado del gasto
                                    old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[
                                        idxGastos
                                    ].pagado = data?.categorias_array[0]?.gastos_array[0]?.pagado;

                                    // Sobrescribir arr de pagos anterior por el nuevo
                                    old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[
                                        idxGastos
                                    ].pagos_array = filterPagosArray;
                                    toast("success", t("success"))
                                    return { ...old };
                                });
                            }
                        }

                        return (
                            <div className="flex items-center justify-center gap-2 h-full">
                                {props?.row?.original?.soporte?.image_url
                                    ? <div onClick={handleSoporte} className="flex items-center justify-center p-1  hover:bg-gray-300 rounded-md cursor-pointer ">
                                        <GrDocumentDownload className="w-4 h-4" />
                                    </div>
                                    : <div onClick={handleSoporte} className="flex items-center justify-center p-1  hover:bg-gray-300 rounded-md cursor-not-allowed ">
                                        <GrDocumentMissing className="w-4 h-4 " />
                                    </div>
                                }
                                <div onClick={() => !isAllowed() ? ht() : handleEdit()} className="flex items-center justify-center h-full cursor-pointer mb-[2px] ml-[2px]">
                                    <EditarIcon className="w-6 h-6 p-0.5  hover:bg-gray-300 rounded-md" />
                                </div>
                                <button onClick={() => handleDelete()} className=" flex items-center justify-center p-0.5  hover:bg-gray-300 rounded-md">
                                    <PiTrashSimple className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    },
                },
            ],
        [event?.presupuesto_objeto?.currency]
    );

    const data = categorias?.reduce((acc, categoria) => {
        if (categoria?.gastos_array?.length >= 1) {
            const reduce = categoria?.gastos_array?.reduce((arr, gasto) => {
                if (gasto?.pagos_array?.length >= 1) {
                    const reducePagos = gasto?.pagos_array?.reduce((arrPagos, pago) => {
                        const objetoNuevo = {
                            ...pago,
                            idCategoria: categoria?._id,
                            nombreCategoria: categoria?.nombre,
                            idGasto: gasto?._id,
                            nombreGasto: gasto?.nombre
                        }
                        arrPagos?.push(objetoNuevo);
                        return arrPagos
                    }, [])
                    arr = [...arr, ...reducePagos]
                }
                return arr;
            }, []);
            if (reduce.length >= 1) {
                acc = [...acc, ...reduce];
            }
        }
        return acc;
    }, []);

    const dataFilter = data.filter((elemnt) => elemnt.estado == estado)
    console.log("cate main", data)

    return (
        <>
            {PagosOrFormAdd
                ? <DataTable columns={estado == "pagado" ? Columna : Columna2} data={dataFilter} estado={estado} />
                : (
                    <div className="bg-white  p-6">
                        <p onClick={() => setShowPagos(!PagosOrFormAdd)} className="absolute font-display text-xl transform transition top-5 right-5 text-gray-500 hover:scale-125 cursor-pointer">X</p>
                        <FormEditarPago getId={getId} categorias={cate} ListaPagos={data} IDPagoAModificar={PagoID} IDGastoAModificar={GastoID} set={act => setShowPagos(act)} state={PagosOrFormAdd} />
                    </div>
                )
            }
        </>
    )
};

export default TablaDatosPagos; 