import { Form, Formik } from "formik";
import { FC, HTMLAttributes, useEffect, useRef, useState } from "react";
import { SelectIcon, GruposResponsablesArry } from ".";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useTranslation } from 'react-i18next';
import { ItineraryButtonBox } from './ItineraryButtonBox'
import { Comment, Itinerary, OptionsSelect, Task, TaskDateTimeAsString } from "../../../utils/Interfaces";
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
import { FaPencilAlt } from "react-icons/fa"; // Ícono de lápiz
import InputField from "../../Forms/InputField";
import { InputTags } from "../../Forms/InputTags";

interface props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary
  task: Task
  view: ViewItinerary
  optionsItineraryButtonBox?: OptionsSelect[]
  isSelect?: boolean
  showModalCompartir?: any
  setShowModalCompartir?: any
  tempPastedAndDropFiles?: TempPastedAndDropFiles[]
  setTempPastedAndDropFiles?: any
  
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
  const [editingField, setEditingField] = useState<string | null>(null); // Estado para manejar qué campo está en edición
  const [tempValue, setTempValue] = useState<string>(""); // Valor temporal para edición

  const initialValues: TaskDateTimeAsString = {
    _id: task?._id,
    icon: task?.icon || "",
    fecha: task?.fecha || "",
    hora: task?.hora || "",
    duracion: task?.duracion || "",
    tags: task?.tags || [],
    descripcion: task?.descripcion || "",
    responsable: task?.responsable || [],
    tips: task?.tips || "",
    attachments: task?.attachments || [],
    spectatorView: task?.spectatorView || false,
    comments: task?.comments || [],
    commentsViewers: task?.commentsViewers || [],
    estatus: task?.estatus || false,
  };

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
      console.log("Guardando datos:", { variable, valor }); // Agrega un log para verificar los datos enviados
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable,
          valor: variable === "responsable" ? JSON.stringify(valor) : valor, // Asegúrate de que el formato sea correcto
        },
        domain: config.domain,
      });
  
      // Actualiza el estado del evento
      setEvent((old) => {
        const f1 = old.itinerarios_array.findIndex((elem) => elem._id === itinerario._id);
        if (f1 > -1) {
          const f2 = old.itinerarios_array[f1].tasks.findIndex((elem) => elem._id === task._id);
          old.itinerarios_array[f1].tasks[f2][`${variable}`] = valor;
        }
        return { ...old };
      });
    } catch (error) {
      console.error("Error al guardar los datos:", error); // Agrega un log para capturar errores
    }
  };

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue || ""); // Inicializa con el valor actual o vacío
  };

  const handleSave = async (field: string) => {
    console.log("Guardando campo:", field, "con valor:", tempValue); // Log para verificar el campo y valor
    await handleBlurData(field, tempValue); // Llama a handleBlurData con el campo y valor
    setEditingField(null); // Salir del modo de edición
  };

  const renderEditableField = (field: string, label: string, content: JSX.Element, value: string | string[], placeholder: string) => {
    const displayValue = Array.isArray(value) ? value.join(", ") : value || placeholder;
  
    return (
      <div className="relative group">
        {/* Campo de texto o input */}
        {editingField === field ? (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)} // Actualiza tempValue
            onBlur={() => handleSave(field)} // Guarda al perder el foco
            onKeyDown={(e) => e.key === "Enter" && handleSave(field)} // Guarda al presionar Enter
            className="border border-gray-300 rounded px-2 py-1 w-full"
            autoFocus
          />
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-[14px] capitalize">{label}:</span>
            {content}
          </div>
        )}
  
        {/* Ícono de lápiz */}
        <FaPencilAlt
          onClick={() => handleEdit(field, Array.isArray(value) ? value.join(", ") : value)}
          className="absolute top-1/2 right-2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    );
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
                        <div className=" flex items-start space-x-2 font-title text-primary text-2xl">
                          <div className="min-w-2 h-2 bg-primary rounded-full translate-y-2.5" />
                          <strong className="leading-[1] mt-1">{values?.descripcion}</strong>
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
                      <div className="flex items-center space-x-2">
                        <div className={`${values?.estatus === true ? "" : "cursor-pointer"} bg-white  w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center rounded-full border-[1px] border-gray-300 `}>
                          <SelectIcon name="icon" className="" handleChange={handleBlurData} data={values} />
                        </div>
                        <span className="text-[19px] capitalize cursor-default">{values?.descripcion}</span>
                      </div>

                      {/* Responsables */}
                      {renderEditableField(
                        "responsable",
                        t("assigned"),
                        values?.responsable.length > 0 ? (
                          <div className="text-gray-900 flex">
{values?.responsable?.map((elem, idx) => {
  const userObject = { id: elem, name: elem }; // Crea un objeto compatible con `detalle_compartidos_array`
  return (
    <span key={idx} className="inline-flex items-center space-x-0.5 mr-1.5">
      <div className="w-6 h-6 rounded-full border-[1px] border-gray-400">
        <ImageAvatar user={userObject} />
      </div>
    </span>
  );
})}
                          </div>
                        ) : (
                          <span className="text-[12px] text-gray-400 capitalize cursor-default">{t("unassigned")}</span>
                        ),
                        values?.responsable,
                        t("unassigned")
                      )}

