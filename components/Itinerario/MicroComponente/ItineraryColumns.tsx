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
import { Itinerary, OptionsSelect } from "../../../utils/Interfaces";
import { AuthContextProvider, EventContextProvider } from "../../../context";

import { ImageAvatar } from "../../Utils/ImageAvatar";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink";
import i18next from "i18next";
import Link from "next/link";
import { useToast } from "../../../hooks/useToast";
import { IniterarySelectionMenu } from "./InitinerarySelectionMenu";
import { FaPencilAlt } from "react-icons/fa"; // Ícono de lápiz
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
}

  export const ItineraryColumns: FC<props> = ({
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
  }) => {
    const { t } = useTranslation();
    const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([])
    const storage = getStorage();

  

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

/*   const handleDownload = async ({ elem, task }) => {
    try {
      const storageRef = ref(storage, `${task._id}//${elem.name}`)
      const metaData = await getMetadata(storageRef)
      getBytes(storageRef).then(buffer => {
        const blob = new Blob([buffer], { type: metaData.contentType })
        const file = new File([blob], elem.name, { type: metaData.contentType })
        const url = window.URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', elem.name)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    } catch (error) {
      console.log(10003, error)
    }
  } */

/*   const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <Link href={props?.url}>
        <a className="text-xs break-all underline" target="_blank"  >{props?.children}</a>
      </Link>
    )
  }; */

  const Columna = useMemo(
    () => [
      {
        Header: t("title"),
        accessor: "descripcion",
        id: "description",
        className: 'sticky *lg:static z-0 left-0 relative',
        Cell: (data) => {
          const containerRef = useRef<HTMLDivElement>(null);
          const [showModal, setShowModal] = useState(false);
          const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
          const limitedText = useDynamicCharacterLimit(data.cell.value || "", containerRef);
      
          const handleOpenModal = () => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
              setShowModal(true);
            }
          };
      
          if (!data.cell.value) return null;
      
          return (
            <>
              <div
                ref={containerRef}
                className="relative group flex items-start w-full text-left transition-all duration-300"
              >
                {/* Contenedor principal con borde dinámico */}
                <div
                  className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                >
                  <div
                    className="overflow-hidden max-h-[2rem] group-hover:max-h-[10rem] transition-all duration-300 ease-in-out whitespace-normal"
                  >
                    <span className="flex-1 pr-10">
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
                </div>
              </div>
      
              {/* Modal fuera del contenedor de la celda */}
              {showModal && (
  <div
    className="fixed top-0 left-0 w-full h-full flex items-center justify-center border-[1px] border-gray-400 z-[1000]"
    onClick={() => setShowModal(false)} // Cierra el modal al hacer clic fuera
  >
    <div
      className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-[350px] max-w-full" // Reducido el ancho del modal
      style={{
        position: "absolute",
        top: modalPosition.top + 40, // Ajusta la posición para que esté debajo de la celda
        left: modalPosition.left,
      }}
      onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
    >
      <Formik
        initialValues={{ descripcion: data.cell.value || "" }}
        onSubmit={(values) => {
          // Lógica para guardar cambios
          console.log("Guardando:", values.descripcion);
          setShowModal(false); // Cierra el modal al guardar
        }}
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <div className="p-2">
              <h2 className="text-md font-semibold mb-3 text-center">{t("Editar Título")}</h2> {/* Tamaño reducido */}
              <InputField
                name="descripcion"
                type="text"
                className="w-full text-sm p-2 border border-gray-300 rounded" // Ajustado al nuevo tamaño
              />
              <div className="flex justify-end space-x-2 mt-4">
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
      },

      {
        Header: t("date"),
        accessor: "fecha",
        id: "date",
        Cell: (data) => {
          const containerRef = useRef<HTMLDivElement>(null);
          const [showModal, setShowModal] = useState(false);
          const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
          const limitedText = useDynamicCharacterLimit(
            data.cell.value ? new Date(data.cell.value).toLocaleString() : "",
            containerRef
          );
      
          const handleOpenModal = () => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
              setShowModal(true);
            }
          };
      
          if (!data.cell.value) return null;
      
          return (
            <>
              <div
                ref={containerRef}
                className="relative group flex items-start w-full text-left transition-all duration-300"
              >
                {/* Contenedor principal con borde dinámico */}
                <div
                  className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                >
                  <div
                    className="overflow-hidden max-h-[2rem] group-hover:max-h-[10rem] transition-all duration-300 ease-in-out whitespace-normal"
                  >
                    <span className="flex-1 pr-10">
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
      },

      {
        Header: t("duracion"),
        accessor: "duracion",
        id: "duration",
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
      
          if (!data.cell.value) return null;
      
          return (
            <>
              <div
                ref={containerRef}
                className="relative group flex items-start w-full text-left"
              >
                {/* Contenedor principal con borde dinámico */}
                <div
                  className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                >
                  <div className="whitespace-nowrap">
                    <span className="flex-1 pr-10">
                      {data.cell.value} min
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
      },

      {
        Header: t("responsible"),
        accessor: "responsable",
        id: "responsables",
        Cell: (data) => {
          const containerRef = useRef<HTMLDivElement>(null);
          const [showModal, setShowModal] = useState(false);
          const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
          const [tempValues, setTempValues] = useState({ responsable: data.cell.value || [] });
          const { user } = AuthContextProvider(); // Llama a la función para obtener el contexto
          const { event } = EventContextProvider(); // Llama a la función para obtener el contexto
      
          // Definición de handleChange
          const handleChange = (field, value) => {
            setTempValues((prev) => ({ ...prev, [field]: value }));
          };
      
          const handleOpenModal = () => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
              setShowModal(true);
            }
          };
      
          const handleSave = () => {
            console.log("Guardando responsables:", tempValues.responsable);
            setShowModal(false);
          };
      
          const handleCancel = () => {
            setTempValues({ responsable: data.cell.value || [] });
            setShowModal(false);
          };
      
          if (!data.cell.value || data.cell.value.length === 0) {
            return (
              <span className="text-[12px] text-gray-400 capitalize cursor-default">
                {t("unassigned")}
              </span>
            );
          }
      
          return (
            <>
              <div
                ref={containerRef}
                className="relative group flex items-start w-full text-left transition-all duration-300"
              >
                {/* Contenedor principal con borde dinámico */}
                <div
                  className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                >
                  <div className="whitespace-nowrap">
                    <span className="flex pr-10">
                      {data.cell.value.map((elem, idx) => {
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
                      })}
                    </span>
                  </div>
                  <button
                    className="absolute right-[2.5px] top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                      initialValues={{ responsable: tempValues.responsable }}
                      onSubmit={(values) => {
                        console.log("Guardando responsables:", values.responsable);
                        setTempValues({ responsable: values.responsable });
                        setShowModal(false); // Cierra el modal al guardar
                      }}
                    >
                      {({ handleSubmit }) => (
                        <Form onSubmit={handleSubmit}>
                          <h2 className="text-lg font-semibold mb-4">{t("Editar Responsables")}</h2>
                          <div className="w-full relative flex items-center">
                            <ResponsableSelector
                              name="responsable"
                              handleChange={(newResponsables) =>
                                handleChange("responsable", newResponsables)
                              }
                              disable={false}
                            />
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-green text-white rounded"
                            >
                              <FaCheck /> {/* Ícono de aceptar */}
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 bg-red text-white rounded"
                              onClick={handleCancel}
                            >
                              <FaTimes /> {/* Ícono de cancelar */}
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
      },
      
      {
        Header: t("tips"),
        accessor: "tips",
        id: "tips",
        Cell: (data) => {
          const containerRef = useRef<HTMLDivElement>(null);
          const [showModal, setShowModal] = useState(false);
          const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
      
          // Función para limitar caracteres dinámicamente según el ancho del contenedor
          const getLimitedText = (text: string) => {
            if (!containerRef.current) return text;
            const containerWidth = containerRef.current.offsetWidth; // Ancho del contenedor
            const charWidth = 7; // Ancho promedio de un carácter en píxeles
            const maxChars = Math.floor(containerWidth / charWidth); // Número máximo de caracteres que caben
            return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
          };
      
          const cleanText = stripHtml(data.cell.value || ""); // Limpia el texto de etiquetas HTML
          const limitedText = getLimitedText(cleanText); // Aplica la limitación de caracteres
      
          const handleOpenModal = () => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
              setShowModal(true);
            }
          };
      
          if (!data.cell.value) return null;
      
          return (
            <>
              <div
                ref={containerRef}
                className="relative group flex items-start w-full text-left transition-all duration-300"
              >
                {/* Contenedor principal con borde dinámico */}
                <div
                  className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                >
                  <div
                    className="whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="flex-1 pr-10">
                      {limitedText} {/* Texto limpio y limitado */}
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
      
              {/* Modal para editar tips */}
              {showModal && (
                <div
                  className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-[1000]"
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
      },

      {
        Header: t("attachments"),
        accessor: "attachments",
        id: "attachments",
        Cell: (data) => {
          const containerRef = useRef<HTMLDivElement>(null);
          const [showModal, setShowModal] = useState(false);
          const [infoModal, setInfoModal] = useState(false); // Estado para el modal de información
          const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
      
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
            data.cell.value ? data.cell.value.map((elem) => elem.name).join(", ") : "",
            containerRef
          );
      
          if (!data.cell.value || data.cell.value.length === 0) return null;
      
          return (
            <>
              <div
                ref={containerRef}
                className="relative group flex items-start w-full text-left transition-all duration-300"
              >
                {/* Contenedor principal con borde dinámico */}
                <div
                  className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                >
                  <div
                    className="overflow-hidden max-h-[2rem] whitespace-nowrap text-ellipsis"
                  >
                    <span className="flex-1 pr-10">
                      {limitedText} {/* Texto limitado */}
                    </span>
                  </div>
                  <div className="absolute right-[2px] top-1/2 transform -translate-y-1/2 flex space-x-2">
                    {/* Botón para abrir el modal de información */}
                    <button
                      className="bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInfoModal();
                      }}
                    >
                      <span>↓</span> {/* Ícono de flecha */}
                    </button>
                    {/* Botón para abrir el modal de edición */}
                    <button
                      className="bg-gray-200 text-gray-600 border border-gray-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                    >
                      <FaPencilAlt />
                    </button>
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
      <h2 className="text-md font-semibold mb-3">{t("Información de Adjuntos")}</h2> {/* Tamaño reducido del título */}
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
      <div className="flex justify-end mt-3">
        <button
          className="px-3 py-1 bg-red-500 text-white rounded text-sm" // Botón más pequeño
          onClick={() => setInfoModal(false)}
        >
          {t("Cerrar")}
        </button>
      </div>
    </div>
  </div>
)}
            </>
          );
        },
      },

      {
        Header: t("labels"),
        accessor: "tags",
        id: "tags",
        Cell: (data) => {
          const containerRef = useRef<HTMLDivElement>(null);
          const [showModal, setShowModal] = useState(false);
          const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
      
          // Limitador de texto ajustado a 5 caracteres
          const limitedText = useMemo(() => {
            if (!data.cell.value || data.cell.value.length === 0) return null;
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
      
          if (!data.cell.value || data.cell.value.length === 0) return null;
      
          return (
            <>
              <div
                ref={containerRef}
                className="relative group flex items-start w-full text-left transition-all duration-300"
              >
                {/* Contenedor principal con borde dinámico */}
                <div
                  className="w-full p-[5px] group-hover:border group-hover:border-primary rounded-md transition-all duration-300"
                >
                  <div
                    className="overflow-hidden max-h-[2rem] whitespace-nowrap text-ellipsis"
                  >
                    <span className="flex-1 pr-10">
                      {limitedText} {/* Texto limitado a 5 caracteres */}
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
      
              {/* Modal para editar etiquetas */}
              {showModal && (
                <div
                  className="fixed top-0 left-[-124px] w-full h-full flex items-center justify-center border-[1px] border-gray-400 z-[1000]"
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
                      initialValues={{ tags: data.cell.value || [] }}
                      onSubmit={(values) => {
                        console.log("Guardando etiquetas:", values.tags);
                        setShowModal(false); // Cierra el modal al guardar
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
      },
    ],
    [itinerario, i18next.language]
  );

  return (
    <div className="">
      {arrEnviarInvitaciones.length > 0 && (
        <ConfirmationBlock
          arrEnviarInvitaciones={arrEnviarInvitaciones}
          set={(act) => setArrEnviatInvitaciones(act)}
        />
      )}
      <ItineraryTable
        columns={Columna}
        data={data}
        multiSeled={multiSeled}
        setArrEnviatInvitaciones={setArrEnviatInvitaciones}
        reenviar={reenviar}
        activeFunction={activeFunction}
        selectTask={selectTask}
        setSelectTask={setSelectTask}
      />
      
    </div>
  );
};