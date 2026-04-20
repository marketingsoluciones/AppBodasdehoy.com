import { SetStateAction, useEffect, useState, useRef, Dispatch, FC, useMemo } from "react";
import { motion } from "framer-motion";
import { LineaHome } from "../components/icons";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, LoadingContextProvider, } from "../context";
import Card, { handleClickCard } from "../components/Home/Card";
import CardEmpty from "../components/Home/CardEmpty";
import FormCrearEvento from "../components/Forms/FormCrearEvento";
import ModalLeft from "../components/Utils/ModalLeft";
import { useDelayUnmount } from "../utils/Funciones";
import { NextPage } from "next";
import { Event, SelectModeSortType } from "../utils/Interfaces";
import VistaSinCookie from "../pages/vista-sin-cookie"
import { useRouter } from "next/router";
import Link from "next/link";
import { useToast } from "../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { TbTableShare } from "react-icons/tb";
import { SelectModeSort } from "../components/Utils/SelectModeSort";
import EventNotFound from "../components/Utils/EventNotFound";
import CopilotFilterBar from "../components/Utils/CopilotFilterBar";

const Home: NextPage = () => {
  const { user, verificationDone, config, setUser } = AuthContextProvider()
  const { eventsGroup, eventsGroupDone, eventsGroupError, eventsGroupErrorMessage, eventsGroupSessionExpired, refreshEventsGroup } = EventsGroupContextProvider()
  const { setEvent } = EventContextProvider()
  const loadingContext = LoadingContextProvider()
  const setLoading = loadingContext?.setLoading || (() => {}) // Safe fallback
  const [valirQuery, setValirQuery] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(valirQuery, 500);
  const [showEditEvent, setShowEditEvent] = useState<boolean>(false);
  const [showGuestRegisterModal, setShowGuestRegisterModal] = useState(false);
  const prevEventsLengthRef = useRef<number>(0);
  const router = useRouter()
  const toast = useToast()
  const { t } = useTranslation()
  const processedRef = useRef<string | null>(null)
  const [eventNotFound, setEventNotFound] = useState<boolean>(false)
  const eventsLoadStartRef = useRef<number | null>(null)
  const [eventsLoadSeconds, setEventsLoadSeconds] = useState(0)

  // Query params usando router.query (Pages Router)
  const pAccShas = typeof router.query.pAccShas === 'string' ? router.query.pAccShas : null
  const pGuestEvent = typeof router.query.pGuestEvent === 'string' ? router.query.pGuestEvent : null

  // Mover setLoading fuera del render para evitar "Cannot update a component while rendering"
  useEffect(() => {
    if (verificationDone && eventsGroupDone && user && user.displayName !== "guest" && !pAccShas) {
      setLoading(false)
    }
  }, [verificationDone, eventsGroupDone, user, pAccShas, setLoading])

  // Cronómetro mientras se esperan eventos (esta vista no monta el banner hasta pasar esta fase).
  const waitingEventsList = verificationDone && !eventsGroupDone
  useEffect(() => {
    if (!waitingEventsList) {
      eventsLoadStartRef.current = null
      setEventsLoadSeconds(0)
      return
    }
    if (eventsLoadStartRef.current === null) eventsLoadStartRef.current = Date.now()
    const id = window.setInterval(() => {
      setEventsLoadSeconds(Math.floor((Date.now() - (eventsLoadStartRef.current ?? Date.now())) / 1000))
    }, 400)
    return () => clearInterval(id)
  }, [waitingEventsList])

  // Mostrar error si la API de eventos falla (403 = sesión; 502/503 = servidor; otro = genérico).
  // No mostrar si no hay usuario logueado (usuario libre/guest): no se cargan eventos, no tiene sentido el mensaje.
  useEffect(() => {
    if (eventsGroupError && user && user.displayName !== "guest") {
      const message = eventsGroupErrorMessage || t("Error al cargar los eventos. El servidor no responde, inténtalo de nuevo en unos minutos.")
      toast("error", message)
    }
  }, [eventsGroupError, eventsGroupErrorMessage, user])

  // Detectar cuando un guest crea su primer evento → mostrar modal de registro
  useEffect(() => {
    const currentLength = eventsGroup?.length ?? 0
    const isGuest = user?.displayName === 'guest'
    if (isGuest && prevEventsLengthRef.current === 0 && currentLength > 0) {
      setShowGuestRegisterModal(true)
    }
    prevEventsLengthRef.current = currentLength
  }, [eventsGroup, user])

  useEffect(() => {
    if (verificationDone && eventsGroupDone && pAccShas && processedRef.current !== pAccShas) {
      if (!user || user?.displayName === "guest") {
        router.push(config?.pathLogin ? `${config?.pathLogin}?pAccShas=${pAccShas}` : `/login?pAccShas=${pAccShas}`)
        return
      }
      const data = eventsGroup?.find(elem => elem?._id === pAccShas?.slice(-24))
      if (data) {
        processedRef.current = pAccShas
        setEventNotFound(false)
        handleClickCard({ t, final: true, config, data, setEvent, user, setUser, router })
          .then((resp) => {
            if (resp) toast("warning", resp)
          })
          .catch((error) => {
            console.error("Error en handleClickCard:", error)
            toast("error", t("Ha ocurrido un error"))
          })
      } else {
        // Evento no encontrado
        processedRef.current = pAccShas
        setEventNotFound(true)
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationDone, eventsGroupDone, pAccShas, user, eventsGroup, router])

  // Sin usuario: rutas protegidas → VistaSinCookie. En "/" la portada visitante no debe quedar en spinner infinito.
  if (verificationDone && !user && router.pathname !== "/") {
    return <VistaSinCookie />;
  }
  
  // Si hay usuario pero aún no se han cargado los eventos, mostrar loading
  // Esto evita mostrar VistaSinCookie cuando el usuario acaba de hacer login
  if (!verificationDone || !eventsGroupDone) {
    // Si hay usuario, mostrar loading (está cargando eventos)
    // Si no hay usuario, ya se maneja arriba con VistaSinCookie
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
          <p className="text-sm font-medium text-gray-700">Cargando tus eventos…</p>
          <p className="text-2xl font-semibold tabular-nums text-primary">{eventsLoadSeconds}s</p>
          <p className="text-xs text-gray-400">
            Aquí se consulta el servidor de datos; la imagen del banner aún no entra en juego.
          </p>
        </div>
      </div>
    );
  }

  if (verificationDone && eventsGroupDone) {
    // Mostrar componente cuando el evento no se encuentra
    if (pAccShas && eventNotFound) {
      return (
        <EventNotFound
          onBackToHome={() => {
            setEventNotFound(false)
            processedRef.current = null
          }}
        />
      )
    }
    // Mientras procesa el pAccShas, mostrar loading
    if (pAccShas && !eventNotFound) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        </div>
      )
    }
    if (pGuestEvent) {
      router.push(`/confirmar-asistencia?pGuestEvent=${pGuestEvent}`)
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        </div>
      )
    }
    if ((!user || user.displayName === "guest") && ["vivetuboda"].includes(config?.development)) {
      router?.push(`/login`)
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        </div>
      )
    }
    if (!user) {
      if (router.pathname === "/") {
        return (
          <>
            {shouldRenderChild && (
              <ModalLeft state={valirQuery} set={setValirQuery}>
                <FormCrearEvento state={valirQuery} set={setValirQuery} />
              </ModalLeft>
            )}
            <LandingVisitante onCreateEvent={() => setValirQuery(true)} />
          </>
        );
      }
      return <VistaSinCookie />;
    }
    // NOTA: setLoading se movió a useEffect para evitar setState durante render
    return (
      <>
        {shouldRenderChild && (
          <ModalLeft state={valirQuery} set={setValirQuery}>
            {showEditEvent ?
              <FormCrearEvento state={valirQuery} set={setValirQuery} EditEvent={showEditEvent} />
              : <FormCrearEvento state={valirQuery} set={setValirQuery} />
            }
          </ModalLeft>
        )}

        {/* Modal de conversión para guests — aparece tras crear el primer evento */}
        {showGuestRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center gap-4 text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="font-display text-xl font-semibold text-gray-800">
                ¡Tu evento está listo!
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Has creado tu evento. <strong>Regístrate gratis</strong> para guardarlo de forma permanente, gestionar invitados, presupuesto e itinerario, y usar el asistente IA.
              </p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <a
                  href={config?.pathLogin ? `${config.pathLogin}?q=register` : '/login?q=register'}
                  className="w-full py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition text-center"
                >
                  Crear cuenta gratis
                </a>
                <button
                  onClick={() => setShowGuestRegisterModal(false)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Continuar como invitado (perderás los datos al cerrar)
                </button>
              </div>
            </div>
          </div>
        )}

        <section id="rootsection" className="section relative w-full flex flex-col">
          <Banner state={valirQuery} set={setValirQuery} />
          <GridCards
            state={valirQuery}
            set={setValirQuery}
            eventsGroupError={eventsGroupError}
            eventsGroupErrorMessage={eventsGroupErrorMessage}
            eventsGroupSessionExpired={eventsGroupSessionExpired}
            refreshEventsGroup={refreshEventsGroup}
          />
        </section>
        <style jsx>
          {`
            .section {
              height: calc(100vh - 144px);
            }
          `}
        </style>
      </>
    );
  }
  
  // ✅ CORRECCIÓN CRÍTICA: SIEMPRE retornar contenido válido para evitar 404
  // Mientras se cargan los datos, mostrar loading con contenido HTML válido
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white px-4">
      <div className="flex flex-col items-center gap-3 text-center max-w-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        <p className="text-sm font-medium text-gray-700">Cargando tus eventos…</p>
        <p className="text-2xl font-semibold tabular-nums text-primary">{eventsLoadSeconds}s</p>
        <p className="text-xs text-gray-400">
          Consultando el servidor; el banner de portada se pinta en el siguiente paso.
        </p>
      </div>
    </div>
  );
};