{/* Adjuntos */}
{renderEditableField(
  "attachments",
  t("addfile"),
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
    {values.attachments.length > 0 ? (
      "+" + values.attachments.length
    ) : (
      <span className="text-[12px] text-gray-400 capitalize">{t("noAttachments")}</span>
    )}
    <GoChevronDown
      className={`w-[14px] h-auto transition-all ${
        values.attachments.length === 0 && "hidden"
      } ${showModalAdjuntos.state && "rotate-180"}`}
    />
  </div>,
  // Convierte el arreglo de FileData[] a string[] usando map
  values?.attachments.map((file) => file.name || file.url || "Archivo sin nombre"),
  t("noAttachments")
)}

{/* Etiquetas */}
{renderEditableField(
  "tags",
  t("labels"),
  editingField === "tags" ? (
    <InputTags
      name="tags"
      label={t("etiquetas")}
      value={values?.tags || []}
      onChange={(newTags) => setTempValue(newTags)}
    />
  ) : (
    <div className="hidden md:block space-x-1">
      {values?.tags?.length > 0 ? (
        values.tags.map((elem, idx) => (
          <span
            key={idx}
            className="inline-flex items-center border-[0.5px] border-gray-400 px-1 py-0.5 rounded-md text-[12px]"
          >
            {elem}
          </span>
        ))
      ) : (
        <span className="text-[12px] text-gray-400 capitalize cursor-default">
          {t("noLabels")}
        </span>
      )}
    </div>
  ),
  values?.tags,
  t("noLabels")
)}

{/* Fecha, Hora y Duración */}
{renderEditableField(
  "fecha",
  t(""),
  editingField === "fecha" ? (
    <div className="flex flex-col space-y-2">
      {/* Fecha */}
      <InputField
        name="fecha"
        label={t("Fecha")}
        type="date"
        value={values?.fecha || ""}
        onChange={(e) => setTempValue({ ...tempValue, fecha: e.target.value })}
      />

      {/* Hora */}
      <InputField
        name="hora"
        label={t("Hora")}
        type="time"
        value={values?.hora || ""}
        onChange={(e) => setTempValue({ ...tempValue, hora: e.target.value })}
      />

      {/* Duración */}
      <InputField
        name="duracion"
        label={t("Duración")}
        type="number"
        value={values?.duracion || ""}
        onChange={(e) => setTempValue({ ...tempValue, duracion: e.target.value })}
      />
    </div>
  ) : (
    <div className="flex flex-col space-y-2">
      {/* Fecha */}
      <div className="flex items-center space-x-2">
        <span className="text-[14px] capitalize">{t("date")}:</span>
        <span className="text-[13px] text-gray-700">{values?.fecha || t("undated")}</span>
      </div>

      {/* Hora */}
      <div className="flex items-center space-x-2">
        <span className="text-[14px] capitalize">{t("hour")}:</span>
        <span className="text-[13px] text-gray-700">{values?.hora || t("noHour")}</span>
      </div>

      {/* Duración */}
      <div className="flex items-center space-x-2">
        <span className="text-[14px] capitalize">{t("duration")}:</span>
        <span className="text-[13px] text-gray-700">
          {values?.duracion ? `${values?.duracion} min` : t("noDuration")}
        </span>
      </div>
    </div>
  ),
  values?.fecha,
  t("undated")
)}

                      {/* block de texto */}
                      {renderEditableField(
                        "tips",
                        t(""),
                        <div
                          className={`${["/itinerario"].includes(window?.location?.pathname) ? "h-[100px]" : "md:h-[183px] h-[100px]"} border-[1px] border-gray-300 rounded-lg pt-2 pb-3 px-2 overflow-auto md:w-full`}
                        >
                          {!!values?.tips ? (
                            <Interweave
                              className="text-xs transition-all break-words"
                              content={values.tips}
                              matchers={[new UrlMatcher("url"), new HashtagMatcher("hashtag")]}
                            />
                          ) : (
                            <span className="text-[12px] text-gray-400 capitalize cursor-default">{t("nodescription")}</span>
                          )}
                        </div>,
                        values?.tips,
                        t("nodescription")
                      )}
                    </div>

                    {/* lado derecho de la tarjeta */}
                    <div className="flex-1 flex flex-col text-[12px] pl-1 md:pl-2 mt-1 md:mt-0 w-full">
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
