import { useCallback, useEffect, useMemo, useState } from "react";
import { useExpanded, useTable } from "react-table";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import FormAddPago from "../Forms/FormAddPago";
import { useTranslation } from 'react-i18next';
import { BorrarIcon, MisEventosIcon, PlusIcon } from "../icons";
import CellPagado from "./CellPagado";
import SubComponentePagos from "./SubComponentePagos";
import { useAllowed } from "../../hooks/useAllowed";
import DetallesPago from "./DetallesPago";
import AddPagado from "./AddPagado";
import { EditableLabelWithInput } from "../Forms/EditableLabelWithInput";
import { handleChange } from "../TablesComponents/tableBudgetV8.handles";
import { fetchApiEventos, queries } from "../../utils/Fetching";

const BlockCategoria = ({ showCategoria, setShowCategoria, setGetId }) => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [categoria, setCategoria] = useState({});
  const [data, setData] = useState([]);
  const [GastoID, setGastoID] = useState({ id: "", crear: false })
  const [isAllowed, ht] = useAllowed()

  useEffect(() => {
    setCategoria(
      event?.presupuesto_objeto?.categorias_array.find(
        (item) => item._id == showCategoria?._id
      )
    );
    if (event?.usuario_id === user?.uid || event?.permissions?.find(elem => elem?.title === "presupuesto").value === "edit") {
      const data = event?.presupuesto_objeto?.categorias_array?.find((item) => item._id == showCategoria?._id)?.gastos_array
      setData([...(data ?? [])]);
    } else {
      const data = event?.presupuesto_objeto?.categorias_array?.find((item) => item._id == showCategoria?._id)?.gastos_array.filter(el => el?.estatus !== false)
      setData([...(data ?? [])]);
    }
    setGastoID(old => ({ ...old, crear: false }))
  }, [showCategoria, event, event?.presupuesto_objeto?.currency]);

  const saldo = categoria?.coste_estimado - categoria?.coste_final;

  const totalCosteFinal = categoria?.gastos_array?.reduce((total, item) => total + item.coste_final, 0)

  useEffect(() => {
    const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex((item) => item?._id === categoria?._id)
    if (event?.presupuesto_objeto?.categorias_array[f1] != totalCosteFinal) {
      setEvent((old) => {
        old.presupuesto_objeto.categorias_array[f1].coste_final = totalCosteFinal
        return { ...old }
      })
    }
  }, [totalCosteFinal])

  const Columna = useMemo(() => {
    const columns = [
      {
        Header: <p className="flex h-full capitalize text-xs ">{t("partida de gasto")} </p>,
        accessor: "gasto",
        id: "gasto",
        className: "sticky left-0 z-10 relative ",
        Cell: props => {
          props.row.original.object = props.column.id;
          props.row.original.categoriaID = categoria?._id;
          props.row.original.gastoID = props.row.original._id;
          let value = props.row.original.nombre;
          return (
            <div className="text-xs text-center">
              <EditableLabelWithInput
                accessor="gasto"
                handleChange={(values) => {
                  handleChange({ values, info: props, event, setEvent });
                }}
                type={null}
                value={value}
                textAlign={"center"}
                isLabelDisabled
              />
            </div>
          );
        },
      },
      event?.presupuesto_objeto?.viewEstimates && {
        Header: <p className="capitalize text-xs"> Estimado <br /> {getCurrency(categoria?.coste_estimado)}</p>,
        accessor: "coste_estimado",
        id: "coste_estimado",
        Cell: props => {
          props.row.original.object = "gasto";
          props.row.original.categoriaID = categoria?._id;
          props.row.original.gastoID = props.row.original._id;
          let value = props.row.original.coste_estimado;
          return (
            <div className="flex justify-end  ">
              <EditableLabelWithInput
                accessor="coste_estimado"
                handleChange={(values) => {
                  handleChange({ values, info: props, event, setEvent });
                }}
                type="float"
                value={value}
                textAlign="end"
                isLabelDisabled
              />
            </div>
          );
        },
      },
      {
        Header: <p className="capitalize text-xs ">{t("coste total")} <br /> {getCurrency(categoria?.coste_final)}</p>,
        accessor: "coste_final",
        id: "coste_final",
        Cell: props => {
          props.row.original.object = "gasto";
          props.row.original.categoriaID = categoria?._id;
          props.row.original.gastoID = props?.row?.original?._id;
          let value = props?.row?.original?.coste_final;
          if (props?.row?.original?.items_array?.length === 0) {

            return (
              <div className="flex justify-end  ">
                <EditableLabelWithInput
                  accessor="coste_final"
                  handleChange={(values) => {
                    handleChange({ values, info: props, event, setEvent });
                  }}
                  type="float"
                  value={value}
                  textAlign="end"
                  isLabelDisabled
                />
              </div>
            );
          } else {
            return (
              <div className="flex justify-end  ">
                {getCurrency(parseFloat(value))}
              </div>
            );
          }

        },
      },
      {
        Header: <p className="capitalize text-xs " >Pagado <br /> {getCurrency(categoria?.pagado)} </p>,
        accessor: "pagado",
        id: "pagado",
        Cell: (props) => <CellPagado {...props} set={act => setGastoID(act)} />,
      },
      {
        Header: <p className="flex h-full capitalize text-xs">Por Pagar </p>,
        accessor: "pendiente_pagar",
        id: "pendiente_pagar",
        Cell: (props) => {
          const [value, setValue] = useState(0);
          const total = props?.row?.values?.pagado - props?.row?.values?.coste_final

          useEffect(() => {
            if (props?.row?.values?.coste_final === 0) {
              setValue(0)
            } else {
              setValue(total)
            }
          }, [props?.row.original])

          return (
            <div className="font-displaytext-xs grid place-items-center h-full text-right w-full ">
              <p className="w-full">{getCurrency(value)}</p>
            </div>
          );
        },
      },
      {
        Header: "",
        accessor: "options",
        id: "options",
        Cell: (props) => {
          const handleRemove = async () => {
            let data
            try {
              new Promise(resolve => {
                fetchApiEventos({
                  query: queries.borrarGasto,
                  variables: {
                    evento_id: event?._id,
                    categoria_id: categoria?._id,
                    gasto_id: props?.row?.original?._id,
                  },
                }).then(result => {
                  const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === categoria?._id)
                  const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === props?.row?.original?._id)
                  event?.presupuesto_objeto?.categorias_array[f1].gastos_array.splice(f2, 1)
                  resolve(event)
                })
              }).then((result) => {
                setEvent({ ...event })
              })
            } catch (error) {
              console.log(error)
            }
          };

          return (
            <div className="w-full h-full flex items-center justify-center cursor-pointer relative space-x-1">
              <DetallesPago {...props} set={act => setGastoID(act)} />
              <AddPagado {...props} set={act => setGastoID(act)} />
              <BorrarIcon
                onClick={!isAllowed() ? null : handleRemove}
                className="hover:text-gray-300 text-gray-500 transition w-3"
              />
            </div>
          );
        },
      }
    ];

    // Filtrar columnas nulas (en caso de que `viewEstimates` sea falso)
    return columns.filter(Boolean);
  }, [categoria, event])

  const AddGasto = async () => {

    try {
      fetchApiEventos({
        query: queries.nuevoGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: categoria?._id,
          nombre: "Nueva part. de gasto",
        }
      }).then((result) => {
        const f1 = event?.presupuesto_objeto?.categorias_array.findIndex((elem) => elem._id === categoria?._id)
        event?.presupuesto_objeto?.categorias_array[f1].gastos_array.push(result)
        setEvent({ ...event })
      })
    } catch (error) {
      console.log(220046, error);
      throw new Error(error)
    }
  };


  const renderRowSubComponent = useCallback(({ row, cate, gasto }) => (
    <SubComponentePagos getId={GastoID?.id} row={row} cate={cate} gasto={gasto} wantCreate={act => setGastoID(old => ({ ...old, crear: act }))} />
  ),
    [GastoID]
  )

  const porcentaje = (categoria?.coste_final / categoria?.coste_estimado) * 100

  return (
    <div className="flex-1 w-full">
      {GastoID.crear && (
        <div className="relative bg-white w-full  h-max grid place-items-center z-20 rounded-xl white shadow-lg top-0 left-0 p-8 ">
          <div className="font-display text-gray-500 hover:text-gray-300 transition text-lg absolute top-5 right-5 cursor-pointer hover:scale-125" onClick={() => setGastoID("")}>X</div>

          <FormAddPago GastoID={GastoID?.id} cate={categoria?._id}  setGastoID={setGastoID}  />

        </div>
      )}
      <div className={`bg-white  h-max py-10 rounded-xl shadow-lg overflow-hidden flex flex-col items-center relative ${GastoID.crear ? "hidden" : "block"}`}>
        <div
          onClick={() => setShowCategoria({ state: false })}
          className="cursor-pointer absolute top-5 right-5 font-display hover:scale-125 transition transform text-gray-500 hover:text-gray-500 font-semibold text-lg "
        >
          X
        </div>
        {/* Cabecera Categoria */}
        <div className="flex gap-3 justify-center items-center pt-2 pb-6">
          <div className="w-12 h-12 rounded-full bg-primary grid place-items-center">
            <MisEventosIcon className="text-white w-7 h-7" />
          </div>
          <h2 className="font-display font-medium text-lg text-primary">
            {capitalize(categoria?.nombre)}
          </h2>
        </div>
        {
          event?.presupuesto_objeto?.viewEstimates &&
          <div className="md:justify-between w-4/6 gap-3 md:flex items-center font-display text-gray-500">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium ">
                {t("estimatedcost")}
                <span className="text-sm text-gray-500 pl-1">
                  {getCurrency(categoria?.coste_estimado, event?.presupuesto_objeto?.currency)}
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium ">
                {t("actualcost")}
                <span
                  className={`text-sm pl-1 text-${Math.abs(saldo) == saldo ? "green" : "red"
                    }`}
                >
                  {getCurrency(categoria?.coste_final, event?.presupuesto_objeto?.currency)}
                </span>
              </h3>
            </div>
          </div>
        }

        {/* Barra de estado */}
        {
          event?.presupuesto_objeto?.viewEstimates && <div className=" w-4/6 mx-auto flex gap-1 items-center py-2 inset-x-0">
            <div className="bg-gray-300 rounded-xl flex items-center overflow-hidden md:h-5 w-full relative">
              <p className="font-display text-xs text-white pl-2 z-10 relative p-3">
                {
                  Math.abs(saldo) == saldo ? `Saldo a favor ${getCurrency(saldo, event?.presupuesto_objeto?.currency)}` : `${t("balanceagainst")} ${getCurrency(saldo, event?.presupuesto_objeto?.currency)}`
                }

              </p>
              <svg
                className={`bg-${Math.abs(saldo) == saldo ? "green" : "red"
                  } h-full absolute top-0 left-0 z-0  transition-all duration-700 `}
                width={`${porcentaje}%`}
              ></svg>
            </div>
          </div>
        }


        {/* Tabla de datos */}

        <div className="overflow-x-auto w-full">
          <DataTable AddGasto={AddGasto} columns={Columna} data={data ?? []} renderRowSubComponent={renderRowSubComponent} cate={categoria?._id} gasto={GastoID?.id} categoria={categoria} />
        </div>
        <div className={`bg-primary w-full grid ${!event?.presupuesto_objeto?.viewEstimates ? "grid-cols-9" : "grid-cols-13"} absolute bottom-0 font-display text-white font-semibold py-1 text-sm `}>
          <div className="flex items-center justify-center col-span-3">
            <p>{t("total")}</p>
          </div>
          {event?.presupuesto_objeto?.viewEstimates &&
            <div className="flex items-center justify-center col-span-2">
              <p>{getCurrency(categoria?.coste_estimado)}</p>
            </div>
          }
          <div className="flex items-center justify-center col-span-2">
            <p>{getCurrency(categoria?.coste_final)}</p>
          </div>
          <div className="flex items-center justify-center col-span-2">
            <p>{getCurrency(categoria?.pagado)}</p>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .block-categoria {
            min-height: 24rem;
          }
        `}
      </style>
    </div>
  );
};

export default BlockCategoria;

export const DataTable = ({ data, columns, AddGasto, renderRowSubComponent, cate, gasto, categoria }) => {
  const { t } = useTranslation();
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows, state: { expanded } } =
    useTable({ columns, data }, useExpanded);
  const [isAllowed, ht] = useAllowed()
  const { event, setEvent } = EventContextProvider()


  const colSpan = {
    gasto: event?.presupuesto_objeto?.viewEstimates ? 3 : 5,
    coste_estimado: 2,
    coste_final: 2,
    pagado: 2,
    pendiente_pagar: 2,
    options: 2,
    soporte: 1
  };
  return (
    <table
      {...getTableProps()}
      className="md:w-full w-[1000px] rounded-lg mt-6  "
    >
      <thead className=" text-xs uppercase w-full">
        {headerGroups.map((headerGroup, id) => (
          <tr
            {...headerGroup.getHeaderGroupProps()}
            className="w-full grid grid-cols-13 py-2 bg-base "
            key={id}
          >
            {headerGroup.headers.map((column, id) => {
              return (
                <th
                  {...column.getHeaderProps()}
                  className={`  font-display font-semibold text-gray-500 text-sm flex items-center justify-center  col-span-${colSpan[column.id]
                    }`}
                  key={id}
                >
                  {column.render("Header")}
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} className="text-gray-500 text-sm w-full">
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <>
              <tr
                key={i}
                {...row.getRowProps()}
                className="w-full transition border-b border-base hover:bg-base grid grid-cols-13"
              >
                {row.cells.map((cell, i) => {
                  return (
                    <td
                      key={i}
                      {...cell.getCellProps()}
                      className={`font-display  text-sm w-full text-left py-2 col-span-${colSpan[cell.column.id]
                        }`}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
              {row.isExpanded ? (
                <tr key={i} className="h-40 w-full">
                  <td >
                    {renderRowSubComponent({ row, cate, gasto })}
                  </td>
                </tr>
              ) : null}
            </>
          );
        })}
        <tr className="w-full transition border-b border-base  cursor-pointer  grid grid-cols-4">
          <td
            onClick={() => !isAllowed() ? ht() : AddGasto()}
            className="font-display text-sm text-primary w-full text-left py-3 flex gap-2 items-center justify-center hover:opacity-90 hover:translate-x-2 transition transform"
          >
            <PlusIcon /> {t("addservice")}
          </td>
        </tr>
      </tbody>
    </table>

  );
};
