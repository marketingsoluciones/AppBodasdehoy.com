
import { FC, useEffect, useMemo, useState } from "react";
import { fetchApiEventos, fetchApiEventosServer, queries } from "../../utils/Fetching";
import { developmentFromRequestHost } from "../../utils/ssrDevelopment";
import { Event, Task } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { AuthContextProvider, EventContextProvider } from "../../context";
import { defaultImagenes } from "../../components/Home/Card";
import { TaskNew } from "../../components/Servicios/VistaTarjeta/TaskNew";
import { TimeZone } from "../../components/icons";
import { getTimeZoneCity } from "../../utils/FormatTime";
import { useTranslation } from "react-i18next";
import { BsCalendarPlus } from "react-icons/bs";
import { NextSeo } from "next-seo";
import { resolveApiAppBaseUrl } from '@bodasdehoy/shared/utils';

interface props {
  evento: Event | null
  slug?: string[] | null
  /** Código o mensaje serializable desde getServerSideProps */
  error?: string | null
}

interface TaskReduce {
  fecha: number
  tasks?: Task[]
}

const apiAppImgBase = resolveApiAppBaseUrl();

const PublicItineraryUnavailable = ({ title, body }: { title: string; body: string }) => (
  <div className="min-h-[60vh] w-full flex flex-col items-center justify-center px-6 py-16 text-center bg-base">
    <h1 className="text-xl font-semibold text-gray-800 mb-3">{title}</h1>
    <p className="text-sm text-gray-600 max-w-md leading-relaxed">{body}</p>
    <p className="mt-6 text-xs text-gray-400">Si el enlace lo compartió el organizador, pídele que lo vuelva a enviar.</p>
  </div>
)