export default Home;



interface propsBanner {
  state: boolean;
  set: Dispatch<SetStateAction<boolean>>;
}
const Banner: FC<propsBanner> = ({ set, state }) => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const { actionModals, setActionModals } = AuthContextProvider()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Dynamic import to avoid SSR issues
  const [planLimits, setPlanLimits] = useState<any>(null)
  useEffect(() => {
    import('../hooks/usePlanLimits').then(() => {})
  }, [])

  const ConditionalAction = () => {
    // Use plan-based limit if available, fallback to legacy 100
    const limit = planLimits?.eventLimit ?? 100
    if (eventsGroup.length >= limit) {
      setShowUpgradeModal(true)
    } else {
      set(!state)
    }
  }
  return (
    <div className="banner bg-base w-full flex justify-center h-[48%] md:h-[60%] min-h-[48%] md:min-h-[400px] px-5 md:px-0 overflow-hidden relative mb-1">
      <div className="md:max-w-screen-lg 2xl:max-w-screen-xl w-full grid md:grid-cols-5 h-full">
        <div className="flex flex-col justify-center relative py-10 md:py-0 col-span-2">
          <h2 className="font-display font-medium text-2xl md:text-5xl tracking-tight	text-primary mb-1.5">
            {t("organizeyourevents")}
          </h2>
          <h3 className="font-display font-medium text-1xl md:text-3xl tracking-tight	text-gray-500 mb-1.5">
            {t("sharecollaborateinvite")}
          </h3>
          <h1 className="font-display font-base text-md tracking-tight text-primary">
            {t("planyourcelebrations") + " "} <span className="font-semibold">{t("sin estres")}</span>
          </h1>
          <span className="flex gap-2 justify-start items-end">
            <button
              onClick={() => ConditionalAction()}
              className="mt-4 bg-primary font-display font-medium text-white px-5 md:px-24 py-2 rounded-lg  box-border hover:bg-gray-200 transition focus:outline-none z-20"
            >
              {t("createanevent")}
            </button>
          </span>
          <LineaHome className="hidden md:flex md:-bottom-10 xl:-bottom-5 absolute z-10 left-0 w-max" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden md:block relative overflow-hidden col-span-3"
        >
          {/* <CircleBanner className="w-full h-auto top-12 transform translate-y-1/6 absolute bottom-0 right-0 left-2 z-0" /> */}
          <img
            className="z-20 image mx-auto inset-x-0 relative top-16"
            src="/IndexImg2.png"
            alt=""
            width={520}
            height={500}
            decoding="async"
            fetchPriority="low"
          />
        </motion.div>
      </div>

      <style jsx>
        {`
          .circle {
            height: 600px;
            width: 600px;
          }
          .image {
            height: 500px;
          }

          @media only screen and (min-width: 1536px) {
            .image {
              height: 500px;

            }
          }
        `}
      </style>

      {/* Plan upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-4xl">🎉</div>
            <h2 className="font-display text-xl font-semibold text-gray-800">
              Has llegado al límite de eventos
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {planLimits?.upgradeMessage?.('events-count') || 'Actualiza tu plan para crear más eventos.'}
            </p>
            <div className="flex flex-col gap-2 w-full mt-2">
              <Link
                href="/facturacion"
                className="w-full py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition text-center"
              >
                Ver planes
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface propsGridCards {
  state: boolean
  set: Dispatch<SetStateAction<boolean>>
  eventsGroupError: boolean
  eventsGroupErrorMessage: string | null
  eventsGroupSessionExpired: boolean
  refreshEventsGroup: () => void
}

type dataTab = {
  status: string
  data: Event[]
  vacio: number[]
}

export const Lista = [
  { nombre: "Pendientes", value: "pendiente", color: "primary" },
  { nombre: "Archivados", value: "archivado", color: "gray-300" },
  { nombre: "Realizados", value: "realizado", color: "secondary" },
];

const GridCards: FC<propsGridCards> = ({
  state,
  set: setNewEvent,
  eventsGroupError,
  eventsGroupErrorMessage,
  eventsGroupSessionExpired,
  refreshEventsGroup,
}) => {
  const { t } = useTranslation();
  const { eventsGroup, copilotFilter } = EventsGroupContextProvider();
  const { idxGroupEvent, setIdxGroupEvent } = EventContextProvider()
  const [isActiveStateSwiper, setIsActiveStateSwiper] = useState<number>(idxGroupEvent?.isActiveStateSwiper)
  const [tabsGroup, setTabsGroup] = useState<dataTab[]>([]);
  const [idxNew, setIdxNew] = useState<number>(-2)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderAndDirection, setOrderAndDirection] = useState<SelectModeSortType>({ order: "fecha", direction: "desc" })

  const handleMouseEnter = () => {
    setIsModalVisible(true);
  };
  const router = useRouter()

  const handleMouseLeave = () => {
    setIsModalVisible(false);
  };
  useEffect(() => {
    if (eventsGroup) {
      const arrNuevo = eventsGroup?.reduce((acc, event) => {
        const raw = event?.estatus != null && String(event.estatus).trim() !== ''
          ? String(event.estatus).toLowerCase().trim()
          : '';
        const bucket =
          raw === 'archivado' || raw === 'realizado' || raw === 'pendiente' ? raw : 'pendiente';
        acc[bucket]?.push(event);
        return acc;
      },
        { pendiente: [], archivado: [], realizado: [] }
      );

      const countEmptys = (arr) => {
        if (arr.length < 3) {
          const NewArr = [];
          for (let i = 0; i < Math.abs(arr?.length - 3); i++) NewArr.push(i);
          return NewArr;
        }
        return [];
      };

      const result: dataTab[] = Object.entries(arrNuevo).map((eventos: any[]) => {
        const events = eventos[1]
        const eventsSort = events?.sort((a: any, b: any) => {
          const aNew = a.fecha_creacion.length < 16 ? parseInt(a.fecha_creacion) : new Date(a.fecha_creacion).getTime()
          const bNew = b.fecha_creacion.length < 16 ? parseInt(b.fecha_creacion) : new Date(b.fecha_creacion).getTime()
          return bNew - aNew
        })
        return ({
          status: eventos[0],
          data: eventsSort,
          vacio: countEmptys(eventos[1]),
        })
      });
      setTabsGroup(result);
    }
  }, [eventsGroup, idxGroupEvent]);

  useEffect(() => {
    setIdxNew(
      tabsGroup[isActiveStateSwiper]?.data?.findIndex((elem) => elem != null && elem._id == idxGroupEvent.event_id) ?? -1,
    )
  }, [tabsGroup])

  useEffect(() => {
    if (idxNew > -1) {
      setTimeout(() => {
        setIdxGroupEvent((old: any) => {
          return { ...old, idx: idxNew }
        })
      }, 10);
    }
  }, [idxNew])

  // Aplicar filtro del Copilot cuando entity === 'events'
  const displayedTabsGroup = useMemo(() => {
    if (!copilotFilter || copilotFilter.entity !== 'events' || !copilotFilter.ids?.length) {
      return tabsGroup;
    }
    const idSet = new Set(copilotFilter.ids);
    return tabsGroup.map(group => ({
      ...group,
      data: group.data.filter(e => idSet.has(e._id)),
      vacio: [],
    }));
  }, [tabsGroup, copilotFilter]);

  return (
    <div className="flex flex-col max-h-[calc(52%-4px)]">
      {eventsGroupError && !eventsGroupSessionExpired && (
        <div
          role="alert"
          className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold">{t("home_eventsLoadFailedTitle")}</p>
            <p className="text-xs text-red-800/90 mt-0.5">
              {eventsGroupErrorMessage || t("home_eventsLoadFailedBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refreshEventsGroup()}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition"
          >
            {t("home_eventsLoadFailedRetry")}
          </button>
        </div>
      )}
      <CopilotFilterBar entity="events" className="mx-4" />
      <div className="w-full h-10 flex">
        <div className="flex-1" />
        <div className="inline-flex gap-4 py-2">
          {Lista.map((item, idx) => (
            <button
              onClick={(e) => setIsActiveStateSwiper(idx)}
              key={idx}
              className={`${isActiveStateSwiper == idx ? `bg-${item.color} text-white` : "bg-white text-gray-500"} w-max px-4 py-0.5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-${item.color} hover:text-gray-500 transition focus:outline-none text-sm font-display`}
            >
              {t(item.nombre)}
            </button>
          ))}
        </div>
        <div className="flex-1 h-full flex justify-end items-center px-4 relative space-x-4" >
          <SelectModeSort value={orderAndDirection} setValue={setOrderAndDirection} />
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer hidden md:block "
            onClick={() => router.push("/eventos")}
          >
            <TbTableShare className="h-5 w-5 text-gray-700 hover:text-gray-900" />
            {isModalVisible && (
              <div className="modal absolute w-36 z-50 text-[10px] px-[5px] bg-gray-500 text-white rounded-md -translate-x-full flex justify-center">
                Cambiar a vista de tabla
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-1 overflow-x-scroll md:overflow-clip">
        {displayedTabsGroup.map((group, idx) => {
          if (orderAndDirection?.order) {
            group?.data?.sort((a, b) => {
              if (orderAndDirection.order === "fecha") {
                const dateA = new Date(parseInt(a?.fecha)).getTime();
                const dateB = new Date(parseInt(b?.fecha)).getTime();
                return orderAndDirection.direction === "asc" ? dateA - dateB : dateB - dateA;
              }
              if (orderAndDirection.order === "nombre") {
                return orderAndDirection.direction === "asc" ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
              }
              return 0;
            });
          }
          return (
            <div key={idx} className={`${isActiveStateSwiper !== idx && "hidden"} mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-3`}>
              {isActiveStateSwiper == idx ? (
                <>
                  {group?.data?.map((evento, idx) => {
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-center my-3"
                        onClick={() => { setIdxGroupEvent({ idx, isActiveStateSwiper, event_id: evento._id }) }}
                      >
                        <Card data={group.data} grupoStatus={group.status} idx={idx} />
                      </div>
                    )
                  })}
                  {group.status !== "pendiente"
                    ? group.data?.length === 0 && <div className={`flex items-center justify-center my-3`} >
                      <div className={`w-72 h-36 rounded-xl flex flex-col items-center justify-center shadow-lg bg-base border border-gray-100 transition`}>
                        <p className="font-display font-base text-md">{t(`Ningún evento ${group.status}`)}</p>
                      </div>
                    </div>
                    : <div
                      className={`flex items-center justify-center my-3 `}
                    >
                      <CardEmpty state={state} set={setNewEvent} />
                    </div>
                  }
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </div >
  );
};

/** Landing comercial multimarca para visitantes no logueados */
const LandingVisitante: FC<{ onCreateEvent: () => void }> = ({ onCreateEvent }) => {
  const { config } = AuthContextProvider();
  const { t } = useTranslation();
  const pathLogin = config?.pathLogin || '/login';
  const registerHref = pathLogin.includes('?') ? `${pathLogin}&q=register` : `${pathLogin}?q=register`;

  const features = [
    { icon: '👥', title: t('landing.feat.guests', { defaultValue: 'Gestión de invitados' }), desc: t('landing.feat.guestsDesc', { defaultValue: 'Lista completa, confirmaciones RSVP, acompañantes y control de asistencia' }) },
    { icon: '🪑', title: t('landing.feat.tables', { defaultValue: 'Editor de mesas' }), desc: t('landing.feat.tablesDesc', { defaultValue: 'Organiza mesas visualmente con drag & drop y asignación automática' }) },
    { icon: '💰', title: t('landing.feat.budget', { defaultValue: 'Control de presupuesto' }), desc: t('landing.feat.budgetDesc', { defaultValue: 'Partidas, pagos, proveedores y gráficos en tiempo real' }) },
    { icon: '✉️', title: t('landing.feat.invitations', { defaultValue: 'Invitaciones digitales' }), desc: t('landing.feat.invitationsDesc', { defaultValue: 'Diseña, personaliza y envía por email o WhatsApp' }) },
    { icon: '🎯', title: t('landing.feat.ai', { defaultValue: 'Asistente IA' }), desc: t('landing.feat.aiDesc', { defaultValue: 'Copilot integrado que te ayuda a planificar cada detalle' }) },
    { icon: '🎁', title: t('landing.feat.gifts', { defaultValue: 'Lista de regalos' }), desc: t('landing.feat.giftsDesc', { defaultValue: 'Comparte tu lista con invitados y lleva el control' }) },
  ];

  return (
    <div className="flex flex-col items-center w-full bg-base min-h-[calc(100vh-144px)] overflow-y-auto">
      {/* Hero */}
      <div className="w-full max-w-3xl px-6 pt-12 pb-8 flex flex-col items-center text-center gap-5">
        <div className="w-40 h-16 flex items-center justify-center">
          {config?.logoDirectory}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-gray-800 tracking-tight">
          {t('landing.title', { defaultValue: 'Organiza tus eventos sin estrés' })}
        </h1>
        <p className="text-gray-500 text-base md:text-lg max-w-lg leading-relaxed">
          {t('landing.subtitle', { defaultValue: 'Todo lo que necesitas para planificar tu celebración perfecta, en un solo lugar.' })}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={onCreateEvent}
            className="px-8 py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition"
          >
            {t('landing.cta.try', { defaultValue: 'Probar gratis — crear evento de prueba' })}
          </button>
          <Link
            href={registerHref}
            className="px-8 py-3 rounded-full border border-primary text-primary font-medium text-sm hover:bg-primary hover:text-white transition text-center"
          >
            {t('landing.cta.register', { defaultValue: 'Crear cuenta' })}
          </Link>
        </div>
        <Link href={pathLogin} className="text-xs text-gray-400 hover:text-primary transition">
          {t('landing.cta.login', { defaultValue: 'Ya tengo cuenta — Iniciar sesión' })}
        </Link>
      </div>

      {/* Features grid */}
      <div className="w-full max-w-4xl px-6 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="font-display font-semibold text-gray-800 text-sm">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
