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
  isTaskPublic?: boolean
}

export const TaskNew: FC<props> = ({ itinerario, task, view, optionsItineraryButtonBox, isSelect, showModalCompartir, setShowModalCompartir, tempPastedAndDropFiles, setTempPastedAndDropFiles, isTaskPublic, ...props }) => {
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
  const initialValues: TaskDateTimeAsString = {
    _id: task?._id,
    icon: !task?.icon ? "" : task?.icon,
    fecha: !task?.fecha ? "" : new Date(task?.fecha).toLocaleString(geoInfo?.acceptLanguage?.split(",")[0], { year: 'numeric', month: '2-digit', day: '2-digit' }),
    hora: !task?.fecha ? "" : new Date(task?.fecha).toLocaleString(geoInfo?.acceptLanguage?.split(",")[0], { hour: 'numeric', minute: 'numeric' }),
    duracion: task?.duracion,
    tags: !task?.tags ? [] : task?.tags,
    descripcion: !task?.descripcion ? "" : task?.descripcion,
    responsable: !task?.responsable ? [] : task?.responsable,
    tips: !task?.tips ? "" : task?.tips,
    attachments: !task?.attachments ? [] : task?.attachments,
    spectatorView: task?.spectatorView,
    comments: task?.comments,
    commentsViewers: task?.commentsViewers,
    estatus: task?.estatus
  }

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
          valor: variable == "responsable" ? JSON.stringify(valor) : valor
        },
        domain: config.domain
      })
      setEvent((old) => {
        const f1 = old.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
        if (f1 > -1) {
          const f2 = old.itinerarios_array[f1].tasks.findIndex(elem => elem._id === task._id)
          old.itinerarios_array[f1].tasks[f2][`${variable}`] = valor
        }
        return { ...old }
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div {...props}>
      <Formik enableReinitialize initialValues={initialValues} onSubmit={() => { }}  >
        {({ values }) => {
          return (
            <Form className="w-full">
              <div className={`flex w-full justify-center items-stretch text-gray-800 ${["/servicios", "/public-card/servicios"].includes(window?.location?.pathname) ? "" : "2xl:px-36"} `} {...props} >
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
                        <div className={` bg-white  w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center rounded-full border-[1px] border-gray-300 `}>
                          <SelectIcon name="icon" className="" handleChange={handleBlurData} data={values} />
                        </div>
                        <span className="text-[19px] capitalize cursor-default">{values?.descripcion}</span>
                      </div>

                      {/*Estado*/}
                      {/* <div className="space-x-5 flex items-center">
                        <div className="flex items-center space-x-1">
                          <IoCalendarClearOutline className="pb-0.5" />
                          <span className="text-[14px] capitalize">{t('state'):}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[13px]">
                          Pendiente
                        </div>
                      </div> */}

                      {/* Responsables */}

                      {
                        !isTaskPublic &&
                        <div className="flex items-center space-x-5" >
                          <div className="flex items-center space-x-1" >
                            <HiOutlineUserCircle />
                            <span className="text-[14px] capitalize cursor-default">{t('assigned')}:</span>
                          </div>
                          {
                            values?.responsable.length > 0 ?
                              < div className="text-gray-900 flex ">
                                {values?.responsable?.map((elem, idx) => {
                                  const userSelect = GruposResponsablesArry.find(el => {
                                    return el.title.toLowerCase() === elem?.toLowerCase()
                                  }) ?? [user, event?.detalles_usuario_id, ...event.detalles_compartidos_array].find(el => {
                                    return el?.displayName?.toLowerCase() === elem?.toLowerCase()
                                  })
                                  return (
                                    <span key={idx} className="inline-flex items-center space-x-0.5 mr-1.5">
                                      <div className="w-6 h-6 rounded-full border-[1px] border-gray-400">
                                        <ImageAvatar user={userSelect} />
                                      </div>
                                    </span>
                                  )
                                })}
                              </div> :
                              <span className="text-[12px] text-gray-400 capitalize cursor-default ">{t('unassigned')}</span>
                          }
                        </div>
                      }

                      {/* Adjuntos */}
                      <div className="flex items-center space-x-5 relative" >
                        <div className="flex items-center space-x-1" >
                          <LiaPaperclipSolid />
                          <span className="text-[14px] capitalize cursor-default">{t('addfile')}:</span>
                        </div>
                        <div className={`text-[14px] flex items-center space-x-1 ${values.attachments.length > 0 ? "cursor-pointer" : "cursor-default"} `} onClick={() => values.attachments.length > 0 ? setShowModalAdjuntos({ state: !showModalAdjuntos.state, id: values._id }) : setShowModalAdjuntos({ state: false, id: "" })}>
                          {values.attachments.length > 0 ? "+" + values.attachments.length : <span className="text-[12px] text-gray-400 capitalize">{t('noAttachments')}</span>}
                          <GoChevronDown className={` w-[14px] h-auto transition-all  ${values.attachments.length === 0 && "hidden"}  ${showModalAdjuntos.state && "rotate-180"}  `} />
                        </div>
                        {showModalAdjuntos.state && <ClickAwayListener onClickAway={() => setShowModalAdjuntos({ state: false, id: "" })}>
                          <div className="bg-white p-4 rounded-md shadow-md absolute top-5 left-24 z-50 w-max">
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-lg font-semibold capitalize">{t('addfile')}</h2>
                              <button onClick={() => setShowModalAdjuntos({ state: false, id: "" })} className="text-gray-500 hover:text-gray-700">
                                &times;
                              </button>
                            </div>
                            <div className={` grid md:grid-cols-2 gap-2 truncate `} >
                              {values?.attachments?.map((elem, idx) =>
                                !!elem._id &&
                                <div
                                  key={idx}
                                  onClick={() => {
                                    downloadFile(storage, `${task._id}//${elem.name}`)
                                      .catch((error) => toast("error", `${t("Ha ocurrido un error")}`))
                                  }}
                                  className={`  flex justify-between hover:bg-gray-200 rounded-sm px-1 items-center   border-gray-500 cursor-pointer text-[12px] truncate`}>
                                  <span className="w-[150px] truncate">
                                    {elem.name}
                                  </span>
                                  <CgSoftwareDownload className="w-4 h-auto" />
                                </div>
                              )}
                            </div>
                          </div>
                        </ClickAwayListener>}
                      </div>

                      {/* Etiquetas */}
                      <div className="flex items-center space-x-5 relative">
                        <div className="flex items-center space-x-1" >
                          <MdOutlineLabel />
                          <span className="text-[14px] capitalize cursor-default">{t("labels")}:</span>
                        </div>
                        <div className="flex items-center md:w-[350px]">
                          {values?.tags?.length > 0 ? (
                            <>
                              <div className="hidden md:block space-x-1 ">
                                {values.tags.map((elem, idx) => (
                                  <span key={idx} className="inline-flex items-center border-[0.5px] border-gray-400 px-1 py-0.5 rounded-md text-[12px]">
                                    {elem}
                                  </span>
                                ))}
                              </div>
                              <div className="md:hidden">
                                <span className="inline-flex items-center border-[0.5px] border-gray-400 px-1 py-0.5 rounded-md text-[12px] cursor-pointer">
                                  {values.tags[0]}
                                </span>
                              </div>
                            </>
                          ) : (<span className="text-[12px] text-gray-400 capitalize cursor-default">{t('noLabels')}</span>)}
                          {values?.tags?.length > 1 && (
                            <span
                              onClick={() => setShowTagsModal(true)}
                              className="inline-flex items-center border-[0.5px] border-gray-400 px-1 py-0.5 rounded-md text-[12px] cursor-pointer md:hidden"
                            >
                              +{values.tags.length - 1}
                              <GoChevronDown className={` w-[14px] h-auto transition-all   ${showTagsModal && "rotate-180"}  `} />
                            </span>
                          )}
                          {showTagsModal && <ClickAwayListener onClickAway={() => setShowTagsModal(false)}>
                            <div className="bg-white p-4 rounded-md shadow-md absolute top-5 left-24 z-50">
                              <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold capitalize">{t("labels")}</h2>
                                <button onClick={() => setShowTagsModal(false)} className="text-gray-500 hover:text-gray-700">
                                  &times;
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {values.tags.map((elem, idx) => (
                                  <span key={idx} className="block border-[0.5px] border-gray-400 px-2 py-1 rounded-md text-[12px] truncate">
                                    {elem}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </ClickAwayListener>
                          }
                        </div>
                      </div>

                      {/*Fecha y hora */}
                      {["/servicios", "/public-card/servicios"].includes(window?.location?.pathname) &&
                        <div className="space-x-5 flex items-center">
                          <div className="flex items-center space-x-1">
                            <IoCalendarClearOutline className="pb-0.5" />
                            <span className="text-[14px] capitalize cursor-default">{t('date')}:</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {(values?.fecha && values?.hora) ? <>
                              <div className="text-[13px]">
                                {values?.fecha && values?.fecha.toLocaleString() + ","}
                              </div>
                              <span
                                className={`${["/itinerario"].includes(window?.location?.pathname) && "text-[15px] "} text-[13px]`}>
                                {values?.hora}
                              </span>
                            </>
                              : <span className="text-[12px] text-gray-400 capitalize cursor-default ">{t('undated')}</span>
                            }
                          </div>
                        </div>
                      }

                      {/* Hora */}
                      {
                        !["/servicios", "/public-card/servicios"].includes(window?.location?.pathname) && <div className="space-x-5 flex items-center">
                          <div className="flex items-center space-x-1">
                            <LuClock className="pb-0.5" />
                            <span className="text-[14px] capitalize cursor-default">{t("hour")}:</span>
                          </div>
                          <div className="flex items-center space-x-1 cursor-default">
                            {values?.hora ? <span className="text-[13px] capitalize">{t("activityTime")} {values?.hora}</span> : <span className="text-[12px] text-gray-400 capitalize cursor-default">Sin hora de la actividad</span>}
                          </div>
                        </div>
                      }

                      {/* duración */}
                      {
                        !["/servicios", "/public-card/servicios"].includes(window?.location?.pathname) && <div className="space-x-5 flex items-center">
                          <div className="flex items-center space-x-1">
                            <IoCalendarClearOutline className="pb-0.5" />
                            <span className="text-[14px] capitalize cursor-default">{t("duracion")}:</span>
                          </div>
                          <div className="flex items-center space-x-1 cursor-default">
                            {values?.duracion ? <span className="text-[13px] capitalize"> {values?.duracion} min</span> : <span className="text-[12px] text-gray-400 capitalize cursor-default">Sin duración</span>}
                          </div>
                        </div>
                      }
                      {/* block de texto */}
                      <div className={`${["/itinerario"].includes(window?.location?.pathname) ? "h-[100px]" : "md:h-[183px] h-[100px]"} border-[1px] border-gray-300 rounded-lg pt-2 pb-3 px-2  overflow-auto  md:w-full `}>
                        {!!values?.tips ?
                          <Interweave
                            className="text-xs transition-all break-words"
                            content={values.tips}
                            matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
                          /> : <span className="text-[12px] text-gray-400 capitalize cursor-default">{t('nodescription')}</span>
                        }
                      </div>
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
                            {!["/public-card/servicios"].includes(window?.location?.pathname) && comments?.map((elem, idx) => {
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
