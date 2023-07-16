import { FC, useEffect, useMemo, useState } from "react";
import { useTable } from "react-table";
import { EventContextProvider } from "../../context";
import { ImageProfile, useDelayUnmount } from "../../utils/Funciones";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import { InvitacionesIcon, PlusIcon } from "../icons";
import ModalBottom from "../Utils/ModalBottom";
import DatatableGroup from "./GrupoTablas";
import SentarBlock from "./SentarBlock";

interface propsBlockListaInvitados {
  state: boolean;
  set: CallableFunction;
  menu?: any
  setGetMenu?: any
}

const BlockListaInvitados: FC<propsBlockListaInvitados> = ({ state, set, menu, setGetMenu }) => {
  const { event } = EventContextProvider();
  const [isMounted, setIsMounted] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [invitadoSelected, setSelected] = useState<string | null>(null);

  const handleClick = (e, click) => {
    e.preventDefault();
    set({ state: !state, click: click });
  };

  return (
    <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full px-6 pt-6 pb-28 mb-32 md:mb-0 md:p-12 relative">
      <div className="flex gap-4 items-center pb-10">
        <button
          onClick={(e) => handleClick(e, "invitado")}
          className="focus:outline-none bg-primary px-2 md:px-6 py-1 text-white font-display font-semibold text-sm rounded-lg hover:bg-white hover:text-primary transition border border-primary flex justify-between items-center gap-2"
        >
          <PlusIcon />
          Invitado
        </button>
        <button
          onClick={(e) => handleClick(e, "grupo")}
          className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-2 items-center justify-between text-primary font-display font-semibold text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
        >
          <PlusIcon />
          Grupo
        </button>
        <button
          onClick={(e) => handleClick(e, "menu")}
          className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-2 items-center justify-between text-primary font-display font-semibold text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
        >
          <PlusIcon />
          Menu
        </button>
      </div>
      {shouldRenderChild && (
        <ModalBottom state={isMounted} set={setIsMounted}>
          <div className="flex justify-center w-full gap-6">
            {/* <div className="hidden md:block w-1/3">
              <TabladeInvitados evento={event} idInvitado={setSelected} />
            </div> */}

            <div className="w-full md:w-5/6">
              <div className="border-l-2 border-gray-100 pl-3 my-6 w-full ">
                <h2 className="font-display text-2xl capitalize text-primary font-light">
                  Editar <br />
                  <span className="font-display text-4xl capitalize text-gray-500 font-medium">
                    Invitado
                  </span>
                </h2>
              </div>
              {invitadoSelected !== "" ? (
                <FormEditarInvitado
                  //ListaGrupos={event?.grupos_array}
                  invitado={event.invitados_array.find(
                    (guest) => guest._id === invitadoSelected
                  )}
                  setInvitadoSelected={setSelected}
                  state={isMounted}
                  set={setIsMounted}
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  {" "}
                  <p className="font-display text-lg text-gray-100">
                    No hay invitado seleccionado
                  </p>
                </div>
              )}
            </div>
          </div>
        </ModalBottom>
      )}
      <div className="relative overflow-x-auto md:overflow-x-visible">
        <DatatableGroup
          GruposArray={event?.grupos_array}
          setSelected={setSelected}
          isMounted={isMounted}
          setIsMounted={setIsMounted}
          menu={menu}
          setGetMenu={setGetMenu}
        />
      </div>
      <SentarBlock />
    </div>
  );
};

export default BlockListaInvitados;

const TabladeInvitados = ({ evento, idInvitado }) => {
  const Columna = useMemo(
    () => [
      {
        Header: () => {
          return (
            <h3 className="font-display truncate md:text-xl uppercase text-gray-500 text-center capitalize font-semibold">
              Mis Invitados1
            </h3>
          );
        },
        accessor: "nombre", // accessor es la "key" en la data(invitados)
        id: "nombre",
        Cell: (props) => {
          const value = props?.cell?.value;
          const { sexo } = props?.row?.original;

          return (
            <div
              className="flex justify-between items-center w-full py-2 pr-3"
              onClick={(ac) => idInvitado(props?.row?.original?._id)}
            >
              <div className="flex gap-1 items-center">
                <img
                  className="hidden md:block w-10 h-10 mr-2 object-cover"
                  src={ImageProfile[sexo]?.image}
                  alt={ImageProfile[sexo]?.alt}
                />
                <p className="font-display text-sm capitalize overflow-ellipsis text-gray-500">
                  {value}
                </p>
              </div>
              <div
                className={
                  props?.row?.original?.invitacion
                    ? "text-green"
                    : "text-primary"
                }
              >
                <InvitacionesIcon className="w-4 h-4" />
              </div>
            </div>
          );
        },
      },
    ],
    [evento]
  );

  const Data = useMemo(() => {
    const invitados = evento?.invitados_array;
    return invitados;
  }, [evento]);

  useEffect(() => { }, []);
  return (
    <div className="bg-blue-500 w-full h-20">
      {/* <DataTable data={Data} columns={Columna} /> */}
    </div>
  );
};

export const DataTable = ({ data, columns }) => {
  let { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable({ columns, data });
  if (rows) {
    rows = [...rows, ...rows, ...rows]
  }

  return (
    <table
      {...getTableProps()}
      className="table-auto border-collapse w-full rounded-lg relative"
    >
      <thead>
        {headerGroups.map((headerGroup, idx) => (
          <tr key={idx} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th
                key={headerGroup.id}
                {...column.getHeaderProps()}
                className="border-b border-base text-sm font-light font-display"
              >
                {column.render("Header")}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} className="text-gray-300 text-sm">
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr
              key={row.id}
              {...row.getRowProps()}
              className="w-full transition border-b border-base hover:bg-base cursor-pointer"
            >
              {row.cells.map((cell) => {
                return (
                  <td
                    key={cell.row.id}
                    {...cell.getCellProps()}
                    className="w-full text-left whitespace-nowrap px-3 "
                  >
                    {cell.render("Cell")}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
