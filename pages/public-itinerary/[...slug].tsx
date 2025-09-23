
import { FC, useEffect, useState } from "react";
import { fetchApiEventos, fetchApiEventosServer, queries } from "../../utils/Fetching";
import { Event, Task } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { AuthContextProvider, EventContextProvider } from "../../context";
import { defaultImagenes } from "../../components/Home/Card";
import { TaskNew } from "../../components/Servicios/VistaTarjeta/TaskNew";
import { openGraphData } from "../_app";
import { TimeZone } from "../../components/icons";
import { useTranslation } from "react-i18next";

interface props {
  evento: Event
  slug?: any
  error?: string
}

interface TaskReduce {
  fecha: number
  tasks?: Task[]
}

const Slug: FC<props> = (props) => {
  const { event, setEvent } = EventContextProvider()
  const { config } = AuthContextProvider()
  const [end, setEnd] = useState(false)
  const [tasksReduce, setTasksReduce] = useState<TaskReduce[]>()
  const { t } = useTranslation()

  useEffect(() => {
    const tasks = props?.evento.itinerarios_array[0].tasks.filter((task) => task.spectatorView === true)
    props.evento.itinerarios_array[0].tasks = tasks
    setEvent({ ...props.evento })
  }, [props])

  useEffect(() => {
    setTimeout(() => {
      setEnd(true)
    }, 2000);
  }, [])

  useEffect(() => {
    if (event?.itinerarios_array[0]?.tasks?.length > 0) {
      const tasks = [event?.itinerarios_array[0]?.tasks?.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())]
      const taskReduce: TaskReduce[] = tasks[0].reduce((acc: TaskReduce[], item: Task) => {
        const f = new Date(item.fecha)
        const y = f.getUTCFullYear()
        const m = f.getUTCMonth()
        const d = f.getUTCDate()
        const date = new Date(y, m, d).getTime()
        const f1 = acc.findIndex(elem => elem.fecha === date)
        if (f1 < 0) {
          acc.push({ fecha: item.fecha ? date : null, tasks: [item] })
        } else {
          acc[f1].tasks.push(item)
        }
        return acc
      }, [])
      setTasksReduce(taskReduce)
    } else {
      setTasksReduce([])
    }
  }, [event])

  if (!event?.itinerarios_array?.length) {
    return (
      <div className="bg-[#ffbfbf] text-blue-700 w-full h-full text-center mt-20">
        Page not found error 404
      </div>
    )
  }

  return (
    <>{
      event &&
      <section className={"absolute z-[50] w-full h-[100vh] top-0 bg-white"}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[10px] md:px-0 gap-4 relative">
          <div className={`w-full h-14 rounded-xl shadow-lg flex items-center`}>
            <div className='flex flex-1 flex-col px-2 md:px-6 font-display'>
              <div className='flex flex-col'>
                <span className='md:hidden capitalize text-primary text-[12px] leading-[12px]'>{event?.tipo}</span>
                <span className='md:hidden capitalize text-gray-600 text-[12px] leading-[12px] font-medium line-clamp-2'>{event?.nombre}</span>
              </div>
            </div>
            <div className='flex min-w-min px-4 md:px-8'>
              <div className="text-gray-600 flex flex-col justify-center items-center">
                <div className="flex justify-center space-x-0.5 w-full">
                  <TimeZone />
                  <span className="text-[11px]">{t("timeZone")}</span>
                </div>
                <span className="text-xs">{event?.timeZone ? event?.timeZone?.split("/")[1] : config?.timeZone?.split("/")[1]}</span>
              </div>
            </div>
            <div className='md:flex-none h-[100%] flex flex-row-reverse md:flex-row items-center '>
              <img
                src={event?.imgEvento ? `https://apiapp.bodasdehoy.com/${event?.imgEvento?.i800}` : defaultImagenes[event?.tipo]}
                className="h-[90%] object-cover object-top rounded-md border-1 border-gray-600 block"
                alt={event?.nombre}
              />
              <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2 leading-3'>
                <span className='text-sm text-primary text-[12px] first-letter:capitalize'>{event?.tipo}</span>
                <span className='uppercase w-64 leading-[14px] line-clamp-2'>{event?.nombre}</span>
              </div>
            </div>
          </div>
          <div className="w-full px-4 md:px-10 py-4" >
            <div className="flex flex-col justify-center items-center">
              <span className="text-3xl md:text-[40px] font-title text-primary">{event?.itinerarios_array[0]?.title}</span>
              <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
            </div>
          </div >
          {tasksReduce?.map((el, i) =>
            <div key={i} className="w-full *h-[500px] mt-4">
              <div className={`w-full flex justify-start`}>
                <span className={`border-primary border-dotted mb-1 border-[1px] px-5 py-[1px] rounded-full text-[12px] font-semibold`}>
                  {new Date(el?.fecha).toLocaleString(navigator.language, { year: "numeric", month: "long", day: "2-digit" })}
                </span>
              </div>
              {el?.tasks?.map((elem, idx) => {
                return (
                  <TaskNew
                    key={idx}
                    task={elem}
                    itinerario={event?.itinerarios_array[0]}
                    view={"schema"}
                    onClick={() => { }}
                  />
                )
              })}
            </div>
          )}
          {end && <span id="elementControl" className="text-xs">~</span>}
        </motion.div>
      </section>
    }    </>
  )
};

export default Slug;


export async function getServerSideProps({ params }) {
  try {
    const p = params?.slug[0]?.split("-")
    const evento_id = p[1]
    const itinerario_id = p[2]
    let evento: Event | null = null;
    try {
      const data = await fetchApiEventosServer({
        query: queries.getItinerario,
        variables: {
          evento_id,
          itinerario_id
        }
      });
      evento = data.getItinerario;
    } catch (error) {
      try {
        evento = await fetchApiEventos({
          query: queries.getItinerario,
          variables: {
            evento_id,
            itinerario_id
          }
        }) as any;
      } catch (error2) {
        throw error2;
      }
    }
    if (evento) {
      openGraphData.openGraph.title = `${evento?.itinerarios_array[0]?.title}`
      openGraphData.openGraph.description = `Mira el itinerario del evento ${evento?.nombre} y no te pierdas de nada`
    }
    return {
      props: {
        evento,
        slug: params.slug || null,
      },
    };
  } catch (error) {
    return {
      props: {
        evento: null,
        slug: params.slug || null,
        error: error
      },
    };
  }
}