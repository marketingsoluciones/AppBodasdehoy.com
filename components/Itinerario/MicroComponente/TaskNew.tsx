import { Form, Formik } from "formik";
import { FC, HTMLAttributes, useEffect, useRef, useState, useCallback, memo } from "react";
import { SelectIcon, GruposResponsablesArry, ResponsableSelector } from ".";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useTranslation } from 'react-i18next';
import { ItineraryButtonBox } from './ItineraryButtonBox'
import { Comment, Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";
import { CgSoftwareDownload } from "react-icons/cg";
import { getStorage } from "firebase/storage";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher } from "interweave-autolink";
import 'react-quill/dist/quill.snow.css'
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { InputComments } from "./InputComments"
import { ListComments } from "./ListComments"
import ClickAwayListener from "react-click-away-listener";
import { CopiarLink } from "../../Utils/Compartir";
import { useRouter } from "next/router";
import { IoCalendarClearOutline } from "react-icons/io5";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { LiaPaperclipSolid } from "react-icons/lia";
import { MdOutlineLabel } from "react-icons/md";
import { RiNotification2Fill } from "react-icons/ri";
import { GoChevronDown } from "react-icons/go";
import { LuClock } from "react-icons/lu";
import { TempPastedAndDropFiles } from "./ItineraryPanel";
import { downloadFile } from "../../Utils/storages";
import { useToast } from "../../../hooks/useToast";
import InputField from "../../Forms/InputField";
import InputAttachments from "../../Forms/InputAttachments";
import { InputTags } from "../../Forms/InputTags";
import { MyEditor } from "./QuillText";
import { FaPencilAlt, FaCheck, FaTimes } from "react-icons/fa";
import { Modal } from "../../Utils/ModalServicios";
import { Flag, ChevronDown } from 'lucide-react';
import { TASK_STATUSES, TASK_PRIORITIES } from './NewTypes';

// Tipos mejorados
interface TaskFormValues {
  _id: string;
  icon: string;
  fecha: string;
  hora: string;
  duracion: string | number;
  tags: string[];
  descripcion: string;
  responsable: string[];
  tips: string;
  attachments: any[];
  spectatorView: boolean;
  comments: Comment[];
  commentsViewers: any[];
  estatus: boolean;
  estado: string;
  prioridad: string;
}

// Identificadores de campos
const FIELD_IDS = {
  HEADER: 'header-field',
  DESCRIPTION: 'description-field', 
  RESPONSABLE: 'responsable-field',
  ATTACHMENTS: 'attachments-field',
  TAGS: 'tags-field',
  DATETIME: 'datetime-field',
  TIPS: 'tips-field',
  STATUS: 'status-field',
  PRIORITY: 'priority-field'
} as const;

