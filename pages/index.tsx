import { SetStateAction, useEffect, useState, Dispatch, FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import { CircleBanner, LineaHome } from "../components/icons";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, LoadingContextProvider, } from "../context";
import Card, { handleClickCard } from "../components/Home/Card";
import CardEmpty from "../components/Home/CardEmpty";
import FormCrearEvento from "../components/Forms/FormCrearEvento";
import ModalLeft from "../components/Utils/ModalLeft";
import { useDelayUnmount } from "../utils/Funciones";
import { NextPage } from "next";
import { Event } from "../utils/Interfaces";
import VistaSinCookie from "../pages/vista-sin-cookie"
import { useRouter } from "next/router";
import { useToast } from "../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { TbTableShare } from "react-icons/tb";
import { NextSeo } from 'next-seo';

const Home: NextPage = () => {

  const { user, verificationDone, config, setUser } = AuthContextProvider()
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider()
  const { setEvent } = EventContextProvider()
  const { setLoading } = LoadingContextProvider()
  const [valirQuery, setValirQuery] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(valirQuery, 500);
  const [showEditEvent, setShowEditEvent] = useState<boolean>(false);
  const [valir, setValir] = useState<boolean>(false);
  const router = useRouter()
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const toast = useToast()
  const { t } = useTranslation()

  /*   useEffect(() => {
      if (!isMounted) {
        setIsMounted(true)
      }
      return () => {
        if (isMounted) {
          setIsMounted(false)
        }
      }
    }, [isMounted])
  
    useEffect(() => {
      if (router.query?.c === "true") {
        setValirQuery(true)
      }
    }, [router.query])
  
    useEffect(() => {
      if (showEditEvent && !valirQuery && !valir) {
        setValirQuery(true)
        setValir(true)
      }
      if (showEditEvent && !valirQuery && valir) {
        setShowEditEvent(false)
        setValir(false)
      }
    }, [showEditEvent, valirQuery, valir]) */

  if (verificationDone && eventsGroupDone) {

    if (router?.query?.pAccShas) {
      if (!user || user?.displayName === "guest") {
        router.push(config?.pathLogin ? `${config?.pathLogin}?pAccShas=${router?.query?.pAccShas}` : `/login?pAccShas=${router?.query?.pAccShas}`)
        return <></>
      }
      const data = eventsGroup?.find(elem => elem?._id === router?.query?.pAccShas?.slice(-24))
      if (data) {
        const resp = handleClickCard({ t, final: true, config, data, setEvent, user, setUser, router })
        if (resp) toast("warning", resp)
        return <></>
      }
    }

    if (router?.query?.pGuestEvent) {
      console.log("entro")
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
        <NextSeo
          title="Evento organizador | Bodas de Hoy"
          description="Encuentra toda la información sobre el evento, itinerario y tareas relacionadas."
          canonical="https://testorganizador.bodasdehoy.com"
          openGraph={{
            url: 'https://testorganizador.bodasdehoy.com',
            title: 'Detalles del Evento en bodasdehoy.com',
            description: 'Descubre todos los detalles de este evento especial.',
            images: [       // Images must be in a 1.91:1 ratio.            
              {
                url: 'data:image/jpeg;base64,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', // Reemplaza con la URL de tu imagen
                alt: 'Imagen del evento',
              },
            ],
            site_name: 'Bodas de Hoy',
          }}
        />
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
        <div className="flex-1 h-full flex justify-end items-center px-4 relative" >
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer hidden md:block "
            onClick={() => router.push("/lista-de-mis-eventos")}
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
          const dataSort = group?.data?.sort((a, b) => {
            const dateA = new Date(parseInt(a?.fecha)).getTime();
            const dateB = new Date(parseInt(b?.fecha)).getTime();
            return dateA - dateB;
          });


          return (
            <div key={idx} className={`${isActiveStateSwiper !== idx && "hidden"} mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
              {isActiveStateSwiper == idx ? (
                <>
                  {dataSort.map((evento, idx) => {
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

