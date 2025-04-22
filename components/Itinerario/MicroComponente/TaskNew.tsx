import { Form, Formik } from "formik";
import { FC, HTMLAttributes, useEffect, useRef, useState } from "react";
import { SelectIcon, GruposResponsablesArry, ResponsableSelector } from ".";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useTranslation } from 'react-i18next';
import { ItineraryButtonBox } from './ItineraryButtonBox'
import { Comment, Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";
import { CgSoftwareDownload } from "react-icons/cg";
import { getBytes, getMetadata, getStorage, ref } from "firebase/storage";
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
import { EditableLabelWithInput } from "../../Forms/EditableLabelWithInput";
import InputAttachments from "../../Forms/InputAttachments";
import { InputTags } from "../../Forms/InputTags";
import { MyEditor } from "./QuillText";
import { FaPencilAlt, FaCheck, FaTimes } from "react-icons/fa";
import { useMemo } from "react";

const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

interface TaskDateTimeAsString {
  duracion?: string | number; // Permitir tanto string como number
  tips?: string;
  fecha?: string;
  hora?: string;
  responsable?: string[];
  tags?: string[];
  attachments?: any[];
  [key: string]: any; // Permitir propiedades adicionales
}

interface props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary;
  task: Task;
  view: ViewItinerary;
  optionsItineraryButtonBox?: OptionsSelect[];
  isSelect?: boolean;
  showModalCompartir?: any;
  setShowModalCompartir?: any;
  tempPastedAndDropFiles?: TempPastedAndDropFiles[];
  setTempPastedAndDropFiles?: any;
  isTaskPublic?: boolean; // Agregada esta propiedad
}

