import { FC, useState } from "react";
import { useTable } from "react-table";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useDelayUnmount } from "../../utils/Funciones";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import ModalBottom from "../Utils/ModalBottom";
import DatatableGroup from "./GrupoTablas";
import SentarBlock from "./SentarBlock";
import { useTranslation } from 'react-i18next';
import { OptionsSubMenu } from "./OptionsSubMenu";

interface propsBlockListaInvitados {
  menu?: any
  setGetMenu?: any
  ConditionalAction?: any
  handleClick?: any
}

const BlockListaInvitados: FC<propsBlockListaInvitados> = ({ menu, setGetMenu, ConditionalAction, handleClick, }) => {
  const { event } = EventContextProvider();
  const { config } = AuthContextProvider()
  const [isMounted, setIsMounted] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [invitadoSelected, setSelected] = useState<string | null>(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>()

  return (
    <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full pt-2 pb-28 mb-32 relative">
      {loading &&
        <div className="fixed top-0 left-0 w-[100vw] h-[100vh] flex items-center justify-center z-50">
          < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4" />
        </div>
      }
      <OptionsSubMenu ConditionalAction={ConditionalAction} handleClick={handleClick} setLoading={setLoading} />
      {shouldRenderChild && (
        <ModalBottom state={isMounted} set={setIsMounted}>
          <div className="flex justify-center w-full gap-6">
            <div className="w-full md:w-5/6">
              <div className="border-l-2 border-gray-100 pl-3 my-6 w-full ">
                <h2 className="font-display text-2xl capitalize text-primary font-light">
                  {t("edit")} <br />
                  <span className="font-display text-4xl capitalize text-gray-500 font-medium">
                    {t("guest")}
                  </span>
                </h2>
              </div>
              {invitadoSelected !== "" ? (
                <FormEditarInvitado
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
                    {t("noguestselected")}
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
          handleClick={handleClick}
        />
      </div>
      <SentarBlock />
      <style jsx>
        {`
         .loader {
             border-top-color:  ${config?.theme?.primaryColor};
             -webkit-animation: spinner 1.5s linear infinite;
             animation: spinner 1.5s linear infinite;
         }

         @-webkit-keyframes spinner {
             0% {
             -webkit-transform: rotate(0deg);
             }
             100% {
             -webkit-transform: rotate(360deg);
             }
         }

         @keyframes spinner {
             0% {
             transform: rotate(0deg);
             }
             100% {
             transform: rotate(360deg);
             }
         }
     `}
      </style>
    </div>
  );
};

export default BlockListaInvitados;

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
