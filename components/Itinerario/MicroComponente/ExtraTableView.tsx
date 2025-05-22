import { ComponentType, FC, useMemo, useState, useEffect, useRef } from "react";
import { ConfirmationBlock } from "../../Invitaciones/ConfirmationBlock";
import { useTranslation } from "react-i18next";
import { GruposResponsablesArry, ResponsableSelector } from "./ResponsableSelector";
import { ItineraryTable } from "./ItineraryTable";
import { GoEye } from "react-icons/go";
import { EditTastk } from "./ItineraryPanel";
import { useAllowed } from "../../../hooks/useAllowed";
import { CgSoftwareDownload } from "react-icons/cg";
import { getBytes, getMetadata, getStorage, ref } from "firebase/storage";
import { Itinerary, OptionsSelect, Event as EventInterface } from "../../../utils/Interfaces";
import { AuthContextProvider, EventContextProvider } from "../../../context";

import { ImageAvatar } from "../../Utils/ImageAvatar";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink";
import i18next from "i18next";
import Link from "next/link";
import { useToast } from "../../../hooks/useToast";
import { IniterarySelectionMenu } from "./InitinerarySelectionMenu";
import { FaPencilAlt, FaCog } from "react-icons/fa"; // Ícono de lápiz y engranaje
import { Modal } from "../../Utils/ModalServicios"; // Componente Modal
import InputField from "../../Forms/InputField"; // Componente InputField
import { Formik, Form } from "formik";
import ReactDOM from "react-dom";
import { FaCheck, FaTimes } from "react-icons/fa"; // Importa los íconos
import { t } from "i18next"; // Para traducciones
import { useContext } from "react";

import { MyEditor } from "./QuillText";
import InputAttachments from "../../Forms/InputAttachments";
import { InputTags } from "../../Forms/InputTags";
import { fetchApiEventos, queries } from "../../../utils/Fetching";

interface props {
  data?: any[],
  multiSeled?: boolean,
  reenviar?: boolean,
  activeFunction?: any
  setModalStatus: any
  modalStatus: any
  setModalWorkFlow: any
  modalWorkFlow: any
  setModalCompartirTask: any
  modalCompartirTask: any
  deleteTask: any
  showEditTask: EditTastk
  setShowEditTask: any
  optionsItineraryButtonBox: OptionsSelect[]
  selectTask: string
  setSelectTask: any
  itinerario: Itinerary
  event: EventInterface
}

interface Column {
  Header: string;
  accessor: string;
  id: string;
  className?: string;
  Cell: (data: any) => JSX.Element;
  isHidden?: boolean; // Agregar la propiedad isHidden
}

