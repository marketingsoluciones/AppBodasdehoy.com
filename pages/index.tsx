import { SetStateAction, useEffect, useState, Dispatch, FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import { CircleBanner, LineaHome } from "../components/icons";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, LoadingContextProvider, } from "../context";
import Card from "../components/Home/Card";
import CardEmpty from "../components/Home/CardEmpty";
import FormCrearEvento from "../components/Forms/FormCrearEvento";
import ModalLeft from "../components/Utils/ModalLeft";
import { useDelayUnmount } from "../utils/Funciones";
import { NextPage } from "next";
import { Event } from "../utils/Interfaces";
import VistaSinCookie from "../pages/vista-sin-cookie"
import { useMounted } from "../hooks/useMounted"
import { useRouter } from "next/router";
import { Modal } from "../components/Utils/Modal";
import { ObtenerFullAcceso } from "../components/InfoApp/ObtenerFullAcceso";

const Home: NextPage = () => {
  const { user, actionModals } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const [valirQuery, setValirQuery] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(valirQuery, 500);
  const [showEditEvent, setShowEditEvent] = useState<boolean>(false);
  const [valir, setValir] = useState<boolean>(false);
  const router = useRouter()
  const [isMounted, setIsMounted] = useState<boolean>(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      setLoading(false)
    }
    return () => {
      if (isMounted) {
        setIsMounted(false)
        setLoading(true)
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
  }, [showEditEvent, valirQuery, valir])

  if (isMounted) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
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
        <section id="rootsection" className="section relative w-full">
          <Banner state={valirQuery} set={setValirQuery} />
          <GridCards state={valirQuery} set={setValirQuery} />
        </section>
        <style jsx>
          {`
                .section {
                  height: calc(100vh - 190px);
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
  const { eventsGroup } = EventsGroupContextProvider();
  const { actionModals, setActionModals } = AuthContextProvider()
  const ConditionalAction = () =>{
    if(eventsGroup.length >= 1 ){
        setActionModals(!actionModals)
    }else{
      set(!state)
    }
  }
  return (
    <div className="banner bg-base w-full flex justify-center h-[60%] md:h-[calc(100%-200px-50px)] md:min-h-[300px] px-5 md:px-0 overflow-hidden relative">
      <div className="md:max-w-screen-lg 2xl:max-w-screen-xl w-full grid md:grid-cols-2 h-full">
        <div className="flex flex-col justify-center relative py-10 md:py-0">
          <h2 className="font-display font-medium text-5xl md:text-6xl tracking-tight	text-gray-500">
            ¡Hola!
          </h2>
          <h1 className="font-display font-base text-xl md:text-2xl tracking-tight text-primary">
            empecemos a organizar tu evento
          </h1>
          <span className="flex gap-2 justify-center items-end">
            <button
              onClick={() => ConditionalAction()}
              className="mt-4 bg-primary font-display font-medium text-white px-24 py-3 rounded-lg  box-border hover:bg-gray-200 transition focus:outline-none z-20"
            >
              Crear un evento
            </button>
          </span>
          <LineaHome className="hidden md:flex md:-bottom-10 xl:-bottom-5 absolute z-10 left-0 w-max" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden md:block relative overflow-hidden"
        >
          <CircleBanner className="w-full h-auto top-10 transform translate-y-1/6 absolute bottom-0 right-0 z-0" />
          <img
            className="z-20 image mx-auto inset-x-0 relative"
            src="/MujerPrincipal.webp"
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
              height: 800px;
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
  const { eventsGroup } = EventsGroupContextProvider();
  const { idxGroupEvent, setIdxGroupEvent } = EventContextProvider()
  const [isActiveStateSwiper, setIsActiveStateSwiper] = useState<number>(idxGroupEvent?.isActiveStateSwiper)
  const [tabsGroup, setTabsGroup] = useState<dataTab[]>([]);
  const [idxNew, setIdxNew] = useState<number>(-2)

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
    <>
      <div className="bg-white w-full flex flex-col h-[40%] md:h-[200px] justify-center items-center max-w-screen-lg xl:max-w-screen-xl inset-x-0 mx-auto">
        <div className="flex gap-4 mt-[100%]">
          {Lista.map((item, idx) => (
            <button
              onClick={(e) => setIsActiveStateSwiper(idx)}
              key={idx}
              className={`${isActiveStateSwiper == idx
                ? `bg-${item.color} text-white`
                : "bg-white text-gray-500"
                } w-max md:mt-4 mb-3 md:mb-1 px-4 py-0.5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-${item.color
                } hover:text-gray-500 transition focus:outline-none text-sm font-display`}
            >
              {item.nombre}
            </button>
          ))}
        </div>
        <div className="w-full h-max mb-[100%] ">
          {tabsGroup.map((group, idx) => {

            return (
              <div key={idx}>
                {isActiveStateSwiper == idx ? (
                  <>
                    {idxNew > -2 && <Swiper
                      //slideToClickedSlide={true}
                      initialSlide={idxNew < 0 ? idxGroupEvent?.idx - 2 : idxNew - 2}
                      spaceBetween={50}
                      pagination={{ clickable: true }}
                      breakpoints={{
                        0: {
                          slidesPerView: 1,
                          spaceBetween: 25,
                        },
                        768: {
                          slidesPerView: 3,
                          spaceBetween: 25,
                        },
                      }}
                      id={group?.status}
                      className={`${isActiveStateSwiper == idx ? "" : "hidden"}`}
                    >
                      {group?.data?.map((evento, idx) => (
                        <SwiperSlide
                          key={idx}
                          className="flex items-center justify-center my-3"
                          onClick={() => { setIdxGroupEvent({ idx, isActiveStateSwiper, event_id: evento._id }) }}
                        >
                          <Card data={group.data} grupoStatus={group.status} idx={idx} />
                        </SwiperSlide>
                      ))}
                      {group.status !== "pendiente" ? group.data?.length === 0 &&
                        <SwiperSlide
                          className={`flex items-center justify-center my-3`}
                        >
                          <div className={`w-72 h-36 rounded-xl flex flex-col items-center justify-center shadow-lg bg-base border border-gray-100 transition `}>
                            <p className="font-display font-base text-md">{`Ningún evento ${group.status}`}</p>
                          </div>
                        </SwiperSlide> :
                        <SwiperSlide
                          className={`flex items-center justify-center my-3`}
                        >
                          <CardEmpty state={state} set={setNewEvent} />
                        </SwiperSlide>
                      }
                    </Swiper>}
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </div >
    </>
  );
};


// interface propsSlideto {
//   page: number
//   setResultsContact: any
//   contacts: any
// }
// const SlideTo: FC<propsSlideto> = ({ page, setResultsContact, contacts }) => {
//   const swiper = useSwiper();
//   swiper.on('slideChange', function (idx) {
//     if (idx.activeIndex != 1) {
//       setResultsContact(contacts?.results)
//     }
//   });
//   useEffect(() => {
//     swiper.slideTo(page)
//   }, [page, swiper])
//   return <>
//   </>
// }
