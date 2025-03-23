import { FC, useEffect, useMemo, useState } from "react";
import { useTable } from "react-table";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { ImageProfile, useDelayUnmount } from "../../utils/Funciones";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import { InvitacionesIcon, PlusIcon } from "../icons";
import ModalBottom from "../Utils/ModalBottom";
import DatatableGroup from "./GrupoTablas";
import SentarBlock from "./SentarBlock";
// import { ModalPDF } from "../Utils/ModalPDF";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { GoMultiSelect } from "react-icons/go";
import { ExportarExcel } from "../Utils/ExportarExcel";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import * as XLSX from 'xlsx';
import { guests } from "../../utils/Interfaces";


interface propsBlockListaInvitados {
  menu?: any
  setGetMenu?: any
  createPDF?: any
  setCreatePDF?: any
  ConditionalAction?: any
  handleClick?: any
}

const BlockListaInvitados: FC<propsBlockListaInvitados> = ({ menu, setGetMenu, createPDF, setCreatePDF, ConditionalAction, handleClick, }) => {
  const { event, setEvent } = EventContextProvider();
  const { config } = AuthContextProvider()
  const [isMounted, setIsMounted] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [invitadoSelected, setSelected] = useState<string | null>(null);
  const [optionImportModal, setOptionImportModal] = useState(false)
  const [optionExportModal, setOptionExportModal] = useState(false)
  const [activeInputUpload, setActiveInputUpload] = useState(false)
  const [loading, setLoading] = useState<boolean>()
  const toast = useToast()
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();

  const downloadPdf = async () => {
    try {
      setLoading(true)
      const nameFile = `Invitados de ${event.nombre}`.replace(/ /g, "_")
      const result = await fetchApiEventos({
        query: queries.generatePdf,
        variables: {
          url: `${window.location.origin}/event/guest-${event._id}`,
          nameFile
        },
        domain: config.domain
      })
      if (result) {
        setLoading(false)
        const link = document.createElement('a');
        link.href = result as string;
        link.download = nameFile;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      convertirExcelAJson(file);
    } else {
      alert('Por favor, selecciona un archivo .xlsx válido.');
    }
  };

  const convertirExcelAJson = (file) => {
    try {
      const lector = new FileReader();
      lector.onload = (evento) => {
        const datosBinarios = evento.target.result;
        const libro = XLSX.read(datosBinarios, { type: 'binary' });
        const nombreHoja = libro.SheetNames[0];
        const hoja = libro.Sheets[nombreHoja];
        const dataImport = XLSX.utils.sheet_to_json(hoja).map(elem => {
          return {
            nombre: (elem["NOMBRE"] ?? elem["NAME"]),
            correo: (elem["CORREO"] ?? elem["EMAIL"])?.toLocaleLowerCase(),
            telefono: `+${(`${elem["TELEFONO"] ?? elem["PHONE"]}`)?.replace(/[^0-9]/g, '')}`,
            passesQuantity: elem["ACOMPAÑANTES"] ?? elem["COMPANIONS"],
            sexo: (!!elem["SEXO"] ? elem["SEXO"] : elem["GENDER"]?.toLocaleLowerCase()?.slice(0, 3) === "fem" ? "mujer" : "hombre")?.toLocaleLowerCase()?.slice(0, 3) === "muj" ? "mujer" : "hombre",
            grupo_edad: (!!elem["GRUPO DE EDAD"] ? elem["GRUPO DE EDAD"] : elem["GROUP AGE"]?.toLocaleLowerCase()?.slice(0, 3) === "chi" ? "niños" : "adultos")?.toLocaleLowerCase()?.slice(0, 3) === "adu" ? "adultos" : "niños",
          }
        })
        const dataImportReduce = dataImport.reduce((acc, item) => {
          if (item.correo !== undefined && item.grupo_edad !== undefined && item.nombre !== undefined && item.passesQuantity !== undefined && item.sexo !== undefined && item.telefono !== undefined) {
            if (event.invitados_array.findIndex(elem => elem.correo === item.correo) < 0) {
              if (event.invitados_array.findIndex(elem => elem.telefono === item.telefono) < 0) {
                if (dataImport.findIndex(elem => elem.correo === item.correo && elem.nombre !== item.nombre) < 0) {
                  if (dataImport.findIndex(elem => elem.telefono === item.telefono && elem.nombre !== item.nombre) < 0) {
                    acc.corrects.push(item)
                  } else {
                    acc.duplicatesPhone.push(item)
                  }
                } else {
                  acc.duplicatesEmail.push(item)
                }
              } else {
                acc.duplicatePhoneBD.push(item)
              }
            } else {
              acc.duplicateEmailBD.push(item)
            }
          } else {
            acc.incorrects.push(item)
            if (event.invitados_array.findIndex(elem => elem.correo === item.correo) > -1) {
              acc.duplicateEmailBD.push(item)
            } else {
              if (event.invitados_array.findIndex(elem => elem.telefono === item.telefono) > -1) {
                acc.duplicatePhoneBD.push(item)
              }
            }
          }
          return acc
        }, {
          corrects: [],
          incorrects: [],
          duplicatesEmail: [],
          duplicatesPhone: [],
          duplicateEmailBD: [],
          duplicatePhoneBD: [],
        })
        if (dataImport.length !== dataImportReduce.corrects.length) {
          toast("error", t("fileErrors"))
        } else {
          fetchApiEventos({
            query: queries.createGuests,
            variables: {
              eventID: event._id,
              invitados_array: dataImportReduce.corrects,
            },
          })
            .then((results: any) => {
              event.invitados_array = results?.invitados_array
              setEvent({ ...event })
              toast("success", `${dataImportReduce.corrects.length} ${t("importCorrect")}`)
            })
        }
        setTimeout(() => {
          setActiveInputUpload(false)
        }, 1000);
      };
      lector.readAsArrayBuffer(file);
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full md:px-6 pt-2 md:pt-6 pb-28 mb-32 md:mb-0 md:p-12 relative">
      {activeInputUpload && <input type="file" id="fileInput" className="hidden" onChange={handleFileUpload} />}
      <div className="flex  items-center justify-between relative">
        <div className="flex gap-2 items-center mt-1 mb-3 md:mb-5 mx-2">
          <button
            onClick={(e) => !isAllowed() ? ht() : ConditionalAction({ e })}
            className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary md:bg-primary md:text-white md:hover:bg-white md:hover:text-primary capitalize"
          >
            <PlusIcon />
            {t("invitados")}
          </button>
          <button
            onClick={(e) => !isAllowed() ? ht() : handleClick(e, "grupo")}
            className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
          >
            <PlusIcon />
            {t("grupo")}
          </button>
          <button
            onClick={(e) => !isAllowed() ? ht() : handleClick(e, "menu")}
            className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
          >
            <PlusIcon />
            {t("menu")}
          </button>
          <button
            onClick={() => setOptionImportModal(!optionImportModal)}
            className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize relative"
          >
            {t("importar")}
            {optionImportModal &&
              <ClickAwayListener onClickAway={() => setOptionImportModal(false)}>
                <div className="absolute left-0 top-8 shadow-md bg-white  p-5 z-50 rounded-md space-y-2 border-gray-100 border-[1px]">
                  <button
                    onClickCapture={() => { setActiveInputUpload(true) }}
                    onClick={() => document.getElementById('fileInput').click()}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary w-max text-center "
                  >
                    <span className="first-letter:uppercase">{t("uploadExcel")}</span>
                  </button>
                  <button
                    onClick={() => {
                      window.open(`https://apiapp.bodasdehoy.com/${t("contactTemplateFileName")}.xlsx`, "_self");
                    }}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary w-max text-center"
                  >
                    <span className="first-letter:uppercase">{t("downloadTemplate")}</span>
                  </button>
                </div>
              </ClickAwayListener>
            }
          </button>
          <button
            onClick={() => setOptionExportModal(!optionExportModal)}
            className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize relative"
          >
            {t("exportar")}
            {optionExportModal &&
              <ClickAwayListener onClickAway={() => setOptionExportModal(false)}>
                <div className="absolute left-0 top-8 shadow-md bg-white  p-5 z-50 rounded-md space-y-2 border-gray-100 border-[1px]">
                  <ExportarExcel />
                  <button
                    onClick={() => downloadPdf()}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary w-full text-center"
                  >
                    PDF
                  </button>
                </div>
              </ClickAwayListener>
            }
          </button>
        </div>

      </div>
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
            <h3 className="font-display truncate md:text-xl  text-gray-500 text-center capitalize font-semibold">
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
