import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useExpanded, useTable } from "react-table";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import FormAddPago from "../Forms/FormAddPago";
import {
  BorrarIcon,
  MisEventosIcon,
  PlusIcon,
} from "../icons";
import CellEdit from "./CellEdit";
import CellPagado from "./CellPagado";
import SubComponentePagos from "./SubComponentePagos";

const BlockCategoria = ({ cate, set }) => {
  const { event, setEvent } = EventContextProvider()
  const [categoria, setCategoria] = useState({});
  const [data, setData] = useState([]);
  const [GastoID, setGastoID] = useState({ id: "", crear: false })

  useEffect(() => {
    setCategoria(
      event?.presupuesto_objeto?.categorias_array.find(
        (item) => item._id == cate
      )
    );
    setData(
      event?.presupuesto_objeto?.categorias_array?.find(
        (item) => item._id == cate
      )?.gastos_array
    );
    setGastoID(old => ({ ...old, crear: false }))
  }, [cate, event]);



  const saldo = categoria?.coste_estimado - categoria?.coste_final;

  console.log(1,categoria.coste_estimado)

  const Columna = useMemo(
    () => [
      {
        Header: "Concepto",
        accessor: "nombre",
        id: "nombre",
        Cell: (props) => <CellEdit categoriaID={categoria?._id} type={"text"} autofocus {...props} />
      },
      {
        Header: <p> Estimado <br/> {getCurrency(categoria?.coste_estimado)}</p> ,
        accessor: "coste_estimado",
        id: "coste_estimado",
        Cell: (props) => <CellEdit categoriaID={categoria?._id} type={"number"} {...props} />
      },
      {
        Header: <p>Coste final <br/> {getCurrency(categoria?.coste_final)}</p>,
        accessor: "coste_final",
        id: "coste_final",
        Cell: (props) => <CellEdit categoriaID={categoria?._id} type={"number"} {...props} />
      },
      {
        Header:<p >Pagado <br/> {getCurrency(categoria?.pagado)} </p> ,
        accessor: "pagado",
        id: "pagado",
        Cell: (props) => <CellPagado {...props} set={act => setGastoID(act)} />,
      },
      {
        Header: "",
        accessor: "options",
        id: "options",
        Cell: (props) => {
          const handleRemove = async () => {
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
              console.log(data)
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
          };

          return (
            <>

              <div className="w-full h-full flex items-center justify-center cursor-pointer relative">
                <BorrarIcon
                  onClick={handleRemove}
                  className="hover:text-gray-300 text-gray-500 transition w-3"
                />
              </div>
            </>
          );
        },
      },
    ],
    [categoria]
  );

  const AddGasto = async () => {
    let res;
    try {
      const params = {
        query: `mutation{
          nuevoGasto(evento_id:"${event?._id}",
          categoria_id:"${categoria?._id}",nombre:""){
            _id,
            nombre,
            coste_estimado,
            coste_final,
            pagado,
          }
        }
        `,
        variables: {},
      };

      const { data } = await api.ApiApp(params);
      res = data.data.nuevoGasto;
      console.log(res);
    } catch (error) {
      console.log(error);
    } finally {
      setEvent((old) => {
        const index = old?.presupuesto_objeto?.categorias_array?.findIndex(
          (item) => item._id == categoria._id
        );
        old.presupuesto_objeto.categorias_array[index].gastos_array = [
          ...old.presupuesto_objeto.categorias_array[index].gastos_array,
          res,
        ];

        return { ...old };
      });
    }
  };



  const renderRowSubComponent = useCallback(({ row, cate, gasto }) => (
    <SubComponentePagos row={row} cate={cate} gasto={gasto} wantCreate={act => setGastoID(old => ({ ...old, crear: act }))} />
  ),
    []
  )



  return (
    <>
      {GastoID.crear && (
        <div className="absolute* bg-white w-full  h-max grid place-items-center z-20 rounded-xl white shadow-lg top-0 left-0 p-8 ">
          <div className="font-display text-gray-500 hover:text-gray-300 transition text-lg absolute top-5 right-5 cursor-pointer hover:scale-125" onClick={() => setGastoID("")}>X</div>
          <FormAddPago GastoID={GastoID?.id} cate={categoria?._id} />
        </div>
      )}
      <div className={`bg-white block-categoria h-max py-10 w-full rounded-xl shadow-lg overflow-hidden flex flex-col items-center relative ${GastoID.crear?"hidden":"block"}`}>
        <div
          onClick={() => set({ isVisible: false, id: "" })}
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
        <div className="md:justify-between w-4/6 gap-3 md:flex items-center font-display text-gray-500">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium ">
              Coste estimado:
              <span className="text-sm text-gray-500 pl-1">
                {getCurrency(categoria?.coste_estimado)}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium ">
              Coste final:
              <span
                className={`text-sm pl-1 text-${Math.abs(saldo) == saldo ? "green" : "red"
                  }`}
              >
                {getCurrency(categoria?.coste_final)}
              </span>
            </h3>
          </div>
        </div>
        {/* Barra de estado */}
        <div className=" w-4/6 mx-auto flex gap-1 items-center py-2 inset-x-0">
          <div className="bg-gray-300 rounded-xl flex items-center overflow-hidden md:h-5 w-full relative">
            <p className="font-display text-xs text-white pl-2 z-10 relative p-3">
              Diferencia en su saldo final {getCurrency(saldo)}
            </p>
            <svg
              className={`bg-${Math.abs(saldo) == saldo ? "green" : "red"
                } h-full absolute top-0 left-0 z-0 transition`}
              width={`${50}%`}
            ></svg>
          </div>
        </div>
        {/* Tabla de datos */}
        <DataTable AddGasto={AddGasto} columns={Columna} data={data ?? []} renderRowSubComponent={renderRowSubComponent} cate={categoria._id} gasto={GastoID.id} categoria={categoria} />
        <div className="bg-primary w-full grid grid-cols-10 absolute bottom-0 font-display text-white font-semibold py-1 text-sm">
          <div className="flex items-center justify-center col-span-3">
            <p>Total</p>
          </div>
          <div className="flex items-center justify-center col-span-2">
            <p>{getCurrency(categoria?.coste_estimado)}</p>
          </div>
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
    </>
  );
};