const Slug: FC<props> = (props) => {
  const { event, setEvent } = EventContextProvider()
  const { config } = AuthContextProvider()
  const [end, setEnd] = useState(false)
  const [tasksReduce, setTasksReduce] = useState<TaskReduce[]>()
  const { t } = useTranslation()
  const hasError = Boolean(props?.error)
  const isSlug = props.error === "invalid-slug"

  /** Si eventsGroup está vacío (invitado en ruta pública), EventContext hace setEvent(null) al cambiar user; no perder el SSR. */
  const effectiveEvent = useMemo(() => {
    if (event?.itinerarios_array?.length) return event
    if (props.evento?.itinerarios_array?.length) return props.evento
    return null
  }, [event, props.evento])

  const seoTitle =
    (effectiveEvent?.itinerarios_array?.[0]?.title as any) || "Itinerario"
  const seoDescription = effectiveEvent?.nombre
    ? `Mira el itinerario del evento ${effectiveEvent.nombre} y no te pierdas de nada`
    : "Itinerario público"

  const slugParts = props?.slug?.[0]?.split("-") || []
  const eventId = slugParts[1]
  const itinerarioId = slugParts[2]

  useEffect(() => {
    if (hasError) return
    const ev = props?.evento
    if (!ev?.itinerarios_array?.[0]) return
    const it0 = ev.itinerarios_array[0]
    const tasks = (it0.tasks || []).filter((task) => task.spectatorView === true)
    setEvent({
      ...ev,
      itinerarios_array: [{ ...it0, tasks }, ...ev.itinerarios_array.slice(1)],
    })
  }, [hasError, props.evento, setEvent])

  useEffect(() => {
    setTimeout(() => {
      setEnd(true)
    }, 2000);
  }, [])

  useEffect(() => {
    if (hasError) return
    const ev = effectiveEvent
    if (ev?.itinerarios_array?.[0]?.tasks?.length > 0) {
      const tasks = [ev?.itinerarios_array?.[0]?.tasks?.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())]
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
  }, [effectiveEvent, hasError])

  if (hasError) {
    return (
      <>
        <NextSeo title={seoTitle} description={seoDescription} openGraph={{ title: seoTitle, description: seoDescription }} />
        <PublicItineraryUnavailable
          title={isSlug ? t("publicItineraryInvalidLinkTitle") : t("publicItineraryLoadErrorTitle")}
          body={isSlug ? t("publicItineraryInvalidLinkBody") : t("publicItineraryLoadErrorBody")}
        />
      </>
    )
  }

  if (!props?.evento?.itinerarios_array?.length) {
    return (
      <>
        <NextSeo title={seoTitle} description={seoDescription} openGraph={{ title: seoTitle, description: seoDescription }} />
        <PublicItineraryUnavailable
          title="Itinerario no disponible"
          body="No encontramos un itinerario público con este enlace. Puede haberse despublicado, el evento haber cambiado o el enlace ser antiguo."
        />
      </>
    )
  }

  return (
    <>{
      effectiveEvent &&
      <section className={"absolute z-[50] w-full h-[100vh] top-0 bg-white"}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[10px] md:px-0 gap-4 relative">
          <div className={`w-full h-14 rounded-xl shadow-lg flex items-center`}>
            <div className='flex flex-1 flex-col px-2 md:px-6 font-display'>
              <div className='flex flex-col'>
                <span className='md:hidden capitalize text-primary text-[12px] leading-[12px]'>{effectiveEvent?.tipo}</span>
                <span className='md:hidden capitalize text-gray-600 text-[12px] leading-[12px] font-medium line-clamp-2'>{effectiveEvent?.nombre}</span>
              </div>
            </div>
            {eventId && itinerarioId && (
              <a
                href={`/api/ical/${eventId}/${itinerarioId}`}
                download={`itinerario-${itinerarioId}.ics`}
                title={t('Añadir al calendario')}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 mx-2 flex-shrink-0"
              >
                <BsCalendarPlus className="w-4 h-4 text-primary" />
              </a>
            )}
            <div className='flex min-w-min px-4 md:px-8'>
              <div className="text-gray-600 flex flex-col justify-center items-center">
                <div className="flex justify-center space-x-0.5 w-full">
                  <TimeZone />
                  <span className="text-[11px]">{t("timeZone")}</span>
                </div>
                <span className="text-xs">{getTimeZoneCity(effectiveEvent?.timeZone) || getTimeZoneCity(config?.timeZone)}</span>
              </div>
            </div>
            <div className='md:flex-none h-[100%] flex flex-row-reverse md:flex-row items-center '>
              <img
                src={effectiveEvent?.imgEvento ? `${apiAppImgBase}/${effectiveEvent?.imgEvento?.i800}` : defaultImagenes[effectiveEvent?.tipo?.toLowerCase()]}
                className="h-[90%] object-cover object-top rounded-md border-1 border-gray-600 block"
                alt={effectiveEvent?.nombre}
              />
              <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2 leading-3'>
                <span className='text-sm text-primary text-[12px] first-letter:capitalize'>{effectiveEvent?.tipo}</span>
                <span className='uppercase w-64 leading-[14px] line-clamp-2'>{effectiveEvent?.nombre}</span>
              </div>
            </div>
          </div>
          <div className="w-full px-4 md:px-10 py-4" >
            <div className="flex flex-col justify-center items-center">
              <span className="text-3xl md:text-[40px] font-title text-primary">{effectiveEvent?.itinerarios_array?.[0]?.title}</span>
              <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
            </div>
          </div >
          {tasksReduce?.map((el, i) =>
            <div key={i} className="w-full mt-4">
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
                    itinerario={effectiveEvent?.itinerarios_array?.[0]}
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


export async function getServerSideProps({ params, req }) {
  try {
    const p = params?.slug?.[0]?.split("-")
    const evento_id = p[1]
    const itinerario_id = p[2]
    if (!evento_id || !itinerario_id) {
      return {
        props: {
          evento: null,
          slug: params?.slug || null,
          error: "invalid-slug",
        },
      };
    }
    const development = developmentFromRequestHost(req?.headers?.host)
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
    }
    return {
      props: {
        evento,
        slug: params.slug || null,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "unknown-error"
    return {
      props: {
        evento: null,
        slug: params.slug || null,
        error: message,
      },
    };
  }
}
