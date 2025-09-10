import { FC, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { PlusIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { ExportarExcel } from "../Utils/ExportarExcel";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import * as XLSX from 'xlsx';
import axios from "axios";


interface props {
  ConditionalAction?: any
  handleClick?: any
}

export const OptionsSubMenu: FC<props> = ({ ConditionalAction, handleClick }) => {
  const { event, setEvent } = EventContextProvider();
  const { config } = AuthContextProvider()
  const [optionImportModal, setOptionImportModal] = useState(false)
  const [optionExportModal, setOptionExportModal] = useState(false)
  const [activeInputUpload, setActiveInputUpload] = useState(false)
  const [loading, setLoading] = useState<boolean>()
  const toast = useToast()
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();

  const downloadPdf = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/generate-pdf', {
        url: `${window.location.origin}/invitados-${event?._id}`,
        format: "letter"
      });
      const blob = new Blob([Uint8Array.from(atob(response.data.base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.nombre} invitados`.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, "_") + '.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast("error", "Error al generar PDF");
    } finally {
      setLoading(false);
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
    <div className="flex items-center justify-between relative my-1">
      {activeInputUpload && <input type="file" id="fileInput" className="hidden" onChange={handleFileUpload} />}
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
  )
}