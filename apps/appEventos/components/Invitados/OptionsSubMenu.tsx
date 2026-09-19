import { FC, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { PlusIcon } from "../icons";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { ExportarExcel } from "../Utils/ExportarExcel";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import * as XLSX from 'xlsx';
import axios from "axios";


interface props {
  ConditionalAction?: any
  handleClick?: any
  setLoading?: any
}

export const OptionsSubMenu: FC<props> = ({ ConditionalAction, handleClick, setLoading }) => {
  const { event, setEvent } = EventContextProvider();
  const { config } = AuthContextProvider()
  const [optionImportModal, setOptionImportModal] = useState(false)
  const [optionExportModal, setOptionExportModal] = useState(false)
  const [activeInputUpload, setActiveInputUpload] = useState(false)
  
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

  // Normaliza cabeceras: sin acentos, MAYÚSCULAS, sin espacios extremos → tolera
  // "Nombre", "correo", "Teléfono", "Acompañantes"… sin romper la importación.
  const normHeader = (s: any) =>
    String(s ?? '').trim().toLocaleUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const convertirExcelAJson = (file: any) => {
    const lector = new FileReader();
    lector.onload = (evento: any) => {
      try {
        const datosBinarios = evento.target.result;
        // readAsArrayBuffer → type:'array' (antes era 'binary', pareja incorrecta que podía
        // corromper el parseo de algunos .xlsx y provocar "El archivo contiene errores").
        const libro = XLSX.read(new Uint8Array(datosBinarios), { type: 'array' });
        const nombreHoja = libro.SheetNames[0];
        const hoja = libro.Sheets[nombreHoja];
        const filas: any[] = XLSX.utils.sheet_to_json(hoja, { defval: '' });

        // Lee una celda por alias de cabecera, tolerante a mayúsculas/acentos/espacios.
        const getCell = (fila: any, aliases: string[]) => {
          const mapa: Record<string, any> = {};
          Object.keys(fila).forEach((k) => { mapa[normHeader(k)] = fila[k]; });
          for (const a of aliases) {
            const v = mapa[normHeader(a)];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
          }
          return undefined;
        };

        const validos: any[] = [];
        const invalidos: { fila: number; faltan: string[] }[] = [];

        filas.forEach((elem: any, idx: number) => {
          const nombre = getCell(elem, ['NOMBRE', 'NAME']);
          const correo = getCell(elem, ['CORREO', 'EMAIL'])?.toLocaleLowerCase();
          const rawTel = getCell(elem, ['TELEFONO', 'PHONE']);
          const rawAcomp = getCell(elem, ['ACOMPANANTES', 'ACOMPAÑANTES', 'COMPANIONS']);
          const rawSexo = getCell(elem, ['SEXO']);
          const rawGender = getCell(elem, ['GENDER']);
          const rawEdad = getCell(elem, ['GRUPO DE EDAD']);
          const rawGroupAge = getCell(elem, ['GROUP AGE']);

          // Fila totalmente vacía → ignorar en silencio (no cuenta como error).
          if (!nombre && !correo && !rawTel && rawAcomp === undefined && !rawSexo && !rawGender && !rawEdad && !rawGroupAge) return;

          // Campos obligatorios (los mismos que exigía el importador original).
          const faltan: string[] = [];
          if (!nombre) faltan.push('NOMBRE');
          if (!correo) faltan.push('CORREO');
          if (rawAcomp === undefined) faltan.push('ACOMPAÑANTES');
          if (faltan.length) { invalidos.push({ fila: idx + 2, faltan }); return; }

          const telefono = `+${`${rawTel ?? ''}`.replace(/[^0-9]/g, '')}`;
          const sexoBase = rawSexo ? rawSexo : (rawGender?.toLocaleLowerCase()?.slice(0, 3) === 'fem' ? 'mujer' : 'hombre');
          const sexo = sexoBase?.toLocaleLowerCase()?.slice(0, 3) === 'muj' ? 'mujer' : 'hombre';
          const edadBase = rawEdad ? rawEdad : (rawGroupAge?.toLocaleLowerCase()?.slice(0, 3) === 'chi' ? 'niños' : 'adultos');
          const grupo_edad = edadBase?.toLocaleLowerCase()?.slice(0, 3) === 'adu' ? 'adultos' : 'niños';
          const passesQuantity = Number(`${rawAcomp}`.replace(/[^0-9]/g, '')) || 0;

          validos.push({ nombre, correo, telefono, passesQuantity, sexo, grupo_edad });
        });

        // Dedup: descarta los ya existentes en el evento y los repetidos en el archivo
        // (misma intención que antes, pero ahora NO aborta todo el lote por una fila).
        const corrects: any[] = [];
        let dupBD = 0;
        let dupArchivo = 0;
        validos.forEach((item) => {
          const existeBD = event.invitados_array.findIndex((el: any) => el.correo === item.correo || el.telefono === item.telefono) > -1;
          if (existeBD) { dupBD++; return; }
          const repetido = corrects.findIndex((el) => (el.correo === item.correo || el.telefono === item.telefono) && el.nombre !== item.nombre) > -1;
          if (repetido) { dupArchivo++; return; }
          corrects.push(item);
        });

        // Feedback DETALLADO (ya no un genérico "El archivo contiene errores").
        const avisos: string[] = [];
        if (invalidos.length) {
          const det = invalidos.slice(0, 6).map((e) => `fila ${e.fila} (falta ${e.faltan.join('/')})`).join(', ');
          avisos.push(`${invalidos.length} con datos incompletos: ${det}${invalidos.length > 6 ? '…' : ''}`);
        }
        if (dupBD) avisos.push(`${dupBD} ya existían en el evento`);
        if (dupArchivo) avisos.push(`${dupArchivo} repetidas en el archivo`);

        if (corrects.length === 0) {
          toast('error', avisos.length ? `No se importó nada. ${avisos.join(' | ')}` : t('fileErrors'));
          setTimeout(() => setActiveInputUpload(false), 1000);
          return;
        }

        fetchApiBodas({
          query: queries.createGuests,
          variables: { eventID: event._id, invitados_array: corrects },
        })
          .then((results: any) => {
            // fetchApiBodas devuelve null en error GraphQL (NO lanza). Confirmar éxito real.
            if (!results?.success || (results?.errors?.length ?? 0) > 0) {
              const msg = results?.errors?.[0]?.message;
              toast('error', `No se pudieron guardar los invitados${msg ? `: ${msg}` : ''}`);
              return;
            }
            // Inmutable + updater functional (evita race con el socket de realtime).
            const nuevos = results?.evento?.invitados_array;
            if (nuevos) setEvent((prev: any) => ({ ...prev, invitados_array: nuevos }));
            const base = `${corrects.length} ${t('importCorrect')}`;
            toast('success', avisos.length ? `${base}. Omitidas: ${avisos.join(' | ')}` : base);
          })
          .finally(() => {
            setTimeout(() => setActiveInputUpload(false), 1000);
          });
      } catch (error) {
        toast('error', t('fileErrors'));
        setActiveInputUpload(false);
      }
    };
    lector.readAsArrayBuffer(file);
  };

  // Descargar plantilla de importación: se genera EN EL NAVEGADOR con XLSX (sin depender de
  // ninguna URL externa — antes apuntaba a api-mcp, que es GraphQL y devolvía "Cannot GET ...").
  // Las cabeceras deben coincidir EXACTAMENTE con las que lee convertirExcelAJson.
  const descargarPlantilla = () => {
    try {
      const cabeceras = ["NOMBRE", "CORREO", "TELEFONO", "ACOMPAÑANTES", "SEXO", "GRUPO DE EDAD"];
      const ejemplo = [
        { "NOMBRE": "Juan Pérez", "CORREO": "juan@ejemplo.com", "TELEFONO": "+34600000000", "ACOMPAÑANTES": 1, "SEXO": "hombre", "GRUPO DE EDAD": "adultos" },
        { "NOMBRE": "María López", "CORREO": "maria@ejemplo.com", "TELEFONO": "+34600000001", "ACOMPAÑANTES": 0, "SEXO": "mujer", "GRUPO DE EDAD": "adultos" },
      ];
      const hoja = XLSX.utils.json_to_sheet(ejemplo, { header: cabeceras });
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Contactos");
      XLSX.writeFile(libro, "Plantilla de Contactos.xlsx");
    } catch (error) {
      toast("error", t("Ha ocurrido un error al generar la plantilla"));
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
              <div className="absolute md:left-0 -left-6 top-8 shadow-md bg-white  p-5 z-50 rounded-md space-y-2 border-gray-100 border-[1px]">
                <button
                  onClickCapture={() => { setActiveInputUpload(true) }}
                  onClick={() => document.getElementById('fileInput').click()}
                  className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary w-max text-center "
                >
                  <span className="first-letter:uppercase">{t("uploadExcel")}</span>
                </button>
                <button
                  onClick={descargarPlantilla}
                  className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary w-max text-center"
                >
                  <span className="first-letter:uppercase">{t("downloadTemplate")}</span>
                </button>
              </div>
            </ClickAwayListener>
          }
        </button>
        {/* <button
          onClick={() => setOptionExportModal(!optionExportModal)}
          className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize relative"
        >
          {t("exportar")}
          {optionExportModal &&
            <ClickAwayListener onClickAway={() => setOptionExportModal(false)}>
              <div className="absolute md:left-0 -left-3 top-8 shadow-md bg-white p-5 z-50 rounded-md space-y-2 border-gray-100 border-[1px]">
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
        </button> */}
      </div>
    </div>
  )
}