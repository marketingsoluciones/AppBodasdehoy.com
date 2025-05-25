
import { FC, useEffect, useState } from "react";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { Event, Task } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { AuthContextProvider } from "../../context";
import { defaultImagenes } from "../../components/Home/Card";
import { useTranslation } from "react-i18next";
import { TaskNew } from "../../components/Itinerario/MicroComponente/TaskNew";
import { openGraphData } from "../_app";

interface props {
  evento: Event
  slug?: any
}

interface TaskReduce {
  fecha: number
  tasks?: Task[]

}


const Slug: FC<props> = (props) => {
  const { t } = useTranslation()
  const event = props.evento
  const { geoInfo } = AuthContextProvider()
  const [end, setEnd] = useState(false)
  const [tasksReduce, setTasksReduce] = useState<TaskReduce[]>()

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
  }, [])

  if (!props?.evento?.itinerarios_array?.length)
    return (
      <div className="bg-red-200 text-blue-700 w-full h-full text-center mt-20">
        Page not found error 404
      </div>
    )

  return (
    <section className={"absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4 bg-white"}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-0 gap-4 relative">
        <div className={`w-full h-14 rounded-xl shadow-lg flex items-center justify-between`}>
          <div className='flex md:flex-1 flex-col px-2 md:px-6 font-display'>
            <div className='space-x-1'>
              <span className='md:hidden capitalize text-primary text-[12px] leading-[12px]'>{event?.tipo}</span>
              <span className='md:hidden capitalize text-gray-600 text-[12px] leading-[20px] font-medium'>{event?.nombre}</span>
            </div>
          </div>
          <div className='flex-1 md:flex-none md:w-[35%] h-[100%] flex flex-row-reverse md:flex-row items-center '>
            <img
              src={event?.imgEvento ? `https://apiapp.bodasdehoy.com/${event.imgEvento.i800}` : defaultImagenes[event?.tipo]}
              className=" h-[90%] object-cover object-top rounded-md border-1 border-gray-600  hidden md:block"
              alt={event?.nombre}
            />
            <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2 md:pt-2 gap-2'>
              <span className='text-sm translate-y-2 text-primary text-[12px] first-letter:capitalize'>{event?.tipo}</span>
              <span className='uppercase w-64 truncate '>{event?.nombre}</span>
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
                {new Date(el?.fecha).toLocaleString(geoInfo?.acceptLanguage?.split(",")[0], { year: "numeric", month: "long", day: "2-digit" })}
              </span>
            </div>
            {el?.tasks?.map((elem, idx) => {
              return (
                <TaskNew
                  key={idx}
                  task={elem}
                  itinerario={event.itinerarios_array[0]}
                  view={"schema"}
                  // isSelect={selectTask === elem._id}
                  onClick={() => { }}
                />
              )
            })}
          </div>
        )
        }
        {end && <span id="elementControl" className="text-xs">~</span>}
      </motion.div>
    </section>
  )
};

export default Slug;


export async function getServerSideProps({ params }) {
  try {
    const p = params?.slug[0]?.split("-")
    const evento_id = p[1]
    const itinerario_id = p[2]
    const evento = await fetchApiEventos({
      query: queries.getItinerario,
      variables: {
        evento_id,
        itinerario_id
      }
    }) as any
    if (evento) {
      openGraphData.openGraph.title = `${evento.itinerarios_array[0].title}`
      openGraphData.openGraph.description = `Mira el itinerario del evento ${evento.nombre} y no te pierdas de nada`
    }
    return {
      props: { ...params, evento },
    };
  } catch (error) {
    return {
      props: params,
    };

  }
}