export const TaskNew: FC<props> = ({ itinerario, task, view, optionsItineraryButtonBox, isSelect, showModalCompartir, setShowModalCompartir, tempPastedAndDropFiles, setTempPastedAndDropFiles, ...props }) => {
  const divRef = useRef(null);
  const { config, geoInfo, user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const { t } = useTranslation();
  const storage = getStorage();
  const link = `${window.location.origin}/services/servicios-${event?._id}-${itinerario?._id}-${task?._id}`
  const [viewComments, setViewComments] = useState(true)
  const [comments, setComments] = useState<Comment[]>()
  const [previousCountComments, setPreviousCountComments] = useState<number>()
  const router = useRouter()
  const [showModalAdjuntos, setShowModalAdjuntos] = useState({ state: false, id: "" })
  const [showTagsModal, setShowTagsModal] = useState(false)
  const toast = useToast()
  
  const [editingField, setEditingField] = useState<string | null>(null); // Campo en edición
  const [tempValue, setTempValue] = useState<string | null>(null); // Valor temporal
  const [previousValue, setPreviousValue] = useState<string | null>(null); // Valor anterior
  const [showAlert, setShowAlert] = useState(false); // Mostrar alerta
  const [isGlobalEdit, setIsGlobalEdit] = useState(false); // Modo de edición global
  const [tempValues, setTempValues] = useState<TaskDateTimeAsString>({}); // Valores temporales para edición global

  // Opciones del dropdown con colores característicos
  const statusOptions = [
    { label: t("To Do"), value: "to_do", color: "bg-gray-400" },
    { label: t("In Progress"), value: "in_progress", color: "bg-blue-400" },
    { label: t("Completed"), value: "completed", color: "bg-green" },
    { label: t("Review"), value: "review", color: "bg-yellow-400" },
    { label: t("Blocked"), value: "blocked", color: "bg-red" },
    { label: t("Waiting"), value: "waiting", color: "bg-purple-400" },
    { label: t("Prioritized"), value: "prioritized", color: "bg-orange-400" },
  ];

  // Estado para manejar el estado seleccionado
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
  const [showDropdownLeft, setShowDropdownLeft] = useState(false);
  const [showDropdownRight, setShowDropdownRight] = useState(false);

  // Función para manejar la selección de un estado
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  const handleEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setTempValues((prev) => ({ ...prev, [field]: currentValue }));
  };

  const handleSave = async (field?: string) => {
    try {
      let dataSend;
  
      if (field) {
        let valueToSave = tempValues[field];
  
        // Procesar datos según el campo
        if (field === "responsable") {
          valueToSave = Array.isArray(valueToSave) ? valueToSave : [];
        } else if (field === "attachments") {
          valueToSave = Array.isArray(valueToSave) ? valueToSave : [];
        } else if (field === "tags") {
          valueToSave = Array.isArray(valueToSave) ? valueToSave : [];
        } else if (field === "fecha" || field === "hora") {
          const fecha = tempValues.fecha || "";
          const hora = tempValues.hora || "";
          valueToSave = new Date(`${fecha} ${hora}`).toISOString(); // Combinar fecha y hora
        } else if (field === "duracion") {
          valueToSave = tempValues.duracion?.toString() || "0"; // Convertir a string
        } else if (field === "tips") {
          valueToSave = tempValues.tips || ""; // Asegurar que sea texto
        }
  
        // Guardar el campo específico
        dataSend = { [field]: valueToSave };
      } else {
        // Guardar todos los campos en modo global
        dataSend = { ...tempValues };
      }
  
      // Enviar datos al backend
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable: field || "all",
          valor: JSON.stringify(dataSend),
        },
        domain: config.domain,
      });
  
      // Actualizar el estado global
      setEvent((old) => {
        const f1 = old.itinerarios_array.findIndex((elem) => elem._id === itinerario._id);
        if (f1 > -1) {
          const f2 = old.itinerarios_array[f1].tasks.findIndex((elem) => elem._id === task._id);
          old.itinerarios_array[f1].tasks[f2] = { ...old.itinerarios_array[f1].tasks[f2], ...dataSend };
        }
        return { ...old };
      });
  
      // Actualizar `tempValues` con los valores guardados
      setTempValues((prev) => ({ ...prev, ...dataSend }));
  
      // Salir del modo de edición después de actualizar el estado
      setTimeout(() => {
        setEditingField(null);
        setIsGlobalEdit(false);
      }, 100); // Asegurarse de que el estado se actualice antes de salir del modo de edición
  
      // Mostrar mensaje de éxito
      toast("success", t("Item guardado con éxito"));
    } catch (error) {
      // Mostrar mensaje de error
      toast("error", `${t("Ha ocurrido un error")} ${error}`);
      console.error(error);
    }
  };

  const handleCancel = (field?: string, formValues?: any) => {
    if (field) {
      // Restaurar un campo específico
      setTempValues((prev) => ({ ...prev, [field]: formValues[field] }));
    } else {
      // Restaurar todos los valores al estado inicial
      setTempValues(initialValues);
    }
  
    // Salir del modo de edición
    setEditingField(null);
    setTempValue(null);
    setPreviousValue(null);
    setShowAlert(false);
    setIsGlobalEdit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowAlert(true); // Muestra la alerta antes de guardar
    } else if (e.key === "Escape") {
      handleCancel(); // Cancela la edición
    }
  };

