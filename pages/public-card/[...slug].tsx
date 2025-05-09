
import { FC, useEffect, useState } from "react";
import { fetchApiBodas, fetchApiEventos, queries } from "../../utils/Fetching";
import { Event } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { defaultImagenes } from "../../components/Home/Card";
import { TaskNew } from "../../components/Itinerario/MicroComponente/TaskNew";
import { openGraphData } from "../_app";
import { AuthContextProvider, varGlobalDevelopment } from "../../context/AuthContext";
import { EventContextProvider } from "../../context";
import { TempPastedAndDropFiles } from "../../components/Itinerario/MicroComponente/ItineraryPanel";

interface props {
  evento: Event
  users: any
  slug?: any
  query?: any
}


const Slug: FC<props> = (props) => {

  if (!props?.evento?.itinerarios_array?.length)
    return (
      <div className="bg-red-200 text-blue-700 w-full h-full text-center mt-20">
        Page not found error 404
      </div>
    )
  return (
    <ServicesVew evento={props.evento} />
  )
};

export default Slug;

const ServicesVew = (props) => {
  const { evento, users } = props
  const { event, setEvent } = EventContextProvider()
  const { setUser } = AuthContextProvider()
  const [tempPastedAndDropFiles, setTempPastedAndDropFiles] = useState<TempPastedAndDropFiles[]>([]);

  useEffect(() => {
    setEvent({ ...evento })
    setUser({ displayName: "anonymous" })
  }, [props])

  return (
    <section className={` absolute z-[50] w-[calc(100vw)] h-[calc(100vh-63px)] top-[63px] left-4. bg-white`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2- -pr-[1px] md:px-0 gap-4 relative"
      >
        <div className={`bg-white w-full h-14 rounded-xl shadow-lg flex items-center justify-between `}>
          <div className='flex md:flex-1 flex-col px-2 md:px-6 font-display'>
            <div className='space-x-1'>
              <span className='md:hidden capitalize text-primary text-[12px] leading-[12px]'>{evento?.tipo}</span>
              <span className='md:hidden capitalize text-gray-600 text-[12px] leading-[20px] font-medium'>{evento?.nombre}</span>
            </div>
          </div>
          <div className='flex-1 md:flex-none md:w-[35%] h-[100%] flex flex-row-reverse md:flex-row items-center '>
            <img
              src={defaultImagenes[evento?.tipo]}
              className=" h-[90%] object-cover object-top rounded-md border-1 border-gray-600  hidden md:block"
              alt={evento?.nombre}
            />
            <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2 md:pt-2 gap-2'>
              <span className='text-sm translate-y-2 text-primary text-[12px] first-letter:capitalize'>{evento?.tipo}</span>
              <span className='uppercase w-64 truncate '>{evento?.nombre}</span>
            </div>
          </div>
        </div>
        <div className="w-full px-4 md:px-10 py-4" >
          <div className="flex flex-col justify-center items-center">
            <span className="text-3xl md:text-[40px] font-title text-primary">{evento?.itinerarios_array[0]?.title}</span>
            <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
          </div>
        </div >
        <div className="w-full  mt-4">
          <TaskNew
            task={evento?.itinerarios_array[0]?.tasks[0]}
            itinerario={evento?.itinerarios_array[0]}
            view={"cards"}
            isTaskPublic={true}
            onClick={() => { }}
            tempPastedAndDropFiles={tempPastedAndDropFiles}
            setTempPastedAndDropFiles={setTempPastedAndDropFiles}
          />
        </div>
      </motion.div>
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
    </section>
  )
}

//https://dev.bodasdehoy.com/public-card/servicios?event=67925c3c334004a3930cb331&itinerary=67cf2e71bfa1cbe167ebce7c&task=67cf2e71bfa1cbe167ebce7d
export async function getServerSideProps(context) {
  const { params, query, req } = context
  try {
    const p = params?.slug[0]?.split("-")
    const evento_id = p?.[1] || query?.event;
    const itinerario_id = p?.[2] || query?.itinerary;

    const evento = await fetchApiEventos({
      query: queries.getItinerario,
      variables: {
        evento_id,
        itinerario_id
      }
    }) as any

    if (evento) {
      openGraphData.openGraph.title = `${evento.itinerarios_array[0]?.tasks[0]?.descripcion}`
      openGraphData.openGraph.description = evento.itinerarios_array[0]?.tasks[0]?.tips?.replace(/<[^>]*>/g, "")?.replace(".", ". ")
    }
    const itinerary = evento.itinerarios_array.find(elem => elem._id === query.itinerary)
    const task = itinerary?.tasks?.find(elem => elem._id === query.task)
    const users = await fetchApiBodas({
      query: queries?.getUsers,
      variables: { uids: task.comments.filter(elem => !!elem.uid).map(elem => elem.uid) },
      development: getDevelopment(req.headers.host)
    })
    const usersMap = users.map(elem => {
      return {
        uid: elem.uid,
        displayName: elem?.displayName,
        photoURL: elem.photoURL
      }
    })
    evento._id = evento_id,
      itinerary.tasks = [task]
    evento.itinerarios_array = [itinerary]
    evento.detalles_compartidos_array = users
    return {
      props: { ...params, query, evento, users: usersMap },
    };
  } catch (error) {
    console.log(error)
    return {
      props: params,
    };

  }
}

const getDevelopment = (host) => {
  let domain = '';

  if (host) {
    // Eliminar el puerto si existe (ej: localhost:3000)
    const hostWithoutPort = host.split(':')[0];
    const parts = hostWithoutPort.split('.');
    const numParts = parts.length;

    if (numParts >= 2) {
      domain = parts.slice(-2).join('.');
      // Caso especial para dominios como co.uk, com.ar, etc.
      if (numParts > 2 && ['.co', '.com', '.net', '.org'].some(tld => domain.startsWith(tld))) {
        domain = parts.slice(-3).join('.');
      }
    } else {
      domain = hostWithoutPort; // Si no hay puntos, asumimos que es el dominio
    }
  }
  return domain.split(".")[0]
}