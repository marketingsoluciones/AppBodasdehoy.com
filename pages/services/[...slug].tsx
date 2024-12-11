
import { FC, useEffect, useState } from "react";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { Event, Task } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { AuthContextProvider, EventContextProvider } from "../../context";
import { defaultImagenes } from "../../components/Home/Card";
import { useTranslation } from "react-i18next";
import { TaskNew } from "../../components/Itinerario/MicroComponente/TaskNew";

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
  const p = props?.slug[0]?.split("-")
  const recurse = p[0]

  useEffect(() => {
    setTimeout(() => {
      setEnd(true)
    }, 2000);
  }, [])

  useEffect(() => {
    if (event?.itinerarios_array[0].tasks.length > 0) {
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

  if (!props.evento.itinerarios_array.length)
    return (
      <div className="bg-red-200 text-blue-700 w-full h-full text-center mt-20">
        Page not found error 404
      </div>
    )

  if (recurse === "servicios") {
    return (
      <ServicesVew eventProps={event} end={end} p={p} />
    )
  }



};

export default Slug;

const ServicesVew = ({ eventProps, end, p }) => {
  const { event } = EventContextProvider()
  const f1 = event?.itinerarios_array?.findIndex(({ _id }) => _id === p[2])
  const f2 = eventProps?.itinerarios_array[0]?.tasks?.findIndex(({ _id }) => _id === p[3])
  const Task = event?.itinerarios_array[f1]?.tasks[f2]
  const Task2 = eventProps?.itinerarios_array[0]?.tasks?.find(({ _id }) => _id === p[3])
  const { user } = AuthContextProvider();


  return (
    <>
      <section className={` absolute  w-[calc(100vw-20px)] overflow-x-hidden ${user ? "h-[calc(100vh-200px)]" : "h-[calc(100vh-100px)]"} mt-5 left-4 bg-white `}>
        <div className=" fixed right-0 bottom-0 hidden md:block   ">
          <img src="/MujerPrincipal.webp" alt="Imagen de fondo" className="image transition-all" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2- -pr-[1px] md:px-0 gap-4 relative">

          {/* <div className={`bg-white w-full h-14 rounded-xl shadow-lg flex items-center justify-between `}>
          <div className='flex md:flex-1 flex-col px-2 md:px-6 font-display'>
          <div className='space-x-1'>
          <span className='md:hidden capitalize text-primary text-[12px] leading-[12px]'>{eventProps?.tipo}</span>
          <span className='md:hidden capitalize text-gray-600 text-[12px] leading-[20px] font-medium'>{eventProps?.nombre}</span>
          </div>
          </div>
          <div className='flex-1 md:flex-none md:w-[35%] h-[100%] flex flex-row-reverse md:flex-row items-center '>
          <img
          src={defaultImagenes[eventProps?.tipo]}
          className=" h-[90%] object-cover object-top rounded-md border-1 border-gray-600  hidden md:block"
          alt={event?.nombre}
          />
          <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2 md:pt-2 gap-2'>
          <span className='text-sm translate-y-2 text-primary text-[12px] first-letter:capitalize'>{eventProps?.tipo}</span>
          <span className='uppercase w-64 truncate '>{eventProps?.nombre}</span>
          </div>
          </div>
          </div> */}
          <div className="w-full px-4 md:px-10 py-4" >
            <div className="flex flex-col justify-center items-center">
              <span className="text-3xl md:text-[40px] font-title text-primary">{eventProps?.itinerarios_array[0]?.title}</span>
              <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
            </div>
          </div >
          <div className="w-full  mt-4">
            <TaskNew
              task={Task}
              itinerario={eventProps?.itinerarios_array[0]}
              view={"cards"}
              // isSelect={selectTask === elem._id}
              onClick={() => { }}
            />
          </div>
          {end && <span id="elementControl" className="text-xs">~</span>}
        </motion.div>
      </section>
      <style jsx>
        {`
         
          .image {
            height: 400px;
          }

          @media only screen and (min-width: 1700px) {
            .image {
              height: 700px;
              
            }
          }
            @media only screen and (max-height: 530px) {
            .image {
              display: none;
              
            }
          }
        `}
      </style>
    </>
  )
}

export async function getServerSideProps({ params }) {
  try {
    const p = params?.slug[0]?.split("-")
    const recurse = p[0]
    const evento_id = p[1]
    const itinerario_id = p[2]

    const evento = await fetchApiEventos({
      query: queries.getItinerario,
      variables: {
        evento_id,
        itinerario_id
      }
    })

    return {
      props: { ...params, evento },
    };
  } catch (error) {
    return {
      props: params,
    };

  }
}