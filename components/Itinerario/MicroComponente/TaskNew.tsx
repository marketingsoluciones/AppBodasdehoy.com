import { Form, Formik } from "formik";
import { FC } from "react";
import { Description, Duration, ResponsableSelector, SelectIcon, Tips, ResponsablesArry } from ".";
import { InputTime } from "../../Forms/inputs/InputTime";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useToast } from "../../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { ItineraryButtonBox } from './ItineraryButtonBox'
import { responsePathAsArray } from "graphql";
import { IoIosAttach } from "react-icons/io";
import { Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";

interface props {
  itinerario: Itinerary
  task: Task
  disable: any
  ht: any
  view: ViewItinerary
  optionsItineraryButtonBox: OptionsSelect[]
}

export const TaskNew: FC<props> = ({ itinerario, task, disable, ht, view, optionsItineraryButtonBox }) => {
  const { config, geoInfo } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const toast = useToast()
  const { t } = useTranslation();
  const initialValues: Task = {
    _id: task._id,
    icon: !task?.icon ? "" : task?.icon,
    hora: !task?.fecha ? "" : new Date(task?.fecha).toLocaleString(geoInfo?.acceptLanguage?.split(",")[0], { hour: 'numeric', minute: 'numeric' }),
    duracion: !task?.duracion ? 30 : task?.duracion,
    descripcion: !task?.descripcion ? "" : task?.descripcion,
    responsable: !task?.responsable ? [] : task?.responsable,
    tips: !task?.tips ? [] : task?.tips,
    attachments: !task?.attachments ? [] : task?.attachments,
  }

  const handleBlurData = async (variable, valor) => {
    try {
      const result = await fetchApiEventos({
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
    <Formik enableReinitialize initialValues={initialValues} onSubmit={() => { }}  >
      {({ values }) => {
        return (
          <Form className="w-full">
            <div className="*bg-purple-500 flex w-full justify-center 2xl:px-36 items-stretch text-gray-800" >
              {view === "schema" &&
                <>
                  <div className="*bg-violet-300 flex w-[55%] md:w-[45%] lg:w-[40%] p-2 items-start justify-start border-t-[1px] border-r-[1px] border-primary border-dotted relative">
                    <div className="*bg-orange-500 w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center">
                      <SelectIcon name="icon" className="*bg-white scale-[120%] -translate-y-1" handleChange={handleBlurData} disable={disable} ht={ht} />
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
                    {/* aqui sustiir por <p></p> */}
                    {values?.tips.map((elem, idx) =>
                      <p className="text-[13px]" key={idx}>{elem}</p>
                    )}
                  </div>
                </>}
              {view === "cards" &&
                <div className="bg-gray-100 w-full rounded-lg mx-2 my-1 flex p-2">
                  <div className="bg-white w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center rounded-full border-[1px] border-gray-300">
                    <SelectIcon name="icon" className="" handleChange={handleBlurData} disable={disable} ht={ht} />
                  </div>
                  <div className="*bg-rose-600 flex-1 flex flex-col text-[12px]">
                    <span className="text-[15px] font-bold">{values?.hora}</span>
                    <span>Duración {values?.duracion} min</span>
                    <span className="text-[19px]">{values?.descripcion}</span>
                    <p>{values?.tips.join(", ")}</p>
                    <div>
                      <span>
                        Responsables:
                      </span>
                      <p className="text-gray-900 leading-[0.8]">
                        {values?.responsable?.map((elem, idx) =>
                          <span key={idx} className="inline-flex ml-2 items-center">
                            <img alt={elem} src={ResponsablesArry.find(el => el.title.toLowerCase() === elem.toLowerCase()).icon} className="w-6 h-6" />
                            <span>
                              {elem}
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mb-2">
                      <span>
                        Archivos adjuntos:
                      </span>
                      <p className="bg-white py-2 text-gray-900 leading-[2]">
                        {values?.attachments?.map((elem, idx) =>
                          <span key={idx} className="inline-flex ml-2 items-center">
                            <IoIosAttach className="w-4 h-auto" />
                            <span>
                              {elem}
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                    <ItineraryButtonBox optionsItineraryButtonBox={optionsItineraryButtonBox} values={values} />
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