const ColumnFilter = ({ columns, setHiddenColumns, headerRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ right: '10px' });

  useEffect(() => {
    if (headerRef.current) {
      // Obtener todas las celdas del header visibles
      const headerCells = headerRef.current.querySelectorAll('th:not(.hidden)');
      if (headerCells.length > 0) {
        const lastCell = headerCells[headerCells.length - 1];
        const containerRect = headerRef.current.getBoundingClientRect();
        const lastCellRect = lastCell.getBoundingClientRect();
        
        // Calcular posición relativa del final de la última columna
        const rightPosition = containerRect.right - lastCellRect.right;
        setButtonPosition({ right: `${Math.max(rightPosition - 40, 10)}px` });
      }
    }
  }, [columns.filter(col => !col.isHidden).length]);

  const toggleColumnVisibility = (columnId) => {
    setHiddenColumns((prev) => {
      const updatedHiddenColumns = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId];
      return updatedHiddenColumns;
    });
  };

  return (
    <div
      className="absolute top-0 z-50"
      style={buttonPosition}
    >
      <button
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full shadow-md hover:bg-gray-300 transition duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaCog className="text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {t("Configurar Columnas")}
            </h3>
            <ul className="space-y-1">
              {columns.map((column) => (
                <li key={column.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`column-${column.id}`}
                    checked={!column.isHidden}
                    onChange={() => toggleColumnVisibility(column.id)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`column-${column.id}`}
                    className="text-sm text-gray-600"
                  >
                    {column.Header}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export const ExtraTableView: FC<props> = ({
  data = [],
  multiSeled = true,
  reenviar = true,
  activeFunction,
  setModalStatus,
  modalStatus,
  setModalWorkFlow,
  modalWorkFlow,
  setModalCompartirTask,
  modalCompartirTask,
  deleteTask,
  showEditTask,
  setShowEditTask,
  optionsItineraryButtonBox,
  selectTask,
  setSelectTask,
  itinerario,
  event,

}) => {
    const storage = getStorage();
    const { t } = useTranslation();
    const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([]);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableWidth, setTableWidth] = useState(0);
  

  

    // Verifica si los datos están llegando correctamente
    useEffect(() => {
      if (!data || data.length === 0) {
        console.warn("No se recibieron datos en ExtraTableView");
      }
    }, [data]);
  

    const useDynamicCharacterLimit = (text: string, containerRef: React.RefObject<HTMLDivElement>) => {
      const [limitedText, setLimitedText] = useState(text);
    
      useEffect(() => {
        const calculateLimit = () => {
          if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth; // Ancho del contenedor
            const charWidth = 7; // Ajuste más preciso del ancho promedio de un carácter en píxeles
            const maxChars = Math.floor(containerWidth / charWidth); // Calcular el número máximo de caracteres
            setLimitedText(text.length > maxChars ? `${text.slice(0, maxChars)}...` : text);
          }
        };
    
        calculateLimit();
        window.addEventListener("resize", calculateLimit); // Recalcular en caso de redimensionar la ventana
    
        return () => {
          window.removeEventListener("resize", calculateLimit);
        };
      }, [text, containerRef]);
    
      return limitedText;
    };

    const stripHtml = (html: string): string => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.body.textContent || "";
    };

    const Columna: Column[] = useMemo(
      () => [
        {
          Header: t("title"),
          accessor: "descripcion",
          id: "description",
          width: 150, // Ancho inicial
          minWidth: 100, // Ancho mínimo
          maxWidth: 300, // Ancho máximo
          canResize: true, // Habilitar redimensionamiento
          Cell: (data) => {
            const containerRef = useRef<HTMLDivElement>(null);
            const [showModal, setShowModal] = useState(false);
            const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
            const limitedText = useDynamicCharacterLimit(data.cell.value || "", containerRef);
            const [showTooltip, setShowTooltip] = useState(false); // Estado para mostrar el tooltip
          
            const handleOpenModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setShowModal(true);
              }
            };
          
            return (
              <>
      <div
        ref={containerRef}
        className="relative group flex items-start w-full text-left transition-all duration-300"
        onMouseEnter={() => {
          if (data.cell.value && data.cell.value.length > limitedText.length) {
            setShowTooltip(true); // Muestra el tooltip si la información sobrepasa el límite
          }
        }}
        onMouseLeave={() => setShowTooltip(false)} // Oculta el tooltip al salir del hover
      >
                  {/* Contenedor principal con borde dinámico */}
                  <div
                    className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                  >
                    <div
                      className="overflow-hidden max-h-[2rem] group-hover:max-h-[10rem] transition-all duration-300 ease-in-out whitespace-nowrap"
                    >
                      <span className="flex-1 pr-10">
                        {data.cell.value ? limitedText : <span className="text-gray-400">{t("Sin información")}</span>}
                      </span>
                    </div>
                    <button
                      className="absolute right-[2px] top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                    >
                      <FaPencilAlt />
                    </button>

                              {/* Tooltip que muestra la información completa */}
          {showTooltip && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md p-2 z-50 w-auto max-w-xs">
              <span className="text-sm text-gray-700">{data.cell.value}</span>
            </div>
          )}

                              {/* Código integrado */}
          <div className="absolute w-[22px] h-[22px] top-[3px] right-[26px] z-50 bg-gray-200 text-gray-600 border border-gray-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <IniterarySelectionMenu
              data={data}
              itinerario={itinerario}
              optionsItineraryButtonBox={optionsItineraryButtonBox}
              setShowEditTask={setShowEditTask}
              showEditTask={showEditTask}
            />
          </div>
                  </div>
                </div>
          
                {/* Modal fuera del contenedor de la celda */}
                {showModal && (
                  <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center border-[1px] border-gray-400 z-[1050]"
                    onClick={() => setShowModal(false)} // Cierra el modal al hacer clic fuera
                  >
                    <div
                      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full "
                      style={{
                        position: "absolute",
                        top: modalPosition.top + 40, // Ajusta la posición para que esté debajo de la celda
                        left: modalPosition.left,
                        zIndex: 1051, // Asegura que el contenido del modal esté encima
                      }}
                      onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
                    >
                      <Formik
                        initialValues={{ descripcion: data.cell.value || "" }}
                        onSubmit={(values) => {
                          console.log("Guardando:", values.descripcion);
                          setShowModal(false); // Cierra el modal al guardar
                        }}
                      >
                        {({ handleSubmit }) => (
                          <Form onSubmit={handleSubmit}>
                            <div className="p-2">
                              <h2 className="text-md font-semibold mb-3 text-center">{t("Editar Título")}</h2>
                              <InputField
                                name="descripcion"
                                type="text"
                                className="w-full text-sm p-2 border border-gray-300 rounded"
                              />
                              <div className="flex justify-end space-x-2 mt-4">
                                <button
                                  type="submit"
                                  className="px-3 py-1 bg-green text-white rounded flex items-center justify-center text-sm"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-red text-white rounded flex items-center justify-center text-sm"
                                  onClick={() => setShowModal(false)}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
              </>
            );
          },
          isHidden: hiddenColumns.includes("description"), // Sincroniza con hiddenColumns
        },
  
        {
          Header: t("date"),
          accessor: "fecha",
          id: "date",
          width: 100, // Ancho inicial
          minWidth: 80, // Ancho mínimo
          maxWidth: 200, // Anc
          canResize: true, // Habilitar redimensionamientoho máximo
          Cell: (data) => {
            const containerRef = useRef<HTMLDivElement>(null);
            const [showModal, setShowModal] = useState(false);
            const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
            const [showTooltip, setShowTooltip] = useState(false);
            const limitedText = useDynamicCharacterLimit(
              data.cell.value ? new Date(data.cell.value).toLocaleString() : t("Sin Fecha"),
              containerRef
            );
          
            const handleOpenModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setShowModal(true);
              }
            };
          
            return (
              <>
      <div
        ref={containerRef}
        className="relative group flex items-start w-full text-left transition-all duration-300"
        onMouseEnter={() => {
          if (data.cell.value && data.cell.value.length > limitedText.length) {
            setShowTooltip(true); // Muestra el tooltip si la información sobrepasa el límite
          }
        }}
        onMouseLeave={() => setShowTooltip(false)} // Oculta el tooltip al salir del hover
      >
                  <div
                    className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                  >
                    <div
                      className="overflow-hidden max-h-[2rem] group-hover:max-h-[10rem] transition-all duration-300 ease-in-out whitespace-nowrap"
                    >
                    <span className={data.cell.value ? "" : "text-gray-400"}>
                      {limitedText}
                    </span>
                    </div>
                    <button
                      className="absolute right-[2px] top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                    >
                      <FaPencilAlt />
                    </button>
    {/* Tooltip que aparece siempre al hacer hover */}
    {showTooltip && (
      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md p-2 z-50 w-auto max-w-xs">
        <span className="text-sm text-gray-700">{data.cell.value}</span>
      </div>
    )}
                  </div>
                </div>
        
                {/* Modal para editar Fecha y Hora */}
                {showModal && (
                  <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center borde-[1px] border-gray-400 z-[1000]"
                    onClick={() => setShowModal(false)} // Cierra el modal al hacer clic fuera
                  >
                    <div
                      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full"
                      style={{
                        position: "absolute",
                        top: modalPosition.top + 40, // Ajusta la posición para que esté debajo de la celda
                        left: modalPosition.left,
                      }}
                      onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
                    >
                      <Formik
                        initialValues={{
                          fecha: data.cell.value ? new Date(data.cell.value).toISOString().split("T")[0] : "",
                          hora: data.cell.value ? new Date(data.cell.value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
                        }}
                        onSubmit={(values) => {
                          // Lógica para guardar cambios
                          console.log("Guardando Fecha y Hora:", values);
                          setShowModal(false); // Cierra el modal al guardar
                        }}
                      >
                        {({ values, handleChange }) => (
                          <Form>
                            <div className="p-4">
                              <h2 className="text-md font-semibold mb-3 text-center">{t("Editar Fecha y Hora")}</h2>
                              <div className="space-y-4">
                                {/* Componente para editar Fecha */}
                                <div className="space-x-5 flex items-center">
                                  <span className="text-[14px] capitalize">{t("Fecha")}:</span>
                                  <InputField
                                    name="fecha"
                                    type="date"
                                    value={values.fecha}
                                    onChange={handleChange}
                                    className="w-full text-sm p-2 border border-gray-300 rounded"
                                  />
                                </div>
        
                                {/* Componente para editar Hora */}
                                <div className="space-x-5 flex items-center">
                                  <span className="text-[14px] capitalize">{t("Hora")}:</span>
                                  <InputField
                                    name="hora"
                                    type="time"
                                    value={values.hora}
                                    onChange={handleChange}
                                    className="w-full text-sm p-2 border border-gray-300 rounded"
                                  />
                                </div>
                              </div>
        
                              {/* Botones de Guardar y Cancelar */}
                              <div className="flex justify-end space-x-4 mt-6">
                                <button
                                  type="submit"
                                  className="px-3 py-1 bg-green text-white rounded flex items-center justify-center text-sm"
                                >
                                  <FaCheck /> {/* Ícono de aceptar */}
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-red text-white rounded flex items-center justify-center text-sm"
                                  onClick={() => setShowModal(false)} // Cierra el modal al cancelar
                                >
                                  <FaTimes /> {/* Ícono de cancelar */}
                                </button>
                              </div>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
              </>
            
          );
          },
          isHidden: hiddenColumns.includes("date"), // Sincroniza con hiddenColumns
        },
  
        {
          Header: t("duracion"),
          accessor: "duracion",
          id: "duration",
          width: 100, // Ancho inicial
          minWidth: 80, // Ancho mínimo
          maxWidth: 200, // Anc
          canResize: true, // Habilitar redimensionamientoho máximo
          Cell: (data) => {
            const containerRef = useRef<HTMLDivElement>(null);
            const [showModal, setShowModal] = useState(false);
            const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
          
            const handleOpenModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setShowModal(true);
              }
            };
          
            return (
              <>
                <div
                  ref={containerRef}
                  className="relative group flex items-start w-full text-left"
                >
                  <div
                    className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                  >
                    <div className="whitespace-nowrap">
                      <span className="flex-1 pr-10">
                        {data.cell.value ? `${data.cell.value} min` : <span className="text-gray-400">{t("Sin duracion")}</span>}
                      </span>
                    </div>
                    <button
                      className="absolute right-[2px] top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                    >
                      <FaPencilAlt />
                    </button>
                  </div>
                </div>
        
                {/* Modal para editar Duración */}
                {showModal && (
                  <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center borde-[1px] border-gray-400 z-[1000]"
                    onClick={() => setShowModal(false)} // Cierra el modal al hacer clic fuera
                  >
                    <div
                      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full"
                      style={{
                        position: "absolute",
                        top: modalPosition.top + 40, // Ajusta la posición para que esté debajo de la celda
                        left: modalPosition.left,
                      }}
                      onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
                    >
                      <Formik
                        initialValues={{
                          duracion: data.cell.value || "",
                        }}
                        onSubmit={(values) => {
                          // Lógica para guardar cambios
                          console.log("Guardando Duración:", values);
                          setShowModal(false); // Cierra el modal al guardar
                        }}
                      >
                        {({ values, handleChange }) => (
                          <Form>
                            <div className="p-4">
                              <h2 className="text-md font-semibold mb-3 text-center">{t("Editar Duración")}</h2>
                              <div className="space-y-4">
                                {/* Componente para editar Duración */}
                                <div className="space-x-5 flex items-center">
                                  <span className="text-[14px] capitalize">{t("Duración")}:</span>
                                  <InputField
                                    name="duracion"
                                    type="number"
                                    value={values.duracion}
                                    onChange={handleChange}
                                    className="w-full text-sm p-2 border border-gray-300 rounded"
                                  />
                                </div>
                              </div>
        
                              {/* Botones de Guardar y Cancelar */}
                              <div className="flex justify-end space-x-4 mt-6">
                                <button
                                  type="submit"
                                  className="px-3 py-1 bg-green text-white rounded flex items-center justify-center text-sm"
                                >
                                  <FaCheck /> {/* Ícono de aceptar */}
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-red text-white rounded flex items-center justify-center text-sm"
                                  onClick={() => setShowModal(false)} // Cierra el modal al cancelar
                                >
                                  <FaTimes /> {/* Ícono de cancelar */}
                                </button>
                              </div>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
              </>
            );
          },
          isHidden: hiddenColumns.includes("duracion"), // Sincroniza con hiddenColumns
        },
  
        {
          Header: t("responsible"),
          accessor: "responsable",
          id: "responsables",
          width: 150, // Ancho inicial
          minWidth: 100, // Ancho mínimo
          maxWidth: 300, // Anc
          canResize: true, // Habilitar redimensionamientoho máximo
          Cell: (data) => {
            const containerRef = useRef<HTMLDivElement>(null);
            const [showModal, setShowModal] = useState(false);
            const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
            const [tempValues, setTempValues] = useState({ responsable: data.cell.value || [] });
            const { user } = AuthContextProvider();
            const { event } = EventContextProvider();
        
            const handleOpenModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setShowModal(true);
              }
            };
        
        
            return (
              <>
                <div
                  ref={containerRef}
                  className="relative group flex items-start w-full text-left transition-all duration-300"
                >
                  <div
                    className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                  >
                    <div className="whitespace-nowrap">
                      <span className="flex pr-10">
                        {data.cell.value?.length > 0 ? (
                          data.cell.value.map((elem, idx) => {
                            const userSelect =
                              GruposResponsablesArry.find(
                                (el) => el.title.toLowerCase() === elem?.toLowerCase()
                              ) ??
                              [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find(
                                (el) => el?.displayName?.toLowerCase() === elem?.toLowerCase()
                              );
          
                            return (
                              <span key={idx} className="inline-flex items-center space-x-0.5 mr-1.5">
                                <div className="w-6 h-6 rounded-full border-[0.5px] border-gray-400">
                                  <ImageAvatar user={userSelect} />
                                </div>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                            {t("Sin asignar")}
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      className="absolute right-[2px] top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                    >
                      <FaPencilAlt />
                    </button>
                  </div>
                </div>
          
                {/* Modal para editar responsables */}
                {showModal && (
                  <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center borde-[1px] border-gray-400 z-[1000]"
                    onClick={() => setShowModal(false)}
                  >
                    <div
                      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full"
                      style={{
                        position: "absolute",
                        top: modalPosition.top + 40,
                        left: modalPosition.left,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Formik
                        initialValues={{ responsable: tempValues.responsable }}
                        onSubmit={(values) => {
                          console.log("Guardando responsables:", values.responsable);
                          setTempValues({ responsable: values.responsable });
                          setShowModal(false);
                        }}
                      >
                        {({ handleSubmit }) => (
                          <Form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-semibold mb-4">{t("Editar Responsables")}</h2>
                            <div className="w-full relative flex items-center">
                              <ResponsableSelector
                                name="responsable"
                                handleChange={(newResponsables) =>
                                  setTempValues({ responsable: newResponsables })
                                }
                                disable={false}
                              />
                            </div>
                            <div className="flex space-x-2 mt-4">
                              <button
                                type="submit"
                                className="px-4 py-2 bg-green text-white rounded"
                              >
                                <FaCheck />
                              </button>
                              <button
                                type="button"
                                className="px-4 py-2 bg-red text-white rounded"
                                onClick={() => setShowModal(false)}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
              </>
            );
          },
          isHidden: hiddenColumns.includes("responsable"), // Sincroniza con hiddenColumns
        },
        
        {
          Header: t("tips"),
          accessor: "tips",
          id: "tips",
          width: 200, // Ancho inicial
          minWidth: 150, // Ancho mínimo
          maxWidth: 400, // Ancho máximo
          canResize: true, // Habilitar redimensionamientoho máximo
          Cell: (data) => {
            const containerRef = useRef<HTMLDivElement>(null);
            const [showModal, setShowModal] = useState(false);
            const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
            const [showTooltip, setShowTooltip] = useState(false);
        
            // Función para limitar caracteres dinámicamente según el ancho del contenedor
            const getLimitedText = (text: string) => {
              if (!containerRef.current) return text;
              const containerWidth = containerRef.current.offsetWidth; // Ancho del contenedor
              const charWidth = 7; // Ancho promedio de un carácter en píxeles
              const maxChars = Math.floor(containerWidth / charWidth); // Número máximo de caracteres que caben
              return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
            };
        
            const cleanText = stripHtml(data.cell.value || "");
            const limitedText = useDynamicCharacterLimit(cleanText || t("Sin información"), containerRef);
        
            const handleOpenModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setShowModal(true);
              }
            };
        
     
        
            return (
              <>
<div
        ref={containerRef}
        className="relative group flex items-start w-full text-left transition-all duration-300"
        onMouseEnter={() => {
          if (data.cell.value && data.cell.value.length > limitedText.length) {
            setShowTooltip(true); // Muestra el tooltip si la información sobrepasa el límite
          }
        }}
        onMouseLeave={() => setShowTooltip(false)} // Oculta el tooltip al salir del hover
      >
                  <div
                    className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                  >
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className={data.cell.value ? "" : "text-gray-400"}>
                        {limitedText}
                      </span>
                    </div>
                    <button
                      className="absolute right-[2px] top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                    >
                      <FaPencilAlt />
                    </button>
                        {/* Tooltip que aparece siempre al hacer hover */}
                        {showTooltip && (
  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md p-2 z-50 w-auto max-w-xs">
    <span className="text-sm text-gray-700 break-words">
      {cleanText}
    </span>
  </div>
)}
                  </div>
                </div>
          
                {/* Modal para editar tips */}
                {showModal && (
                  <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center border-[1px] border-gray-400 z-[1000]"
                    onClick={() => setShowModal(false)} // Cierra el modal al hacer clic fuera
                  >
                    <div
                      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full"
                      style={{
                        position: "absolute",
                        top: modalPosition.top + 40, // Ajusta la posición para que esté debajo de la celda
                        left: modalPosition.left,
                      }}
                      onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
                    >
                      <Formik
                        initialValues={{ tips: data.cell.value || "" }}
                        onSubmit={(values) => {
                          console.log("Guardando tips:", values.tips);
                          setShowModal(false); // Cierra el modal al guardar
                        }}
                      >
                        {({ handleSubmit }) => (
                          <Form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-semibold mb-4">{t("Editar Tips")}</h2>
                            <div className="w-full relative flex flex-col space-y-4">
                              <MyEditor name="tips" />
                              <div className="flex justify-end space-x-4">
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-green text-white rounded"
                                >
                                  <FaCheck /> {/* Ícono de aceptar */}
                                </button>
                                <button
                                  type="button"
                                  className="px-4 py-2 bg-red text-white rounded"
                                  onClick={() => setShowModal(false)}
                                >
                                  <FaTimes /> {/* Ícono de cancelar */}
                                </button>
                              </div>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
              </>
            );
          },
          isHidden: hiddenColumns.includes("tips"), // Sincroniza con hiddenColumns
        },
  
        {
          Header: t("attachments"),
          accessor: "attachments",
          id: "attachments",
          width: 180, // Ancho inicial
          minWidth: 120, // Ancho mínimo
          maxWidth: 300, // Ancho máximo
          canResize: true, // Habilitar redimensionamientoho máximo
          Cell: (data) => {
            const containerRef = useRef<HTMLDivElement>(null);
            const [showModal, setShowModal] = useState(false);
            const [infoModal, setInfoModal] = useState(false); // Estado para el modal de información
            const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
            const [showTooltip, setShowTooltip] = useState(false);
        
            const handleOpenModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setShowModal(true);
              }
            };
          
            const handleOpenInfoModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setInfoModal(true); // Abre el modal de información
              }
            };
        
            const handleDownload = async ({ elem, task }) => {
              try {
                const storageRef = ref(storage, `${task._id}//${elem.name}`);
                const metaData = await getMetadata(storageRef);
                getBytes(storageRef).then((buffer) => {
                  const blob = new Blob([buffer], { type: metaData.contentType });
                  const file = new File([blob], elem.name, { type: metaData.contentType });
                  const url = window.URL.createObjectURL(file);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", elem.name);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });
              } catch (error) {
                console.log(10003, error);
              }
            };
        
            const limitedText = useDynamicCharacterLimit(
              data.cell.value && Array.isArray(data.cell.value)
                ? data.cell.value.map((elem) => elem.name).join(", ")
                : t("Sin información"),
              containerRef
            );
        
        
            return (
              <>
      <div
        ref={containerRef}
        className="relative group flex items-start w-full text-left transition-all duration-300"
        onMouseEnter={() => {
          if (
            data.cell.value &&
            Array.isArray(data.cell.value) &&
            data.cell.value.map((elem) => elem.name).join(", ").length > limitedText.length
          ) {
            setShowTooltip(true);
          }
        }}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
        >
          <div className="overflow-hidden max-h-[2rem] whitespace-nowrap text-ellipsis">
          <span className={data.cell.value ? "flex-1 pr-10" : "flex-1 pr-10 text-gray-400"}>
              {limitedText}
            </span>
          </div>
          <div className="absolute right-[2px] top-1/2 transform -translate-y-1/2 flex space-x-2">
  {data.cell.value && data.cell.value.length > 0 && (
    <button
      className="bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      onClick={(e) => {
        e.stopPropagation();
        handleOpenInfoModal();
      }}
    >
      <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-3">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>
</span> {/* Ícono de flecha */}
    </button>
  )}
  <button
    className="bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    onClick={(e) => {
      e.stopPropagation();
      handleOpenModal();
    }}
  >
    <FaPencilAlt />
  </button>
           {/* Tooltip que aparece siempre al hacer hover */}
           {showTooltip && (
  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md p-2 z-50 w-auto max-w-xs">
    <ul className="text-sm text-gray-700 space-y-1">
      {data.cell.value.map((elem, idx) => (
        <li key={idx} className="whitespace-nowrap overflow-hidden text-ellipsis">
          {elem.name}
        </li>
      ))}
    </ul>
  </div>
)}
</div>
        </div>
      </div>
        
                {/* Modal para editar adjuntos */}
                {showModal && (
                  <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center border-[1px] border-gray-400 z-[1000]"
                    onClick={() => setShowModal(false)} // Cierra el modal al hacer clic fuera
                  >
                    <div
                      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full"
                      style={{
                        position: "absolute",
                        top: modalPosition.top + 40, // Ajusta la posición para que esté debajo de la celda
                        left: modalPosition.left,
                      }}
                      onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
                    >
                      <Formik
                        initialValues={{ attachments: data.cell.value || [] }}
                        onSubmit={(values) => {
                          console.log("Guardando adjuntos:", values.attachments);
                          setShowModal(false); // Cierra el modal al guardar
                        }}
                      >
                        {({ handleSubmit, setFieldValue }) => (
                          <Form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-semibold mb-4">{t("Editar Adjuntos")}</h2>
                            <div className="w-full relative flex flex-col space-y-4">
                              <InputAttachments
                                name="attachments"
                                onChange={(newAttachments) => setFieldValue("attachments", newAttachments)}
                              />
                              <div className="flex justify-end space-x-4">
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-green text-white rounded"
                                >
                                  <FaCheck /> {/* Ícono de aceptar */}
                                </button>
                                <button
                                  type="button"
                                  className="px-4 py-2 bg-red text-white rounded"
                                  onClick={() => setShowModal(false)}
                                >
                                  <FaTimes /> {/* Ícono de cancelar */}
                                </button>
                              </div>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
        
  {/* Modal para mostrar toda la información */}
  {infoModal && (
    <div
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center border-[1px] border-gray-400 z-[1000]"
      onClick={() => setInfoModal(false)} // Cierra el modal al hacer clic fuera
    >
      <div
        className="bg-white shadow-lg rounded-lg border border-gray-300 p-3 w-auto max-w-full" // Tamaño reducido del contenedor
        style={{
          position: "absolute",
          top: modalPosition.top + 40, // Ajusta la posición para que esté debajo de la celda
          left: modalPosition.left,
        }}
        onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
      >
        <h2 className="text-md font-semibold mb-3">{t("Descargar Archivos")}</h2> {/* Tamaño reducido del título */}
        <ul className="space-y-1">
          {data.cell.value.map((elem, idx) => (
            <li key={idx} className="flex items-center justify-start text-sm"> {/* Texto más pequeño */}
              <span className="truncate">{elem.name}</span>
              <button
                className="flex items-center space-x-1 text-gray-500 hover:underline text-xs" // Botón más compacto
                onClick={() => handleDownload({ elem, task: data.row.original })}
              >
                <CgSoftwareDownload />
                
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )}
              </>
            );
          },
          isHidden: hiddenColumns.includes("attachments"), // Sincroniza con hiddenColumns
        },
  
        {
          Header: t("labels"),
          accessor: "tags",
          id: "tags",
          width: 120, // Ancho inicial
          minWidth: 100, // Ancho mínimo
          maxWidth: 250, // Ancho máximo
          canResize: true, // Habilitar redimensionamientoho máximo
          Cell: (data) => {
            const containerRef = useRef<HTMLDivElement>(null);
            const [showModal, setShowModal] = useState(false);
            const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
            const [showTooltip, setShowTooltip] = useState(false);
        
            // Limitador de texto ajustado a 5 caracteres
            const limitedText = useMemo(() => {
              if (!data.cell.value || data.cell.value.length === 0) return t("Sin información");
              const text = data.cell.value.join(", ");
              return text.length > 5 ? `${text.slice(0, 5)}...` : text;
            }, [data.cell.value]);
        
            const handleOpenModal = () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                setShowModal(true);
              }
            };
        
        
            return (
              <>
      <div
        ref={containerRef}
        className="relative group flex items-start w-full text-left transition-all duration-300"
        onMouseEnter={() => {
          if (
            data.cell.value &&
            Array.isArray(data.cell.value) &&
            data.cell.value.join(", ").length > limitedText.length
          ) {
            setShowTooltip(true);
          }
        }}
        onMouseLeave={() => setShowTooltip(false)}
      >
                  <div
                    className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                  >
                    <div className="overflow-hidden max-h-[2rem] whitespace-nowrap text-ellipsis">
                    <span className={data.cell.value ? "flex-1 pr-10" : "flex-1 pr-10 text-gray-400"}>
                        {limitedText}
                      </span>
                    </div>
                    <button
                      className="absolute right-[2px] top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                    >
                      <FaPencilAlt />
                    </button>
          {/* Tooltip que aparece siempre al hacer hover */}
          {showTooltip && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md p-2 z-50 w-auto max-w-xs">
              <ul className="text-sm text-gray-700 space-y-1">
                {data.cell.value.map((tag, idx) => (
                  <li key={idx} className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
                  </div>
                </div>
          
                {/* Modal para editar etiquetas */}
                {showModal && (
                  <div
                    className="fixed top-0 right-56 w-full h-full flex items-center justify-center z-[1000]"
                    onClick={() => setShowModal(false)}
                  >
                    <div
                      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full"
                      style={{
                        position: "absolute",
                        top: modalPosition.top + 40,
                        left: modalPosition.left,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Formik
                        initialValues={{ tags: data.cell.value || [] }}
                        onSubmit={(values) => {
                          console.log("Guardando etiquetas:", values.tags);
                          setShowModal(false);
                        }}
                      >
                        {({ handleSubmit, setFieldValue }) => (
                          <Form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-semibold mb-4">{t("Editar Etiquetas")}</h2>
                            <div className="w-full relative flex flex-col space-y-4">
                              <InputTags
                                name="tags"
                                value={data.cell.value || []}
                                onChange={(newTags) => setFieldValue("tags", newTags)}
                              />
                              <div className="flex justify-end space-x-4">
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-green text-white rounded"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  type="button"
                                  className="px-4 py-2 bg-red text-white rounded"
                                  onClick={() => setShowModal(false)}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
              </>
            );
          },
          isHidden: hiddenColumns.includes("tags"), // Sincroniza con hiddenColumns
        },
        // Columna para Estado
    {
      Header: t("Estado"),
      accessor: "estado",
      id: "estado",
      width: 120,
      minWidth: 100,
      maxWidth: 200,
      canResize: true,
      Cell: (data) => {
        const [value, setValue] = useState(data.cell.value || "pending");
        const handleChange = async (newValue: string) => {
          setValue(newValue);
          await fetchApiEventos({
            query: queries.editTask,
            variables: {
              eventID: event._id,
              itinerarioID: itinerario._id,
              taskID: data.row.original._id,
              variable: "estado",
              valor: newValue,
            },
          });
        };

        return (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="blocked">Bloqueado</option>
          </select>
        );
      },
      isHidden: hiddenColumns.includes("estado"),
    },

    // Columna para Prioridad
    {
      Header: t("Prioridad"),
      accessor: "prioridad",
      id: "prioridad",
      width: 120,
      minWidth: 100,
      maxWidth: 200,
      canResize: true,
      Cell: (data) => {
        const [value, setValue] = useState(data.cell.value || "media");
        const handleChange = async (newValue: string) => {
          setValue(newValue);
          await fetchApiEventos({
            query: queries.editTask,
            variables: {
              eventID: event._id,
              itinerarioID: itinerario._id,
              taskID: data.row.original._id,
              variable: "prioridad",
              valor: newValue,
            },
          });
        };

        return (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        );
      },
      isHidden: hiddenColumns.includes("prioridad"),
    },
      ],
      [itinerario, i18next.language, t, hiddenColumns]
    );


    const visibleColumnsCount = Columna.filter((column) => !hiddenColumns.includes(column.id)).length;

    useEffect(() => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.offsetWidth); // Calcula el ancho de la tabla
      }
    }, [hiddenColumns]);
  
    return (
      <div className="w-full p-4 relative">
        {arrEnviarInvitaciones.length > 0 && (
          <ConfirmationBlock
            arrEnviarInvitaciones={arrEnviarInvitaciones}
            set={(act) => setArrEnviatInvitaciones(act)}
          />
        )}
        <div ref={tableRef} className="relative">
          <ItineraryTable
            columns={Columna}
            data={data}
            multiSeled={multiSeled}
            setArrEnviatInvitaciones={setArrEnviatInvitaciones}
            reenviar={reenviar}
            activeFunction={activeFunction}
            selectTask={selectTask}
            setSelectTask={setSelectTask}
            headerRef={tableRef} // Pasar la referencia
          />
          
          {/* Filtro de columnas con nueva implementación */}
          <ColumnFilter
            columns={Columna}
            setHiddenColumns={setHiddenColumns}
            headerRef={tableRef}
          />
        </div>
      </div>
    );
}; 