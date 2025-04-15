import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { useTable } from "react-table";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import FormEditarPago from "../Forms/FormEditarPago";
import { EditarIcon } from "../icons";
import { capitalize } from '../../utils/Capitalize';
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { GrDocumentDownload } from "react-icons/gr";
import { Modal } from "../Utils/Modal";
import { PiXBold } from "react-icons/pi";



const BlockPagos = ({ getId, setGetId, cate, estado }) => {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [showSoporte, setShowSoporte] = useState({ state: false, data: null })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-screen-lg relative mx-auto inset-x-0    "
    >
      <div className="bg-white p-6 h-max shadow-md rounded-xl    ">
        <TablaDatosPagos
          active={active}
          estado={estado}
          getId={getId}
          setGetId={setGetId}
          cate={cate}
          showSoporte={showSoporte}
          setShowSoporte={setShowSoporte} />
      </div>
      {
        showSoporte.state &&
        <Modal set={setShowSoporte} state={showSoporte.state} classe={"w-[95%] md:w-[450px] max-h-[600px] min-h-[100px]"}>
          <div className="flex flex-col items-center h-full w-full relative">
            <div className="absolute right-3 top-2 cursor-pointer" onClick={() => setShowSoporte({ state: false })}>
              <PiXBold className="w-5 h-5" />
            </div>
            <div className="h-full flex items-center ">
              <img src={showSoporte?.data} alt="Factura de soporte" className="h-[90%] " />
            </div>

          </div>
        </Modal>
      }
    </motion.div>
  );
};

export default BlockPagos;

const TablaDatosPagos = ({ estado, getId, setGetId, cate, showSoporte, setShowSoporte }) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider()
  const categorias = event?.presupuesto_objeto?.categorias_array;
  const [PagosOrFormAdd, setShowPagos] = useState(true)
  const [PagoID, setPagoID] = useState("")
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
                <p className="w-4/5">{getCurrency(value, event?.presupuesto_objeto?.currency)}</p>
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
          Header: "Soporte",
          accessor: "soporte",
          id: "soporte",
          Cell: (props) => {
            return (
              <div className="text-gray-500 grid place-items-center h-full relative ">
                {
                  props?.value?.image_url != null &&
                  <GrDocumentDownload onClick={() => setShowSoporte({ state: true, data: props?.value?.image_url })} className="w-6 h-6 cursor-pointer p-1 hover:shadow-md hover:bg-gray-300 rounded-md" />
                }
              </div>
            );
          },
        },
        {
          Header: "",
          accessor: "editar",
          id: "editar",
          Cell: (props) => {
            const handleEdit = () => {
              try {
                console.log(2222, props)
                setShowPagos(!PagosOrFormAdd)
              } catch (error) {
                console.log(error)
              } finally {
                setPagoID(props?.row?.original?._id)
                setGetId(props?.row?.original?.idGasto)
              }
            }

            return (
              <div onClick={() => !isAllowed() ? ht() : handleEdit()} className="   flex items-center justify-center  h-full right-0  cursor-pointer ">
                <EditarIcon className="w-8 h-8 p-0.5 hover:shadow-md hover:bg-gray-300 rounded-md" />
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
          Header: "",
          accessor: "editar",
          id: "editar",
          Cell: (props) => {
            const handleEdit = () => {
              try {
                setShowPagos(!PagosOrFormAdd)
              } catch (error) {
                console.log(error)
              } finally {
                setPagoID(props?.row?.original?._id)
              }
            }

            return (
              <div onClick={() => !isAllowed() ? ht() : handleEdit()} className=" w-10 rounded-md hover:shadow-md hover:bg-gray-300 grid place-items-center h-full right-0 mx-auto">
                <EditarIcon className="w-5 h-5" />
              </div>
            );
          },
        },
      ],
    [event?.presupuesto_objeto?.currency]
  );

  //Recorrer cada categoria
  const data = categorias?.reduce((acc, categoria) => {
    if (categoria?.gastos_array?.length >= 1) {
      // Recorrer cada gasto
      const reduce = categoria?.gastos_array?.reduce((arr, gasto) => {
        if (gasto?.pagos_array?.length >= 1) {

          // Recorrer cada pago
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

  return (
    <>
      {PagosOrFormAdd
        ? <DataTable columns={estado == "pagado" ? Columna : Columna2} data={dataFilter} estado={estado} />
        : (
          <div className="bg-white  p-6">
            <p onClick={() => setShowPagos(!PagosOrFormAdd)} className="absolute font-display text-xl transform transition top-5 right-5 text-gray-500 hover:scale-125 cursor-pointer">X</p>
            <FormEditarPago getId={getId} categorias={cate} ListaPagos={data} IDPagoAModificar={PagoID} set={act => setShowPagos(act)} state={PagosOrFormAdd} />
          </div>
        )
      }

    </>
  )
};

const DataTable = ({ columns, data, estado }) => {
  const { t } = useTranslation()

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data });

  const [stado, setStado] = useState({})

  const colSpan = {
    0: 2,
    1: 4,
    2: 3,
    3: 4,
    4: 3,
    5: 4,
    6: 3,
    7: 1
  };

  const colSpan1 = {
    0: 1,
    1: 2,
    2: 3,
    3: 2,
    4: 1,
  };
  useEffect(() => {
    if (estado == "pagado") {
      setStado(colSpan)
    } else {
      setStado(colSpan1)
    }
  }, [estado])

  const colSpanMovil = {
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1,
  };


  return (
    <div className="w-full  ">
      <table {...getTableProps()} className="table w-full rounded-lg relative overflow-x-auto    ">
        <thead className="w-full  ">
          {headerGroups.map((headerGroup, id) => (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              key={id}
              className={`w-full grid grid-cols-4 ${estado == "pagado" ? "md:grid-cols-24" : "md:grid-cols-9"} py-2 bg-base uppercase`}
            >
              {headerGroup.headers.map((column, idx) => (
                <th
                  {...column.getHeaderProps()}
                  key={idx}
                  className={`font-display  font-light text-gray-500 text-sm col-span-${colSpanMovil[idx]} md:col-span-${stado[idx]} `}
                >
                  {t(column.render("Header"))}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()} className="text-gray-500 text-sm  overflow-x-auto   ">
          {rows.length >= 1 ? rows.map((row, id) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                key={id}
                className={`transition border-b border-base hover:bg-base cursor-default w-full grid  ${estado == "pagado" ? "md:grid-cols-24" : "md:grid-cols-9"}`}
              >
                {row.cells.map((cell, idx) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      key={idx}
                      className={`font-display text-sm text-center truncate px-2  py-2 col-span-${colSpanMovil[idx]}  md:col-span-${stado[idx]} `}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          }) : <tr className=" transition border-b border-base hover:bg-base  w-full grid place-items-center">
            <td className="py-5 font-display text-lg text-gray-500 uppercase ">{t("No hay pagos asociados")}</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
