
import { FC, useEffect, useState } from "react";
import { fetchApiEventosServer, fetchApiBodasServer, queries } from "../../utils/Fetching";
import { developmentFromRequestHost } from "../../utils/ssrDevelopment";
import { Event } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { defaultImagenes } from "../../components/Home/Card";
import { TaskNew } from "../../components/Servicios/VistaTarjeta/TaskNew";
import { openGraphData } from "../_app";
import { AuthContextProvider } from "../../context/AuthContext";
import { EventContextProvider } from "../../context";
import { TempPastedAndDropFile } from "../../components/Itinerario/MicroComponente/ItineraryPanel";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface props {
  evento: Event | null
  users: any
  slug?: any
  query?: any
  error?: string | null
  development?: string
}

const PublicCardMessage = ({ title, body }: { title: string; body: string }) => (
  <div className="min-h-[60vh] w-full flex flex-col items-center justify-center px-6 py-16 text-center bg-base">
    <h1 className="text-xl font-semibold text-gray-800 mb-3">{title}</h1>
    <p className="text-sm text-gray-600 max-w-md leading-relaxed">{body}</p>
  </div>
)

const Slug: FC<props> = (props) => {
  const { t } = useTranslation()

  if (props?.error) {
    const isSlug = props.error === "invalid-slug"
    const detail =
      typeof props.error === "string" && !isSlug ? props.error : null
    return (
      <PublicCardMessage
        title={isSlug ? t("publicCardInvalidLinkTitle") : t("publicCardLoadErrorTitle")}
        body={
          isSlug
            ? t("publicCardInvalidLinkBody")
            : detail
              ? `${t("publicCardLoadErrorBody")} (${detail})`
              : t("publicCardLoadErrorBody")
        }
      />
    )
  }

  if (!props?.evento?.itinerarios_array?.length) {
    return (
      <PublicCardMessage
        title={t("publicCardUnavailableTitle")}
        body={t("publicCardUnavailableBody")}
      />
    )
  }
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
  const [isMounted, setIsMounted] = useState(false)
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

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
  useEffect(() => {
    setTimeout(() => {
      setValidated(true)
    }, 1000);
  }, [isMounted])

  return (
    validated &&
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
              src={event?.imgEvento ? `https://apiapp.bodasdehoy.com/${event.imgEvento.i320}` : defaultImagenes[event?.tipo?.toLowerCase()]}
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
          {isMounted && <TaskNew
            task={event?.itinerarios_array[0]?.tasks[0]}
            itinerario={event?.itinerarios_array[0]}
            view={"cards"}
            isTaskPublic={true}
            onClick={() => { }}
            tempPastedAndDropFiles={tempPastedAndDropFiles}
            setTempPastedAndDropFiles={setTempPastedAndDropFiles}
          />}
        </div>
        {/* Enlace discreto al buscador de mesa */}
        {event?._id && (
          <div className="flex justify-center mt-6 mb-2">
            <a
              href={`/buscador-mesa/${event._id}`}
              className="text-xs text-gray-400 hover:text-primary transition-colors underline underline-offset-2"
            >
              ¿En qué mesa estoy?
            </a>
          </div>
        )}
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
  const development = developmentFromRequestHost(req?.headers?.host)
  let error_2 = null
  try {
    const slug0 = params?.slug?.[0]
    const p = slug0?.split("-")
    const evento_id = p?.[1] || query?.event
    const itinerario_id = p?.[2] || query?.itinerary

    if (!evento_id || !itinerario_id) {
      return {
        props: {
          evento: null,
          users: [],
          query: query || {},
          slug: params?.slug ?? null,
          error: "invalid-slug",
          development,
        },
      }
    }

    let evento: Event | null = null;
    try {
      const data = await fetchApiEventosServer({
        query: queries.getItinerario,
        variables: {
          evento_id,
          itinerario_id
        },
        development,
      });
      evento = data.getItinerario;
    } catch (error) {
      try {
        evento = await fetchApiEventosServer({
          query: queries.getItinerario,
          variables: {
            evento_id,
            itinerario_id
          },
          development,
        }) as any;
      } catch (error2) {
        throw error2;
      }
    }

    if (!evento || !Array.isArray(evento.itinerarios_array) || !evento.itinerarios_array.length) {
      return {
        props: {
          evento: null,
          users: [],
          query: query || {},
          slug: params?.slug ?? null,
          development,
        },
      }
    }

    const itinerary = evento.itinerarios_array.find((elem) => elem._id === query?.itinerary)
    const task = itinerary?.tasks?.find((elem) => elem._id === query?.task)

    let users = [];
    if (task?.comments?.length > 0) {
      try {
        const data = await fetchApiBodasServer({
          query: queries?.getUsers,
          variables: { uids: task.comments.filter(elem => !!elem.uid).map(elem => elem.uid) },
          development,
        });
        users = Array.isArray(data?.getUsers) ? data.getUsers : [];
      } catch (error) {
        try {
          error_2 = error
          const dataRetry = await fetchApiBodasServer({
            query: queries?.getUsers,
            variables: { uids: task.comments.filter(elem => !!elem.uid).map(elem => elem.uid) },
            development,
          });
          users = Array.isArray(dataRetry?.getUsers) ? dataRetry.getUsers : [];
        } catch (error2) {
          error_2 = error2
          users = [];
        }
      }
    }
    const usersList = Array.isArray(users) ? users : []
    const usersMap = usersList.map((elem) => {
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
    evento.detalles_compartidos_array = usersList
    evento.fecha_actualizacion = new Date().toLocaleString()
    const firstTask = evento.itinerarios_array?.[0]?.tasks?.[0]
    if (firstTask?.descripcion) {
      openGraphData.openGraph.title = `${firstTask.descripcion}`
      openGraphData.openGraph.description = ` El Evento ${evento.tipo}, de ${evento.nombre}, ${new Date(parseInt(evento?.itinerarios_array[0].fecha_creacion?.toString() || '0'))?.toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
`
    }

    const props: any = { query: query || {}, evento, users: usersMap, development, slug: params?.slug ?? null };
    if (error_2 !== null) {
      props.error_2 =
        error_2 instanceof Error ? error_2.message : typeof error_2 === "string" ? error_2 : String(error_2)
    }

    return { props };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "unknown-error"
    const props: any = {
      query: query || {},
      evento: null,
      users: null,
      error: message,
      development,
      slug: params?.slug ?? null,
    }
    if (error_2 !== null) {
      props.error_2 =
        error_2 instanceof Error ? error_2.message : typeof error_2 === "string" ? error_2 : String(error_2)
    }
    return { props };
  }
}