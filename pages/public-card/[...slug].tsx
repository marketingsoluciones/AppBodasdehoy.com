
import { FC, useEffect, useState } from "react";
import { fetchApiBodas, fetchApiEventos, fetchApiEventosServer, queries } from "../../utils/Fetching";
import { Event } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { defaultImagenes } from "../../components/Home/Card";
import { TaskNew } from "../../components/Servicios/VistaTarjeta/TaskNew";
import { openGraphData } from "../_app";
import { AuthContextProvider } from "../../context/AuthContext";
import { EventContextProvider } from "../../context";
import { TempPastedAndDropFile } from "../../components/Itinerario/MicroComponente/ItineraryPanel";
import { useRouter } from "next/router";

interface props {
  evento: Event
  users: any
  slug?: any
  query?: any
  error?: string
}

const Slug: FC<props> = (props) => {
  console.log("propsnew", props)

  // Manejar error de getServerSideProps
  if (props?.error) {
    return (
      <div className="bg-[#ffbfbf] text-red-700 w-full h-full text-center mt-20">
        <h1 className="text-xl font-bold mb-4">Error al cargar la tarjeta</h1>
        <p className="text-sm">Error: {props.error}</p>
        <p className="text-sm mt-2">Por favor, intenta de nuevo más tarde.</p>
      </div>
    )
  }

  if (!props?.evento?.itinerarios_array?.length)
    return (
      <div className="bg-[#ffbfbf] text-blue-700 w-full h-full text-center mt-20">
        Page not found error 404
      </div>
    )
  return (
    <ServicesVew evento={props.evento} />
  )
};
export default Slug;

const ServicesVew = (props) => {

  const router = useRouter()
  const { event, setEvent } = EventContextProvider()
  const { user, setUser, verificationDone } = AuthContextProvider()
  const [tempPastedAndDropFiles, setTempPastedAndDropFiles] = useState<TempPastedAndDropFile[]>([]);

  useEffect(() => {
    if (verificationDone) {
      if (!user?.auth) {
        setUser({ displayName: "anonymous" })
        setEvent({ ...props.evento })
      } else {
        router.push(window.location.href.replace("/public-card", ""))
      }
    }
  }, [verificationDone, props])

  return (
    <section className={` absolute z-[50] w-full h-[calc(100vh-63px)] top-[63px] bg-white`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2- -pr-[1px] md:px-0 gap-4 relative"
      >
        <div className={`bg-white w-full h-14 rounded-xl shadow-lg flex items-center justify-between `}>
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
        <div className="w-full  mt-4">
          <TaskNew
            task={event?.itinerarios_array[0]?.tasks[0]}
            itinerario={event?.itinerarios_array[0]}
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

export async function getServerSideProps(context) {
  const { params, query, req } = context
  try {
    const p = params?.slug[0]?.split("-")
    const evento_id = p?.[1] || query?.event;
    const itinerario_id = p?.[2] || query?.itinerary;

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

    const itinerary = evento.itinerarios_array.find(elem => elem._id === query.itinerary)
    const task = itinerary?.tasks?.find(elem => elem._id === query.task)
    const development = getDevelopment(req.headers.host)

    let users = [];
    if (task?.comments?.length > 0) {
      try {
        users = await fetchApiBodas({
          query: queries?.getUsers,
          variables: { uids: task.comments.filter(elem => !!elem.uid).map(elem => elem.uid) },
          development: !/^\d+$/.test(development) ? development : "champagne-events"
        });
      } catch (error) {
        console.log('Error fetching users:', error);
        users = [];
      }
    }

    const usersMap = users?.map(elem => {
      return {
        uid: elem.uid,
        displayName: elem?.displayName,
        photoURL: elem.photoURL
      }
    })

    evento._id = evento_id
    if (itinerary && task) {
      itinerary.tasks = [task]
      evento.itinerarios_array = [itinerary]
    }
    evento.detalles_compartidos_array = users
    evento.fecha_actualizacion = new Date().toLocaleString()

    if (evento) {
      openGraphData.openGraph.title = `${evento.itinerarios_array[0].tasks[0].descripcion}`
      openGraphData.openGraph.description = ` El Evento ${evento.tipo}, de ${evento.nombre}, ${new Date(parseInt(evento?.itinerarios_array[0].fecha_creacion?.toString() || '0'))?.toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
`
    }
    return {
      props: { ...params, query, evento, users: usersMap },
    };
  } catch (error) {
    console.log(error)
    return {
      props: {
        ...params,
        query,
        evento: null,
        users: null,
        error: error.message || 'Error desconocido'
      },
    };
  }
}

/* ${evento.itinerarios_array[0].tasks[0].tips.replace(/<[^>]*>/g, "").replace(".", ". ")} */

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