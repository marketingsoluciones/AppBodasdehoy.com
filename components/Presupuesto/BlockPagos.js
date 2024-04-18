import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { useTable } from "react-table";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import FormEditarPago from "../Forms/FormEditarPago";
import { EditarIcon } from "../icons";
import { capitalize } from '../../utils/Capitalize';
import { useAllowed } from "../../hooks/useAllowed";


const BlockPagos = ({ estado }) => {
  const [active, setActive] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-screen-lg relative mx-auto inset-x-0   "
    >
      <div className="bg-white p-6 h-max shadow-md rounded-xl mt-10 overflow-x-auto*  ">
        <TablaDatosPagos active={active} estado={estado} />
      </div>
    </motion.div>
  );
};

export default BlockPagos;

const TablaDatosPagos = ({ estado }) => {
  const { event } = EventContextProvider()
  const categorias = event?.presupuesto_objeto?.categorias_array;
  const [PagosOrFormAdd, setShowPagos] = useState(true)
  const [PagoID, setPagoID] = useState("")
  const [isAllowed, ht] = useAllowed()

  const Columna = useMemo(
    () =>
      [
        {
          Header: "Estado",
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
          Header: "Proveedor",
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
          Header: "Fecha de pago",
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
          Header: "Importe",
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
          Header: "Modo de pago",
          accessor: "medio_pago",
          id: "medio_pago",
          Cell: (props) => {
            const [value, setValue] = useState(props?.value);
            useEffect(() => {
              setValue(props?.value)
            }, [props?.value])
            return (
              <div className=" text-gray-500 grid place-items-center h-full ">
                <p className="w-4/5">{value}</p>
              </div>
            );
          },
        },
        {
          Header: "Concepto",
          accessor: "concepto",
          id: "concepto",
          Cell: (props) => {
            const [value, setValue] = useState(props?.value);
            useEffect(() => {
              setValue(props?.value)
            }, [props?.value])
            return (
              <div className="text-gray-500 grid place-items-center h-full ">
                <p className="w-4/5">{value? value : "Sin concepto"}</p>
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

  const Columna2 = useMemo(
    () =>
      [
        {
          Header: "Estado",
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
          Header: "Proveedor",
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
          Header: "Fecha de futuro pago",
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
          Header: "Concepto",
          accessor: "concepto",
          id: "concepto",
          Cell: (props) => {
            const [value, setValue] = useState(props?.value);
            useEffect(() => {
              setValue(props?.value)
            }, [props?.value])
            return (
              <div className="text-gray-500 grid place-items-center h-full ">
                <p className="w-4/5">{value? value : "Sin concepto"}</p>
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
            <FormEditarPago ListaPagos={data} IDPagoAModificar={PagoID} set={act => setShowPagos(act)} state={PagosOrFormAdd} />
          </div>
        )
      }

    </>
  )
};

const DataTable = ({ columns, data, estado }) => {

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data });

  const [stado, setStado] = useState({})

  console.log(stado)

  const colSpan = {
    0: 1,
    1: 2,
    2: 2,
    3: 2,
    4: 2,
    5: 2,
    6: 1
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
              className={`w-full grid grid-cols-4 ${estado == "pagado" ? "md:grid-cols-12" : "md:grid-cols-9"} py-2 bg-base uppercase`}
              key={id}
            >
              {headerGroup.headers.map((column, idx, id) => (
                <th
                  {...column.getHeaderProps()}
                  className={`font-display  font-light text-gray-500 text-sm col-span-${colSpanMovil[idx]} md:col-span-${stado[idx]} `}
                  key={id}
                >
                  {column.render("Header")}
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
                className={`transition border-b border-base hover:bg-base cursor-pointer w-full grid grid-cols-5* ${estado == "pagado" ? "md:grid-cols-12" : "md:grid-cols-9"}`}
                key={id}
              >
                {row.cells.map((cell, idx) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      key={idx}
                      className={`font-display text-sm text-center  py-2 col-span-${colSpanMovil[idx]}  md:col-span-${stado[idx]}`}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          }) : <tr className=" transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
            <td className="py-5 font-display text-lg text-gray-500 uppercase ">No hay pagos asociados</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