// Memorizar los valores iniciales para evitar recrearlos en cada renderizado
const initialValues = useMemo(() => ({
  _id: task?._id,
  icon: task?.icon || "",
  fecha: task?.fecha
    ? new Date(task.fecha).toLocaleDateString(geoInfo?.acceptLanguage?.split(",")[0])
    : "",
  hora: task?.fecha
    ? new Date(task.fecha).toLocaleTimeString(geoInfo?.acceptLanguage?.split(",")[0], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
  duracion: task?.duracion || "",
  tags: task?.tags || [],
  descripcion: task?.descripcion || "",
  responsable: Array.isArray(task?.responsable) ? task.responsable : [],
  tips: task?.tips || "",
  attachments: task?.attachments || [],
  spectatorView: task?.spectatorView,
  comments: task?.comments,
  commentsViewers: task?.commentsViewers,
  estatus: task?.estatus,
}), [task, geoInfo]);
  // Inicializar `tempValues` con los valores iniciales
  useEffect(() => {
    setTempValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const comments = task?.comments?.slice(!viewComments ? -3 : 0).sort((a, b) => new Date(b?.createdAt)?.getTime() - new Date(a?.createdAt)?.getTime())
    setComments(comments)
  }, [viewComments, task?.comments, event])

  useEffect(() => {
    // Realiza scroll al final del div cuando el componente se monta 
    if (comments?.length > previousCountComments) {
      if (divRef.current) {
        divRef.current.scroll({ top: divRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
    setPreviousCountComments(comments?.length ?? 0)
  }, [comments]);

  const handleBlurData = async (variable, valor) => {
    try {
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable,
          valor: variable === "responsable" ? JSON.stringify(valor) : valor.toString(), // Convertir a string si es necesario
        },
        domain: config.domain,
      });
  
      // Actualizar el estado global
      setEvent((old) => {
        const f1 = old.itinerarios_array.findIndex((elem) => elem._id === itinerario._id);
        if (f1 > -1) {
          const f2 = old.itinerarios_array[f1].tasks.findIndex((elem) => elem._id === task._id);
          old.itinerarios_array[f1].tasks[f2][`${variable}`] = valor;
        }
        return { ...old };
      });
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
    }
  };

  return (
    <div {...props}>
      <Formik enableReinitialize initialValues={initialValues} onSubmit={() => { }}  >
        {({ values }) => {
          return (
            <Form className="w-full">
              <div className={`flex w-full justify-center items-stretch text-gray-800 ${["/servicios"].includes(window?.location?.pathname) ? "" : "2xl:px-36"} `} {...props} >
                {view === "schema" && values.spectatorView &&
                  <>
                    <div className={`flex w-[55%] md:w-[45%] lg:w-[40%] p-2 items-start justify-start border-t-[1px] border-r-[1px] border-primary border-dotted relative`}>
                      <div className=" w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center ">
                        <SelectIcon name="icon" className=" scale-[120%] -translate-y-1 " handleChange={handleBlurData} />
                      </div>
                      <div className="flex-1">
                        <div className=" inline-flex flex-col justify-start items-start">
                          <span className="text-xl md:text-2xl text-gray-900">{values?.hora}</span>
                          <div className=" w-full flex justify-end items-end text-xs -mt-1">
                            <span> {t("duration")}</span>
                            <span className="text-[12px] md:text-[14px] lg:text-[16px] text-center bg-transparent px-1" >
                              {values?.duracion}
                            </span>
                            <span>min</span>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2 font-title text-primary text-2xl relative group">
                          <div className="min-w-2 h-2 bg-primary rounded-full translate-y-2.5" />
                          {editingField === "descripcion" ? (
                            <div className="w-full relative flex items-center">
                              <InputField
                                name="descripcion"
                                type="text"
                                value={tempValues.descripcion || ""}
                                onChange={(e) => setTempValues({ ...tempValues, descripcion: e.target.value })}
                              />
                              <div className="flex space-x-2 ml-2">
                                <FaCheck
                                  className="text-green-500 cursor-pointer"
                                  onClick={() => handleSave("descripcion")} // Guardar cambios
                                />
                                <FaTimes
                                  className="text-red-500 cursor-pointer"
                                  onClick={() => handleCancel("descripcion", values)} // Cancelar edición
                                />
                              </div>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer flex items-center group"
                              onClick={() => handleEdit("descripcion", tempValues.descripcion || "")}
                            >
                              <strong className="leading-[1] mt-1">{tempValues?.descripcion || t("noDescription")}</strong>
                              <FaPencilAlt className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          )}
                          {/* Botón global de editar */}
                          {!isGlobalEdit && (
                            <button
                              type="button"
                              className="absolute right-0 top-0 p-2 bg-blue-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={() => handleEdit("descripcion", tempValues.descripcion || "")} // Activar edición
                            >
                              <FaPencilAlt />
                            </button>
                          )}
                        </div>
                        <div className=" grid grid-flow-dense w-full space-x-2 text-[12px] mt-2">
                          <p >
                            {t("responsible")}: {values?.responsable.join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white w-3 h-3 rounded-full border-[1px] border-primary border-dotted absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className={` flex-1 flex flex-col px-4 md:px-0  border-primary border-dotted w-[10%] md:w-[50%] border-t-[1px] `}>
                      {!!values?.tips && <Interweave
                        className="md:text-xs text-sm text-justify transition-all m-1 p-1 break-words"
                        content={values.tips}
                        matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
                      />}
                    </div>
                  </>}
                {view === "cards" &&
                  <div className={`${isSelect ? "border-gray-300" : "border-gray-100"} border-2 box-content bg-slate-50 w-full rounded-lg mx-1 my-1 flex p-2 relative  ${!["/itinerario"].includes(window?.location?.pathname) ? "grid md:grid-cols-2" : "grid grid-cols-1"} `}>
                    {
                      showModalCompartir?.state && showModalCompartir.id === values._id && <ClickAwayListener onClickAway={() => setShowModalCompartir(false)}>
                        <ul className={` absolute transition shadow-lg rounded-lg duration-500 bottom-2 right-2 w-[300px] z-50 `}>
                          <li className="flex items-center py-4 px-6 font-display text-sm text-gray-500 bg-base transition w-full capitalize">
                            <CopiarLink link={link} />
                          </li>
                        </ul>
                      </ClickAwayListener>
                    }
                    {/* lado izquierdo de la tarjeta */}
                    <div className="space-y-2">
                {/* encabezado de la tarjeta */}
                <div className="flex items-center space-x-2 relative">
                <div className={`${values?.estatus === true ? "" : "cursor-pointer"} bg-white w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center rounded-full border-[1px] border-gray-300`}>
                  <SelectIcon name="icon" className="" handleChange={handleBlurData} data={values} />
                </div>
                {editingField === "descripcion" || isGlobalEdit ? (
                  <div className="w-full relative flex items-center">
                    <InputField
                      name="descripcion"
                      type="text"
                      value={tempValues.descripcion || ""}
                      onChange={(e) => setTempValues({ ...tempValues, descripcion: e.target.value })}
                    />
                    {!isGlobalEdit && (
                      <div className="flex space-x-2 ml-2">
                        <FaCheck
                          className="text-green-500 cursor-pointer"
                          onClick={() => handleSave("descripcion")} // Guardar cambios
                        />
                        <FaTimes
                         className="text-red-500 cursor-pointer"
                         onClick={() => handleCancel("descripcion", values)} // Cancelar edición
                        />
        </div>
      )}
    </div>
  ) : (
    <div
      className="cursor-pointer flex items-center group"
      onClick={() => handleEdit("descripcion", tempValues.descripcion || "")}
    >
      <span className="text-[19px] capitalize cursor-default">{tempValues?.descripcion || t("noDescription")}</span>
      <FaPencilAlt className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  )}
{/* Botón general de edición o botones de guardar/cancelar */}
<div className="absolute top-[15px] right-0 z-50 flex items-center">
  {!isGlobalEdit ? (
    <button
      type="button"
      className="p-2 text-gray-500 rounded"
      onClick={() => setIsGlobalEdit(true)} // Activar modo de edición global
    >
      <FaPencilAlt /> {/* Ícono de lápiz */}
    </button>
  ) : (
    <div className="flex space-x-4">
      <button
        type="button"
        className="px-4 py-2 bg-green text-white rounded"
        onClick={() => handleSave(null)} // Guardar todos los cambios realizados en modo global
      >
        <FaCheck />
      </button>
      <button
        type="button"
        className="px-4 py-2 bg-red text-white rounded"
        onClick={() => handleCancel(null, values)} // Cancelar todos los cambios realizados en modo global
      >
        <FaTimes />
      </button>
    </div>
  )}
</div>
</div>

{/* Responsables */}
<div className="flex items-center space-x-5 group relative">
  <div className="flex items-center space-x-1">
    <HiOutlineUserCircle />
    <span className="text-[14px] capitalize cursor-default group-hover:underline">
      {t("assigned")}:
    </span>
    <FaPencilAlt
      className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
      onClick={() => handleEdit("responsable", tempValues.responsable || [])}
    />
  </div>
  {editingField === "responsable" ? (
    <div className="w-full relative flex items-center">
      <ResponsableSelector
        name="responsable"
        handleChange={(newResponsables) =>
          setTempValues({ ...tempValues, responsable: newResponsables })
        }
        disable={false}
      />
      <div className="flex space-x-2 ml-2">
        <FaCheck
          className="text-green-500 cursor-pointer"
          onClick={() => handleSave("responsable")}
        />
        <FaTimes
          className="text-red-500 cursor-pointer"
          onClick={() => handleCancel("responsable", values)}
        />
      </div>
    </div>
  ) : (
    <div className="text-gray-900 flex">
      {values?.responsable?.length > 0 ? (
        values.responsable.map((elem, idx) => {
          const userSelect =
            GruposResponsablesArry.find(
              (el) => el.title.toLowerCase() === elem?.toLowerCase()
            ) ??
            [user, event?.detalles_usuario_id, ...event.detalles_compartidos_array].find(
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
    </div>
  )}
</div>

{/* Adjuntos */}
<div className="flex items-center space-x-5 group relative">
  <div className="flex items-center space-x-1">
    <LiaPaperclipSolid />
    <span className="text-[14px] capitalize cursor-default group-hover:underline">
      {t("addfile")}
    </span>
    <FaPencilAlt
      className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
      onClick={() => handleEdit("attachments", tempValues.attachments || [])}
    />
  </div>
  {editingField === "attachments" ? (
    <div className="w-full relative flex items-center">
<InputAttachments
  name="attachments"
  label={t("archivos adjuntos")}
  itinerarioID={itinerario._id}
  task={task}
  onChange={(newAttachments) => {
    // Verificar si newAttachments es un arreglo
    if (Array.isArray(newAttachments)) {
      setTempValues({ ...tempValues, attachments: newAttachments });
    } else {
      console.error("El valor de newAttachments no es un arreglo:", newAttachments);
    }
  }}
/>
      <div className="flex space-x-2 ml-2">
        <FaCheck
          className="text-green-500 cursor-pointer"
          onClick={() => handleSave("attachments")}
        />
        <FaTimes
          className="text-red-500 cursor-pointer"
          onClick={() => handleCancel("attachments", values)}
        />
      </div>
    </div>
  ) : (
    <div
      className={`text-[14px] flex items-center space-x-1 ${
        values.attachments.length > 0 ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={() =>
        values.attachments.length > 0
          ? setShowModalAdjuntos({ state: !showModalAdjuntos.state, id: values._id })
          : setShowModalAdjuntos({ state: false, id: "" })
      }
    >
      {values.attachments.length > 0 ? t("attachment") : <span className="text-[12px] text-gray-400 capitalize">{t("noAttachments")}</span>}
      <GoChevronDown
        className={`w-[14px] h-auto transition-all ${
          values.attachments.length === 0 && "hidden"
        } ${showModalAdjuntos.state && "rotate-180"}`}
      />
    </div>
  )}
  {showModalAdjuntos.state && (
    <ClickAwayListener onClickAway={() => setShowModalAdjuntos({ state: false, id: "" })}>
      <div className="bg-white p-4 rounded-md shadow-md absolute top-5 left-24 z-50 w-max">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold capitalize">{t("addfile")}</h2>
          <button
            onClick={() => setShowModalAdjuntos({ state: false, id: "" })}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-2 truncate">
          {values?.attachments?.map((elem, idx) =>
            !!elem._id && (
              <div
                key={idx}
                onClick={() => {
                  downloadFile(storage, `${task._id}//${elem.name}`).catch(() =>
                    toast("error", `${t("Ha ocurrido un error")}`)
                  );
                }}
                className="flex justify-between hover:bg-gray-200 rounded-sm px-1 items-center border-gray-500 cursor-pointer text-[12px] truncate"
              >
                <span className="w-[150px] truncate">{elem.name}</span>
                <CgSoftwareDownload className="w-4 h-auto" />
              </div>
            )
          )}
        </div>
      </div>
    </ClickAwayListener>
  )}
</div>

                      {/* Etiquetas */}
                      <div className="flex items-center space-x-5 relative group">
  <div className="flex items-center space-x-1">
    <MdOutlineLabel />
    <span className="text-[14px] capitalize cursor-default">{t("labels")}:</span>
  </div>
  {editingField === "tags" || isGlobalEdit ? (
    <div className="w-full relative flex items-center">
<InputTags
  name="tags"
  value={Array.isArray(tempValues.tags) ? tempValues.tags : []}
  onChange={(newTags) => {
    // Verificar si newTags es un arreglo
    if (Array.isArray(newTags)) {
      setTempValues({ ...tempValues, tags: newTags });
    } else {
      console.error("El valor de newTags no es un arreglo:", newTags);
    }
  }}
/>
      {!isGlobalEdit && (
        <div className="flex space-x-2 ml-2">
          <FaCheck
            className="text-green-500 cursor-pointer"
            onClick={() => handleSave("tags")} // Guardar cambios
          />
          <FaTimes
            className="text-red-500 cursor-pointer"
            onClick={() => handleCancel("tags", values)} // Cancelar edición
          />
        </div>
      )}
    </div>
  ) : (
    <div
      className="cursor-pointer flex items-center group"
      onClick={() => handleEdit("tags", tempValues.tags || [])}
    >
      {Array.isArray(tempValues?.tags) && tempValues.tags.length > 0
        ? tempValues.tags.join(", ")
        : t("noLabels")}
      <FaPencilAlt className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  )}
</div>

                      {/* Fecha */}
                      <div className="space-x-5 flex items-center group">
  <div className="flex items-center space-x-1">
    <IoCalendarClearOutline className="pb-0.5" />
    <span className="text-[14px] capitalize cursor-default">{t("date")}:</span>
  </div>
  {editingField === "fecha" || isGlobalEdit ? (
    <div className="w-full relative flex items-center">
<InputField
  name="fecha"
  type="date"
  value={tempValues.fecha || ""}
  onChange={(e) => setTempValues({ ...tempValues, fecha: e.target.value })}
/>
      {!isGlobalEdit && (
        <div className="flex space-x-2 ml-2">
          <FaCheck
            className="text-green-500 cursor-pointer"
            onClick={() => handleSave("fecha")} // Guardar cambios
          />
          <FaTimes
            className="text-red-500 cursor-pointer"
            onClick={() => handleCancel("fecha", values)} // Cancelar edición
          />
        </div>
      )}
    </div>
  ) : (
    <div
      className="cursor-pointer flex items-center group"
      onClick={() => handleEdit("fecha", tempValues.fecha || "")}
    >
      {tempValues?.fecha || t("undated")}
      <FaPencilAlt className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  )}
</div>

                      {/* Hora */}
                      <div className="space-x-5 flex items-center group">
  <div className="flex items-center space-x-1">
    <LuClock className="pb-0.5" />
    <span className="text-[14px] capitalize cursor-default">{t("hour")}:</span>
  </div>
  {editingField === "hora" || isGlobalEdit ? (
    <div className="w-full relative flex items-center">
<InputField
  name="hora"
  type="time"
  value={tempValues.hora || ""}
  onChange={(e) => setTempValues({ ...tempValues, hora: e.target.value })}
/>
      {!isGlobalEdit && (
        <div className="flex space-x-2 ml-2">
          <FaCheck
            className="text-green-500 cursor-pointer"
            onClick={() => handleSave("hora")} // Guardar cambios
          />
          <FaTimes
            className="text-red-500 cursor-pointer"
            onClick={() => handleCancel("hora", values)} // Cancelar edición
          />
        </div>
      )}
    </div>
  ) : (
    <div
      className="cursor-pointer flex items-center group"
      onClick={() => handleEdit("hora", tempValues.hora || "")}
    >
      {tempValues?.hora || t("noHour")}
      <FaPencilAlt className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  )}
</div>

                      {/* Duración */}
                      <div className="space-x-5 flex items-center group">
  <div className="flex items-center space-x-1">
    <LuClock className="pb-0.5" />
    <span className="text-[14px] capitalize cursor-default">{t("duration")}:</span>
  </div>
  {editingField === "duracion" || isGlobalEdit ? (
    <div className="w-full relative flex items-center">
<InputField
  name="duracion"
  type="number"
  value={tempValues.duracion?.toString() || ""}
  onChange={(e) => setTempValues({ ...tempValues, duracion: e.target.value })}
/>
      {!isGlobalEdit && (
        <div className="flex space-x-2 ml-2">
          <FaCheck
            className="text-green-500 cursor-pointer"
            onClick={() => handleSave("duracion")} // Guardar cambios
          />
          <FaTimes
            className="text-red-500 cursor-pointer"
            onClick={() => handleCancel("duracion", values)} // Cancelar edición
          />
        </div>
      )}
    </div>
  ) : (
    <div
      className="cursor-pointer flex items-center group"
      onClick={() => handleEdit("duracion", tempValues.duracion || 0)}
    >
      {tempValues?.duracion ? `${tempValues.duracion} min` : t("noDuration")}
      <FaPencilAlt className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  )}
</div>

{/* Block de Texto */}
<div className={`${["/itinerario"].includes(window?.location?.pathname) ? "h-[100px]" : "md:h-[183px] h-[100px]"} border-[1px] border-gray-300 rounded-lg pt-2 pb-3 px-2 overflow-auto md:w-full group`}>
  {editingField === "tips" || isGlobalEdit ? (
    <div className="w-full relative flex items-center">
      <div className="flex-1">
      <MyEditor
  name="tips"
  value={tempValues.tips || ""}
  onChange={(newTips) => {
    // Verificar si newTips es un string
    if (typeof newTips === "string") {
      setTempValues({ ...tempValues, tips: newTips });
    } else {
      console.error("El valor de newTips no es un string:", newTips);
    }
  }}
/>
      </div>
      {!isGlobalEdit && (
        <div className="flex space-x-2 ml-2">
          <FaCheck
            className="text-green-500 cursor-pointer"
            onClick={() => handleSave("tips")} // Guardar cambios
          />
          <FaTimes
            className="text-red-500 cursor-pointer"
            onClick={() => handleCancel("tips", values)} // Cancelar edición
          />
        </div>
      )}
    </div>
  ) : (
    <div
      className="cursor-pointer flex items-center group"
      onClick={() => handleEdit("tips", tempValues.tips || "")}
    >
      <span className="text-sm text-gray-800 break-words">
        {stripHtml(tempValues?.tips || t("noDescription"))}
      </span>
      <FaPencilAlt className="text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  )}
</div>
                    </div>

                    {/* lado derecho de la tarjeta */}
                    <div className="flex-1 flex flex-col text-[12px] pl-1 md:pl-2 mt-1 md:mt-0 w-full">
                      {/* Dropdown para el lado derecho de la tarjeta */}
                      <div className="absolute top-[2px] right-8">
                        <div className="relative">
                          <button
                            className={`px-4 py-1 text-white rounded ${selectedStatus.color}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdownRight(!showDropdownRight);
                            }}
                          >
                            {selectedStatus.label}
                          </button>
                          {showDropdownRight && (
                            <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                              {statusOptions.map((option) => (
                                <li
                                  key={option.value}
                                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2`}
                                  onClick={() => {
                                    handleStatusChange(option);
                                    setShowDropdownRight(false);
                                  }}
                                >
                                  <span className={`w-3 h-3 rounded-full ${option.color}`}></span>
                                  <span>{option.label}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      {!["/itinerario"].includes(window?.location?.pathname) && <div className="mb-2 w-full">
                        <div className="flex justify-between mb-1">
                          <div className="capitalize">
                            {t('messages')}
                          </div>
                          <div>
                            <RiNotification2Fill className="text-gray-500 w-4 h-4 scale-x-90" />
                          </div>
                        </div>
                        <div className='border-gray-300 border-[1px] rounded-lg py-2 w-full'>
                          <div ref={divRef} className='w-full h-[260px] flex flex-col-reverse rounded-lg overflow-auto break-words'>
                            {comments?.map((elem, idx) => {
                              return (
                                <ListComments id={elem?._id} key={idx} itinerario={itinerario} task={task} item={elem} tempPastedAndDropFiles={tempPastedAndDropFiles} />
                              )
                            })}
                          </div>
                          < InputComments itinerario={itinerario} task={task} tempPastedAndDropFiles={tempPastedAndDropFiles} setTempPastedAndDropFiles={setTempPastedAndDropFiles} />
                        </div>
                      </div>}
                      <div className={`${["/itinerario"].includes(window?.location?.pathname) && "pt-3"} flex justify-between`}>
                        <ItineraryButtonBox optionsItineraryButtonBox={optionsItineraryButtonBox} values={task} itinerario={itinerario} />
                      </div>
                    </div>
                  </div>
                }
              </div>
            </Form>
          )
        }}
      </Formik>
    </div >
  )
}
