import { SetStateAction, useEffect, useState, useRef, Dispatch, FC } from "react";
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
import { useToast } from "../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { TbTableShare } from "react-icons/tb";
import { SelectModeSort } from "../components/Utils/SelectModeSort";
import EventNotFound from "../components/Utils/EventNotFound";

const Home: NextPage = () => {
  const { user, verificationDone, config, setUser } = AuthContextProvider()
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider()
  const { setEvent } = EventContextProvider()
  const { setLoading } = LoadingContextProvider()
  const [valirQuery, setValirQuery] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(valirQuery, 500);
  const [showEditEvent, setShowEditEvent] = useState<boolean>(false);
  const router = useRouter()
  const toast = useToast()
  const { t } = useTranslation()
  const processedRef = useRef<string | null>(null)
  const [eventNotFound, setEventNotFound] = useState<boolean>(false)

  useEffect(() => {
    const pAccShas = router?.query?.pAccShas as string

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
  }, [verificationDone, eventsGroupDone, router?.query?.pAccShas, user, eventsGroup])

  if (verificationDone && eventsGroupDone) {
    // Mostrar componente cuando el evento no se encuentra
    if (router?.query?.pAccShas && eventNotFound) {
      return (
        <EventNotFound 
          onBackToHome={() => {
            setEventNotFound(false)
            processedRef.current = null
          }}
        />
      )
    }
    // Mientras procesa el pAccShas, mostrar pantalla en blanco
    if (router?.query?.pAccShas && !eventNotFound) {
      return <></>
    }
    if (router?.query?.pGuestEvent) {
      router.push(`/confirmar-asistencia?pGuestEvent=${router?.query?.pGuestEvent}`)
    }
    if ((!user || user.displayName === "guest") && ["vivetuboda"].includes(config?.development)) {
      router?.push(`/login`)
      return <></>
    }
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    setLoading(false)
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
        <section id="rootsection" className="section relative w-full flex flex-col">
          <Banner state={valirQuery} set={setValirQuery} />
          <GridCards state={valirQuery} set={setValirQuery} />
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
};
export default Home;


export async function getServerSideProps({ req, res }) {
  return { props: {} };
}

interface propsBanner {
  state: boolean;
  set: Dispatch<SetStateAction<boolean>>;
}
const Banner: FC<propsBanner> = ({ set, state }) => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const { actionModals, setActionModals } = AuthContextProvider()
  const ConditionalAction = () => {
    if (eventsGroup.length >= 100) {
      setActionModals(!actionModals)
    } else {
      set(!state)
    }
  }
  return (
    <div className="banner bg-base w-full flex justify-center h-[48%] md:h-[60%] *md:h-[calc(100%-200px-50px)] min-h-[48%] md:min-h-[400px] px-5 md:px-0 overflow-hidden relative mb-1">
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
    </div>
  );
};

interface propsGridCards {
  state: boolean
  set: Dispatch<SetStateAction<boolean>>
}

type dataTab = {
  status: string
  data: Event[]
  vacio: number[]
}

export const Lista = [
  { nombre: "Pendientes", value: "pendiente", color: "tertiary" },
  { nombre: "Archivados", value: "archivado", color: "gray-300" },
  { nombre: "Realizados", value: "realizado", color: "secondary" },
];

const GridCards: FC<propsGridCards> = ({ state, set: setNewEvent }) => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const { idxGroupEvent, setIdxGroupEvent } = EventContextProvider()
  const [isActiveStateSwiper, setIsActiveStateSwiper] = useState<number>(idxGroupEvent?.isActiveStateSwiper)
  const [tabsGroup, setTabsGroup] = useState<dataTab[]>([]);
  const [idxNew, setIdxNew] = useState<number>(-2)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderAndDirection, setOrderAndDirection] = useState<SelectModeSortType>()

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
        acc[event?.estatus?.toLowerCase()]?.push(event)
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
    setIdxNew(tabsGroup[isActiveStateSwiper]?.data.findIndex(elem => elem._id == idxGroupEvent.event_id))
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

  return (
    <div className="flex flex-col max-h-[calc(52%-4px)]">
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
        {tabsGroup.map((group, idx) => {
          group?.data?.sort((a, b) => {
            if (orderAndDirection.order === "fecha") {
              const dateA = new Date(parseInt(a?.fecha)).getTime();
              const dateB = new Date(parseInt(b?.fecha)).getTime();
              return orderAndDirection.direction === "asc" ? dateA - dateB : dateB - dateA;
            }
            if (orderAndDirection.order === "nombre") {
              return orderAndDirection.direction === "asc" ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
            }
          });
          return (
            <div key={idx} className={`${isActiveStateSwiper !== idx && "hidden"} mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
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