// Componente de botones de acción mejorado
const ActionButtons: FC<{
  onSave: () => void;
  onCancel: () => void;
  size?: 'sm' | 'md';
  className?: string;
}> = memo(({ onSave, onCancel, size = 'md', className = '' }) => {
  const buttonSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className={`flex gap-1 ${className}`}>
      <button
        type="button"
        className={`${buttonSize} flex items-center justify-center bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition-all duration-200`}
        onClick={onSave}
        title="Guardar"
      >
        <FaCheck className={iconSize} />
      </button>
      <button
        type="button"
        className={`${buttonSize} flex items-center justify-center bg-gray-100 text-gray-600 rounded-md shadow-sm hover:bg-gray-200 transition-all duration-200`}
        onClick={onCancel}
        title="Cancelar"
      >
        <FaTimes className={iconSize} />
      </button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

const stripHtml = (html: string): string => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary;
  task: Task;
  view: ViewItinerary;
  optionsItineraryButtonBox?: OptionsSelect[];
  isSelect?: boolean;
  showModalCompartir?: any;
  setShowModalCompartir?: any;
  tempPastedAndDropFiles?: TempPastedAndDropFiles[];
  setTempPastedAndDropFiles?: any;
  isTaskPublic?: boolean;
}

export const TaskNew: FC<Props> = memo(({ 
  itinerario, 
  task, 
  view, 
  optionsItineraryButtonBox, 
  isSelect, 
  showModalCompartir, 
  setShowModalCompartir, 
  tempPastedAndDropFiles, 
  setTempPastedAndDropFiles, 
  ...props 
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const { config, geoInfo, user } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const { t } = useTranslation();
  const storage = getStorage();
  const router = useRouter();
  const toast = useToast();
  
  const link = `${window.location.origin}/services/servicios-${event?._id}-${itinerario?._id}-${task?._id}`;
  
  // Estados básicos
  const [viewComments, setViewComments] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [previousCountComments, setPreviousCountComments] = useState<number>(0);
  const [showModalAdjuntos, setShowModalAdjuntos] = useState({ state: false, id: "" });
  
  // Estados de edición
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [isGlobalEdit, setIsGlobalEdit] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  
  // Estado temporal para valores durante la edición
  const [tempValues, setTempValues] = useState<TaskFormValues>({
    _id: "",
    icon: "",
    fecha: "",
    hora: "",
    duracion: 0,
    tags: [],
    descripcion: "",
    responsable: [],
    tips: "",
    attachments: [],
    spectatorView: true,
    comments: [],
    commentsViewers: [],
    estatus: false,
    estado: 'pending',
    prioridad: 'media'
  });

  // Función para obtener valores iniciales
  const getInitialValues = useCallback((): TaskFormValues => {
    const fecha = task?.fecha ? new Date(task.fecha) : null;
    const locale = geoInfo?.acceptLanguage?.split(",")[0] || 'es-ES';
    
    return {
      _id: task?._id || "",
      icon: task?.icon || "",
      fecha: fecha ? fecha.toLocaleDateString(locale) : "",
      hora: fecha ? fecha.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }) : "",
      duracion: task?.duracion || 0,
      tags: Array.isArray(task?.tags) ? task.tags : [],
      descripcion: task?.descripcion || "",
      responsable: Array.isArray(task?.responsable) ? task.responsable : [],
      tips: task?.tips || "",
      attachments: Array.isArray(task?.attachments) ? task.attachments : [],
      spectatorView: task?.spectatorView ?? true,
      comments: Array.isArray(task?.comments) ? task.comments : [],
      commentsViewers: Array.isArray(task?.commentsViewers) ? task.commentsViewers : [],
      estatus: task?.estatus ?? false,
      estado: task?.estado || 'pending',
      prioridad: task?.prioridad || 'media'
    };
  }, [task, geoInfo]);

  // Actualizar tempValues cuando cambie task
  useEffect(() => {
    if (!isGlobalEdit && editingFields.size === 0) {
      setTempValues(getInitialValues());
    }
  }, [task, isGlobalEdit, editingFields.size, getInitialValues]);

  // Función para manejar edición de campos
  const handleEdit = useCallback((fieldId: string) => {
    if (isGlobalEdit) return;
    
    setEditingFields(new Set([fieldId]));
    
    // Asegurar que los arrays estén inicializados
    const arrayFields = {
      [FIELD_IDS.ATTACHMENTS]: 'attachments',
      [FIELD_IDS.TAGS]: 'tags',
      [FIELD_IDS.RESPONSABLE]: 'responsable'
    };
    
    const arrayField = arrayFields[fieldId];
    if (arrayField && !Array.isArray(tempValues[arrayField])) {
      setTempValues(prev => ({ ...prev, [arrayField]: [] }));
    }
  }, [isGlobalEdit, tempValues]);

  // Función mejorada para guardar cambios
  const handleSave = useCallback(async (fieldId?: string) => {
    try {
      let fieldsToSave: string[] = [];
      let dataToSave: Partial<TaskFormValues> = {};

      if (fieldId) {
        fieldsToSave = [fieldId];
      } else if (isGlobalEdit) {
        fieldsToSave = Array.from(editingFields);
      } else {
        return;
      }

      // Preparar datos según campos
      const fieldMapping = {
        [FIELD_IDS.DESCRIPTION]: { descripcion: tempValues.descripcion },
        [FIELD_IDS.RESPONSABLE]: { responsable: tempValues.responsable },
        [FIELD_IDS.ATTACHMENTS]: { attachments: tempValues.attachments },
        [FIELD_IDS.TAGS]: { tags: tempValues.tags },
        [FIELD_IDS.DATETIME]: {
          fecha: tempValues.fecha,
          hora: tempValues.hora,
          duracion: tempValues.duracion
        },
        [FIELD_IDS.TIPS]: { tips: tempValues.tips },
        [FIELD_IDS.STATUS]: { estado: tempValues.estado },
        [FIELD_IDS.PRIORITY]: { prioridad: tempValues.prioridad }
      };

      fieldsToSave.forEach(field => {
        Object.assign(dataToSave, fieldMapping[field] || {});
      });

      // Realizar actualizaciones API
      const updatePromises = Object.entries(dataToSave).map(([key, value]) => {
        let apiValue: string;
        
        // Transformar valores para API
        if (['responsable', 'tags', 'attachments'].includes(key)) {
          apiValue = JSON.stringify(value || []);
        } else if (key === 'duracion') {
          apiValue = String(value || "0");
        } else if (key === 'fecha' && value) {
          // Manejar fecha correctamente
          const [day, month, year] = (value as string).split('/');
          const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
          apiValue = dateObj.toISOString();
        } else {
          apiValue = String(value || "");
        }

        return fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: key,
            valor: apiValue,
          },
          domain: config.domain,
        });
      });

      await Promise.all(updatePromises);

      // Actualizar estado global
      setEvent((oldEvent) => {
        const newEvent = { ...oldEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
        
        if (itineraryIndex > -1) {
          const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === task._id);
          
          if (taskIndex > -1) {
            Object.assign(newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex], dataToSave);
          }
        }
        
        return newEvent;
      });

      // Limpiar estados de edición
      setEditingFields(new Set());
      setIsGlobalEdit(false);
      
      // Actualizar tempValues con los valores guardados
      setTempValues(prev => ({ ...prev, ...dataToSave }));

      toast("success", t("Item guardado con éxito"));
    } catch (error) {
      console.error('Error al guardar:', error);
      toast("error", t("Ha ocurrido un error"));
    }
  }, [tempValues, editingFields, isGlobalEdit, event, itinerario, task, config.domain, t, toast, setEvent]);

  // Función para cancelar edición
  const handleCancel = useCallback((fieldId?: string) => {
    if (fieldId) {
      const newEditingFields = new Set(editingFields);
      newEditingFields.delete(fieldId);
      setEditingFields(newEditingFields);
    } else {
      setEditingFields(new Set());
      setIsGlobalEdit(false);
    }
    
    // Restaurar valores originales
    setTempValues(getInitialValues());
  }, [editingFields, getInitialValues]);

  // Función para iniciar edición global
  const handleStartGlobalEdit = useCallback(() => {
    setIsGlobalEdit(true);
    setEditingFields(new Set(Object.values(FIELD_IDS)));
  }, []);

  // Función para verificar si un campo está en edición
  const isFieldEditing = useCallback((fieldId: string) => {
    return editingFields.has(fieldId) || isGlobalEdit;
  }, [editingFields, isGlobalEdit]);

  // Obtener información de estado y prioridad actual
  const currentStatus = TASK_STATUSES.find(s => s.value === tempValues.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === tempValues.prioridad) || TASK_PRIORITIES[2];

  // Manejo de comentarios
  useEffect(() => {
    const sortedComments = (task?.comments || [])
      .slice(!viewComments ? -3 : 0)
      .sort((a, b) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    setComments(sortedComments);
  }, [viewComments, task?.comments]);

  useEffect(() => {
    if (comments.length > previousCountComments && divRef.current) {
      divRef.current.scroll({ top: divRef.current.scrollHeight, behavior: 'smooth' });
    }
    setPreviousCountComments(comments.length);
  }, [comments, previousCountComments]);

  // Función legacy para compatibilidad
  const handleBlurData = async (variable: string, valor: any) => {
    try {
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable,
          valor: variable === "responsable" ? JSON.stringify(valor) : valor.toString(),
        },
        domain: config.domain,
      });

      setEvent((old) => {
        const newEvent = { ...old };
        const f1 = newEvent.itinerarios_array.findIndex((elem) => elem._id === itinerario._id);
        if (f1 > -1) {
          const f2 = newEvent.itinerarios_array[f1].tasks.findIndex((elem) => elem._id === task._id);
          if (f2 > -1) {
            newEvent.itinerarios_array[f1].tasks[f2][variable] = valor;
          }
        }
        return newEvent;
      });
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
    }
  };

  const initialValues = getInitialValues();

  return (
    <div {...props}>
      <Formik enableReinitialize initialValues={initialValues} onSubmit={() => {}}>
        {({ values }) => {
          return (
            <Form className="w-full">
              <div className={`flex w-full justify-center items-stretch text-gray-800 ${["/servicios"].includes(window?.location?.pathname) ? "" : "2xl:px-36"} `}>
                {/* Vista Schema */}
                {view === "schema" && values.spectatorView && (
                  <>
                    <div className={`flex w-[55%] md:w-[45%] lg:w-[40%] p-2 items-start justify-start border-t-[1px] border-r-[1px] border-primary border-dotted relative`}>
                      <div className="w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center">
                        <SelectIcon name="icon" className="scale-[120%] -translate-y-1" handleChange={handleBlurData} />
                      </div>
                      <div className="flex-1">
                        <div className="inline-flex flex-col justify-start items-start">
                          <span className="text-xl md:text-2xl text-gray-900">{values?.hora}</span>
                          <div className="w-full flex justify-end items-end text-xs -mt-1">
                            <span>{t("duration")}</span>
                            <span className="text-[12px] md:text-[14px] lg:text-[16px] text-center bg-transparent px-1">
                              {values?.duracion}
                            </span>
                            <span>min</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-flow-dense w-full space-x-2 text-[12px] mt-2">
                          <p>
                            {t("responsible")}: {(values?.responsable || []).join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white w-3 h-3 rounded-full border-[1px] border-primary border-dotted absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className={`flex-1 flex flex-col px-4 md:px-0 border-primary border-dotted w-[10%] md:w-[50%] border-t-[1px]`}>
                      {!!values?.tips && <Interweave
                        className="md:text-xs text-sm text-justify transition-all m-1 p-1 break-words"
                        content={values.tips}
                        matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
                      />}
                    </div>
                  </>
                )}
                
                {/* Vista Cards */}
                {view === "cards" && (
                  <div className={`${isSelect ? "border-gray-300" : "border-gray-100"} border-2 box-content bg-slate-50 w-full rounded-lg mx-1 my-1 flex p-2 relative ${!["/itinerario"].includes(window?.location?.pathname) ? "grid md:grid-cols-2" : "grid grid-cols-1"}`}>
                    {/* Modal compartir */}
                    {showModalCompartir?.state && showModalCompartir.id === values._id && (
                      <ClickAwayListener onClickAway={() => setShowModalCompartir(false)}>
                        <ul className="absolute transition shadow-lg rounded-lg duration-500 bottom-2 right-2 w-[300px] z-50">
                          <li className="flex items-center py-4 px-6 font-display text-sm text-gray-500 bg-base transition w-full capitalize">
                            <CopiarLink link={link} />
                          </li>
                        </ul>
                      </ClickAwayListener>
                    )}
                    
                    {/* Lado izquierdo */}
                    <div className="space-y-3">
                      {/* Header con descripción */}
                      <div id={FIELD_IDS.HEADER} className="flex items-start space-x-2 relative">
                        <div className={`${values?.estatus === true ? "" : "cursor-pointer"} bg-white w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center rounded-full border-[1px] border-gray-300`}>
                          <SelectIcon name="icon" className="" handleChange={handleBlurData} data={values} />
                        </div>
                        
                        {isFieldEditing(FIELD_IDS.DESCRIPTION) ? (
                          <div className="flex-1 relative">
                            <InputField
                              name="descripcion"
                              type="text"
                              value={tempValues.descripcion || ""}
                              onChange={(e) => setTempValues({ ...tempValues, descripcion: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded"
                            />
                            {!isGlobalEdit && (
                              <ActionButtons
                                onSave={() => handleSave(FIELD_IDS.DESCRIPTION)}
                                onCancel={() => handleCancel(FIELD_IDS.DESCRIPTION)}
                                className="absolute -bottom-10 right-0 z-50"
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer flex items-center group flex-1"
                            onClick={() => handleEdit(FIELD_IDS.DESCRIPTION)}
                          >
                            <span className="text-[19px] capitalize cursor-default">
                              {tempValues?.descripcion
                                ? tempValues.descripcion.length > 20
                                  ? `${tempValues.descripcion.slice(0, 20)}...`
                                  : tempValues.descripcion
                                : t("Sin Descripción")}
                            </span>
                            <FaPencilAlt className="text-primary ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        )}

                        {/* Botón de edición global */}
                        <div className="absolute top-0 right-0">
                          {!isGlobalEdit ? (
                            <button
                              type="button"
                              className="p-2 bg-pink-50 text-primary rounded-full shadow-md hover:bg-pink-100 transition-all duration-200"
                              onClick={handleStartGlobalEdit}
                            >
                              <FaPencilAlt className="w-5 h-5" />
                            </button>
                          ) : (
                            <ActionButtons
                              onSave={() => handleSave()}
                              onCancel={() => handleCancel()}
                            />
                          )}
                        </div>
                      </div>

                      {/* Responsables */}
                      <div id={FIELD_IDS.RESPONSABLE} className="flex items-center space-x-5 group relative">
                        <div className="flex items-center space-x-1">
                          <HiOutlineUserCircle />
                          <span className="text-[14px] capitalize cursor-default">
                            {t("assigned")}:
                          </span>
                        </div>
                        {isFieldEditing(FIELD_IDS.RESPONSABLE) ? (
                          <div className="flex-1 relative">
                            <ResponsableSelector
                              name="responsable"
                              value={tempValues.responsable || []}
                              handleChange={(fieldName, newValue) =>
                                setTempValues({ ...tempValues, responsable: Array.isArray(newValue) ? newValue : [] })
                              }
                              disable={false}
                            />
                            {!isGlobalEdit && (
                              <ActionButtons
                                onSave={() => handleSave(FIELD_IDS.RESPONSABLE)}
                                onCancel={() => handleCancel(FIELD_IDS.RESPONSABLE)}
                                className="absolute -bottom-10 right-0 z-50"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-900 flex items-center">
                            {(tempValues?.responsable?.length || 0) > 0 ? (
                              tempValues.responsable.map((elem, idx) => {
                                const userSelect =
                                  GruposResponsablesArry.find(
                                    (el) => el.title.toLowerCase() === elem?.toLowerCase()
                                  ) ??
                                  [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find(
                                    (el) => el?.displayName?.toLowerCase() === elem?.toLowerCase()
                                  );
                                return (
                                  <span key={idx} className="inline-flex items-center space-x-0.5 mr-1.5">
                                    <div className="w-6 h-6 rounded-full border-[1px] border-gray-400">
                                      <ImageAvatar user={userSelect} />
                                    </div>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[12px] text-gray-400 capitalize cursor-default">
                                {t("unassigned")}
                              </span>
                            )}
                            <FaPencilAlt
                              className="text-primary ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                              onClick={() => handleEdit(FIELD_IDS.RESPONSABLE)}
                            />
                          </div>
                        )}
                      </div>

                      {/* Adjuntos */}
                      <div id={FIELD_IDS.ATTACHMENTS} className="flex items-center space-x-5 group relative">
                        <div className="flex items-center space-x-1">
                          <LiaPaperclipSolid />
                          <span className="text-[14px] capitalize cursor-default">
                            {t("addfile")}
                          </span>
                        </div>
                        {isFieldEditing(FIELD_IDS.ATTACHMENTS) ? (
                          <div className="flex-1 relative">
                            <InputAttachments
                              name="attachments"
                              value={tempValues.attachments || []}
                              itinerarioID={itinerario._id}
                              task={task}
                              onChange={(newAttachments) => {
                                setTempValues({ ...tempValues, attachments: Array.isArray(newAttachments) ? newAttachments : [] });
                              }}
                            />
                            {!isGlobalEdit && (
                              <ActionButtons
                                onSave={() => handleSave(FIELD_IDS.ATTACHMENTS)}
                                onCancel={() => handleCancel(FIELD_IDS.ATTACHMENTS)}
                                className="absolute -bottom-10 right-0 z-50"
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            className={`text-[14px] flex items-center space-x-1 ${
                              (tempValues.attachments?.length || 0) > 0 ? "cursor-pointer" : "cursor-default"
                            }`}
                            onClick={() =>
                              (tempValues.attachments?.length || 0) > 0
                                ? setShowModalAdjuntos({ state: !showModalAdjuntos.state, id: values._id })
                                : null
                            }
                          >
                            {(tempValues.attachments?.length || 0) > 0 ? (
                              <>
                                {t("attachment")}
                                <GoChevronDown
                                  className={`w-[14px] h-auto transition-all ${
                                    showModalAdjuntos.state && "rotate-180"
                                  }`}
                                />
                              </>
                            ) : (
                              <span className="text-[12px] text-gray-400 capitalize">{t("noAttachments")}</span>
                            )}
                            <FaPencilAlt
                              className="text-primary ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(FIELD_IDS.ATTACHMENTS);
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Modal de adjuntos */}
                        {showModalAdjuntos.state && showModalAdjuntos.id === values._id && (
                          <ClickAwayListener onClickAway={() => setShowModalAdjuntos({ state: false, id: "" })}>
                            <div className="bg-white p-4 rounded-md shadow-md absolute top-8 left-0 z-50 w-max">
                              <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold capitalize">{t("addfile")}</h2>
                                <button
                                  onClick={() => setShowModalAdjuntos({ state: false, id: "" })}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  &times;
                                </button>
                              </div>
                              <div className="grid md:grid-cols-2 gap-2">
                                {(tempValues?.attachments || []).map((elem, idx) =>
                                  elem._id && (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        downloadFile(storage, `${task._id}//${elem.name}`).catch(() =>
                                          toast("error", t("Ha ocurrido un error"))
                                        );
                                      }}
                                      className="flex justify-between hover:bg-gray-200 rounded-sm px-2 py-1 items-center cursor-pointer text-[12px]"
                                    >
                                      <span className="truncate max-w-[150px]">{elem.name}</span>
                                      <CgSoftwareDownload className="w-4 h-auto ml-2" />
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </ClickAwayListener>
                        )}
                      </div>

                      {/* Etiquetas */}
                      <div id={FIELD_IDS.TAGS} className="flex items-center space-x-5 relative group">
                        <div className="flex items-center space-x-1">
                          <MdOutlineLabel />
                          <span className="text-[14px] capitalize cursor-default">{t("labels")}:</span>
                        </div>
                        {isFieldEditing(FIELD_IDS.TAGS) ? (
                          <div className="flex-1 relative">
                            <InputTags
                              name="tags"
                              value={tempValues.tags || []}
                              onChange={(newTags) => {
                                setTempValues({ ...tempValues, tags: Array.isArray(newTags) ? newTags : [] });
                              }}
                            />
                            {!isGlobalEdit && (
                              <ActionButtons
                                onSave={() => handleSave(FIELD_IDS.TAGS)}
                                onCancel={() => handleCancel(FIELD_IDS.TAGS)}
                                className="absolute -bottom-10 right-0 z-50"
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer flex items-center group"
                            onClick={() => handleEdit(FIELD_IDS.TAGS)}
                          >
                            {Array.isArray(tempValues?.tags) && tempValues.tags.length > 0 ? (
                              <span className="text-[14px]">{tempValues.tags.join(", ")}</span>
                            ) : (
                              <span className="text-[12px] text-gray-400 capitalize">{t("noLabels")}</span>
                            )}
                            <FaPencilAlt className="text-primary ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        )}
                      </div>

                      {/* Fecha, Duración y Hora */}
                      <div id={FIELD_IDS.DATETIME} className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <IoCalendarClearOutline />
                          <span className="text-[14px] capitalize cursor-default">{t("Fecha")}:</span>
                        </div>
                        {isFieldEditing(FIELD_IDS.DATETIME) ? (
                          <div className="flex-1">
                            <div className="flex space-x-2">
                              <InputField
                                name="fecha"
                                type="date"
                                value={tempValues.fecha || ""}
                                onChange={(e) => setTempValues({ ...tempValues, fecha: e.target.value })}
                                className="flex-1 p-1 border border-gray-300 rounded text-sm"
                              />
                              <InputField
                                name="hora"
                                type="time"
                                value={tempValues.hora || ""}
                                onChange={(e) => setTempValues({ ...tempValues, hora: e.target.value })}
                                className="w-20 p-1 border border-gray-300 rounded text-sm"
                              />
                              <InputField
                                name="duracion"
                                type="number"
                                value={String(tempValues.duracion || "")}
                                onChange={(e) => setTempValues({ ...tempValues, duracion: parseInt(e.target.value) || 0 })}
                                className="w-16 p-1 border border-gray-300 rounded text-sm"
                                placeholder="min"
                              />
                            </div>
                            {!isGlobalEdit && (
                              <ActionButtons
                                onSave={() => handleSave(FIELD_IDS.DATETIME)}
                                onCancel={() => handleCancel(FIELD_IDS.DATETIME)}
                                className="mt-2"
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer flex items-center space-x-2 group"
                            onClick={() => handleEdit(FIELD_IDS.DATETIME)}
                          >
                            <span className="text-[14px] capitalize">
                              {tempValues?.fecha && tempValues?.hora && tempValues?.duracion
                                ? `${tempValues.fecha} ${tempValues.hora} (${tempValues.duracion} min)`
                                : <span className="text-[12px] text-gray-400">{t("Sin Informacion")}</span>}
                            </span>
                            <FaPencilAlt className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        )}
                      </div>

                      {/* Block de Texto (Tips) */}
                      <div id={FIELD_IDS.TIPS} className={`${["/itinerario"].includes(window?.location?.pathname) ? "h-[100px]" : "md:h-[183px] h-[100px]"} border-[1px] border-gray-300 rounded-lg p-2 overflow-auto group relative`}>
                        {isFieldEditing(FIELD_IDS.TIPS) ? (
                          <div className="h-full">
                            <MyEditor
                              name="tips"
                              value={tempValues.tips || ""}
                              onChange={(newTips) => {
                                setTempValues({ ...tempValues, tips: String(newTips || "") });
                              }}
                            />
                            {!isGlobalEdit && (
                              <ActionButtons
                                onSave={() => handleSave(FIELD_IDS.TIPS)}
                                onCancel={() => handleCancel(FIELD_IDS.TIPS)}
                                className="absolute top-2 right-2 z-50"
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer h-full flex flex-col"
                            onClick={() => handleEdit(FIELD_IDS.TIPS)}
                          >
                            <div
                              className="text-xs text-gray-500 break-words overflow-hidden flex-1"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 5,
                                WebkitBoxOrient: "vertical",
                                lineHeight: "1.5rem",
                                maxHeight: "7.5rem",
                              }}
                            >
                              {tempValues?.tips
                                ? stripHtml(tempValues.tips)
                                : <span className="text-[12px] text-gray-400">{t("Sin Descripcion")}</span>}
                            </div>
                            <div className="flex justify-end items-center">
                              <FaPencilAlt className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lado derecho */}
                    <div className="flex-1 flex flex-col text-[12px] pl-1 md:pl-2 mt-1 md:mt-0">
                      {/* Estado y Prioridad */}
                      <div className="flex space-x-2 mb-4">
                        {/* Dropdown de Estado */}
                        <div className="relative">
                          {isFieldEditing(FIELD_IDS.STATUS) ? (
                            <div className="flex items-center space-x-1">
                              <select
                                value={tempValues.estado}
                                onChange={(e) => setTempValues({ ...tempValues, estado: e.target.value })}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                {TASK_STATUSES.map(status => (
                                  <option key={status.value} value={status.value}>
                                    {status.label}
                                  </option>
                                ))}
                              </select>
                              {!isGlobalEdit && (
                                <ActionButtons
                                  onSave={() => handleSave(FIELD_IDS.STATUS)}
                                  onCancel={() => handleCancel(FIELD_IDS.STATUS)}
                                  size="sm"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <button
                                className={`px-4 py-1 text-white text-sm rounded ${currentStatus.color} flex items-center space-x-1`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isGlobalEdit) {
                                    setShowStatusDropdown(!showStatusDropdown);
                                  }
                                }}
                              >
                                <span>{currentStatus.label}</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {showStatusDropdown && (
                                <ClickAwayListener onClickAway={() => setShowStatusDropdown(false)}>
                                  <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                                    {TASK_STATUSES.map((status) => (
                                      <li
                                        key={status.value}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                                        onClick={() => {
                                          setTempValues({ ...tempValues, estado: status.value });
                                          handleEdit(FIELD_IDS.STATUS);
                                          setShowStatusDropdown(false);
                                        }}
                                      >
                                        <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                                        <span>{status.label}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </ClickAwayListener>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Dropdown de Prioridad */}
                        <div className="relative">
                          {isFieldEditing(FIELD_IDS.PRIORITY) ? (
                            <div className="flex items-center space-x-1">
                              <select
                                value={tempValues.prioridad}
                                onChange={(e) => setTempValues({ ...tempValues, prioridad: e.target.value })}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                {TASK_PRIORITIES.map(priority => (
                                  <option key={priority.value} value={priority.value}>
                                    {priority.label}
                                  </option>
                                ))}
                              </select>
                              {!isGlobalEdit && (
                                <ActionButtons
                                  onSave={() => handleSave(FIELD_IDS.PRIORITY)}
                                  onCancel={() => handleCancel(FIELD_IDS.PRIORITY)}
                                  size="sm"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <button
                                className={`px-3 py-1 text-white text-sm rounded flex items-center space-x-1 ${currentPriority.color}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isGlobalEdit) {
                                    setShowPriorityDropdown(!showPriorityDropdown);
                                  }
                                }}
                              >
                                <Flag className="w-3 h-3" />
                                <span>{currentPriority.label}</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {showPriorityDropdown && (
                                <ClickAwayListener onClickAway={() => setShowPriorityDropdown(false)}>
                                  <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                                    {TASK_PRIORITIES.map((priority) => (
                                      <li
                                        key={priority.value}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                                        onClick={() => {
                                          setTempValues({ ...tempValues, prioridad: priority.value });
                                          handleEdit(FIELD_IDS.PRIORITY);
                                          setShowPriorityDropdown(false);
                                        }}
                                      >
                                        <Flag className={`w-4 h-4 ${priority.color.replace('bg-', 'text-')}`} />
                                        <span>{priority.label}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </ClickAwayListener>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comentarios */}
                      {!["/itinerario"].includes(window?.location?.pathname) && (
                        <div className="mb-2 w-full">
                          <div className="flex justify-between mb-1">
                            <div className="capitalize">
                              {t('messages')}
                            </div>
                            <div>
                              <RiNotification2Fill className="text-gray-500 w-4 h-4 scale-x-90" />
                            </div>
                          </div>
                          <div className='border-gray-300 border-[1px] rounded-lg py-2'>
                            <div ref={divRef} className='h-[260px] flex flex-col-reverse rounded-lg overflow-auto break-words'>
                              {comments.map((elem, idx) => (
                                <ListComments 
                                  id={elem?._id} 
                                  key={idx} 
                                  itinerario={itinerario} 
                                  task={task} 
                                  item={elem} 
                                  tempPastedAndDropFiles={tempPastedAndDropFiles} 
                                />
                              ))}
                            </div>
                            <InputComments 
                              itinerario={itinerario} 
                              task={task} 
                              tempPastedAndDropFiles={tempPastedAndDropFiles} 
                              setTempPastedAndDropFiles={setTempPastedAndDropFiles} 
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className={`${["/itinerario"].includes(window?.location?.pathname) && "pt-3"} flex justify-between`}>
                        <ItineraryButtonBox 
                          optionsItineraryButtonBox={optionsItineraryButtonBox} 
                          values={task} 
                          itinerario={itinerario} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
});

TaskNew.displayName = 'TaskNew';