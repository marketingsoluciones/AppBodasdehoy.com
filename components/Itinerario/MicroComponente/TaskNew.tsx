import { Form, Formik } from "formik";
import { FC, HTMLAttributes } from "react";
import { SelectIcon, GruposResponsablesArry } from ".";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useToast } from "../../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { ItineraryButtonBox } from './ItineraryButtonBox'
import { Itinerary, OptionsSelect, Task, TaskDateTimeAsString } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";
import { CgSoftwareDownload } from "react-icons/cg";
import { getBytes, getMetadata, getStorage, ref } from "firebase/storage";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher } from "interweave-autolink";
import 'react-quill/dist/quill.snow.css'
import { boolean } from "yup";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { InputComments } from "./InputComments"
import { ListComments } from "./ListComments"

interface props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary
  task: Task
  ht: any
  view: ViewItinerary
  optionsItineraryButtonBox: OptionsSelect[]
  isSelect: boolean
}

export const TaskNew: FC<props> = ({ itinerario, task, ht, view, optionsItineraryButtonBox, isSelect, ...props }) => {
  const { config, geoInfo, user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const toast = useToast()
  const { t } = useTranslation();
  const storage = getStorage();
  const initialValues: TaskDateTimeAsString = {
    _id: task._id,
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
    comments: task.comments,
    commentsViewers: task.commentsViewers
  }

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

  const handleDownload = async (elem) => {
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
  }

  return (
    <Formik enableReinitialize initialValues={initialValues} onSubmit={() => { }}  >
      {({ values }) => {
        return (
          <Form className="w-full">
            <div className="*bg-purple-500 flex w-full justify-center 2xl:px-36 items-stretch text-gray-800" {...props} >
              {view === "schema" &&
                <>
                  <div className="*bg-violet-300 flex w-[55%] md:w-[45%] lg:w-[40%] p-2 items-start justify-start border-t-[1px] border-r-[1px] border-primary border-dotted relative">
                    <div className="*bg-orange-500 w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center">
                      <SelectIcon name="icon" className="*bg-white scale-[120%] -translate-y-1" handleChange={handleBlurData} />
                    </div>
                    <div className="flex-1">
                      <div className="*bg-orange-300 inline-flex flex-col justify-start items-start">
                        <span className="text-xl md:text-2xl text-gray-900">{values?.hora}</span>
                        <div className="*bg-violet-400 w-full flex justify-end items-end text-xs -mt-1">
                          <span> {t("duration")}</span>
                          <span className="text-[12px] md:text-[14px] lg:text-[16px] text-center bg-transparent px-1" >
                            {values?.duracion}
                          </span>
                          <span>min</span>
                        </div>
                      </div>
                      <div className="*bg-yellow-700 flex items-start space-x-2 font-title text-primary text-2xl">
                        <div className="min-w-2 h-2 bg-primary rounded-full translate-y-2.5" />
                        <strong className="leading-[1] mt-1">{values?.descripcion}</strong>
                      </div>
                      <div className="*bg-yellow-200 grid grid-flow-dense w-full space-x-2 text-[12px] mt-2">
                        <p >
                          Responsables: {values?.responsable.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white w-3 h-3 rounded-full border-[1px] border-primary border-dotted absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="*bg-rose-400 flex-1 flex flex-col px-8 md:px-0 border-t-[1px] border-primary border-dotted">
                    {!!values?.tips && <Interweave
                      className="text-xs text-justify transition-all m-1 p-1 bg-white"
                      content={values.tips}
                      matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
                    />}
                  </div>
                </>}
              {view === "cards" &&
                <div className={`${isSelect ? "border-gray-300" : "border-gray-100"} border-2 box-content bg-gray-100 w-full rounded-lg mx-2 my-1 flex p-2`}>
                  <div className="bg-white w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center rounded-full border-[1px] border-gray-300">
                    <SelectIcon name="icon" className="" handleChange={handleBlurData} />
                  </div>
                  <div className="*bg-rose-600 flex-1 flex flex-col text-[12px] pl-1 md:pl-2">
                    {!["/itinerario"].includes(window?.location?.pathname) && <span className="font-bold">{values?.fecha.toLocaleString()}</span>}
                    <span className={`${["/itinerario"].includes(window?.location?.pathname) && "text-[15px]"} font-bold`}>{values?.hora}</span>
                    {values?.duracion && <span>Duración {values?.duracion} min</span>}
                    <span className="text-[19px]">{values?.descripcion}</span>
                    {!!values?.tips && <Interweave
                      className="text-xs text-justify transition-all m-1 p-1 bg-white"
                      content={values.tips}
                      matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
                    />}
                    <div>
                      <span>
                        Responsables:
                      </span>
                      <div className="text-gray-900">
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
                              <span className={`flex-1 ${!userSelect && "line-through"}`}>
                                {elem}
                              </span>
                            </span>
                          )
                        }
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span>
                        Archivos adjuntos:
                      </span>
                      <p className="bg-white p-2 text-gray-900 leading-[1.3] space-y-3 md:space-y-2">
                        {values?.attachments?.map((elem, idx) =>
                          !!elem._id && <span key={idx} onClick={() => { handleDownload(elem) }} className="inline-flex mr-2 md:mr-3 items-center border-b-[1px] hover:font-bold border-gray-500 cursor-pointer">
                            <span>
                              {elem.name}
                            </span>
                            <CgSoftwareDownload className="w-4 h-auto" />
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mb-2">
                      <span>
                        Etiquetas:
                      </span>
                      <p className="bg-white p-2 text-gray-900 leading-[1] space-y-1">
                        {values?.tags?.map((elem, idx) =>
                          <span key={idx} onClick={() => { handleDownload(elem) }} className="inline-flex mr-2 md:mr-3 items-center border-[1px] border-gray-400 px-1 pt-[1px] pb-[2px] rounded-md">
                            {elem}
                          </span>
                        )}
                      </p>
                    </div>
                    {!["/itinerario"].includes(window?.location?.pathname) && <div className="mb-2">
                      <span>
                        Comentarios:
                      </span>
                      <div className='border-gray-300 border-[1px] rounded-lg py-2'>
                        <InputComments itinerario={itinerario} task={task} />
                        <div className='w-[calc(100%)] flex flex-col-reverse rounded-lg'>
                          {task?.comments?.map((elem, idx) => {
                            return (
                              <ListComments key={idx} itinerario={itinerario} task={task} item={elem} setConfirmation={() => { }} />
                            )
                          })}
                        </div>
                      </div>
                    </div>}

                    <ItineraryButtonBox optionsItineraryButtonBox={optionsItineraryButtonBox} values={task} itinerario={itinerario} />
                  </div>
                </div>
              }
            </div>
          </Form>
        )
      }}
    </Formik>

  )
}