export default BlockCategoria;

export const DataTable = ({ data, columns, AddGasto, renderRowSubComponent, cate, gasto, categoria }) => {
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows, state: { expanded } } =
    useTable({ columns, data }, useExpanded);

  const colSpan = {
    nombre: 3,
    coste_estimado: 2,
    coste_final: 2,
    pagado: 2,
    options: 1,
  };
  return (
    <table
      {...getTableProps()}
      className="table w-full rounded-lg relative mt-6"
    >
      <thead>
        {headerGroups.map((headerGroup, id) => (
          <tr
            {...headerGroup.getHeaderGroupProps()}
            className="w-full grid grid-cols-10 py-2 bg-base"
            key={id}
          >
            {headerGroup.headers.map((column, id) => (
              <th
                {...column.getHeaderProps()}
                className={`font-display font-semibold text-gray-500 text-sm flex items-center justify-center  col-span-${colSpan[column.id]
                  }`}
                key={id}
              >
                {column.render("Header")}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} className="text-gray-500 text-sm ">
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <>
              <tr
                key={i}
                {...row.getRowProps()}
                className="w-full transition border-b border-base hover:bg-base grid grid-cols-10"
              >
                {row.cells.map((cell, i) => {
                  return (
                    <td
                      key={i}
                      {...cell.getCellProps()}
                      className={`font-display text-sm w-full text-left py-2 col-span-${colSpan[cell.column.id]
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
            onClick={() => AddGasto()}
            className="font-display text-sm text-primary w-full text-left py-3 flex gap-2 items-center justify-center hover:opacity-90 hover:translate-x-2 transition transform"
          >
            <PlusIcon /> Añadir servicio
          </td>
        </tr>
      </tbody>
    </table>
  );
};
