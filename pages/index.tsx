import { SetStateAction, useEffect, useState, Dispatch, FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore, { Pagination } from "swiper/core";
import { motion } from "framer-motion";
import { CircleBanner, LineaHome } from "../components/icons";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, } from "../context";
import Card from "../components/Home/Card";
import CardEmpty from "../components/Home/CardEmpty";
import FormCrearEvento from "../components/Forms/FormCrearEvento";
import ModalLeft from "../components/Utils/ModalLeft";
import { useDelayUnmount } from "../utils/Funciones";
import { NextPage } from "next";
import { Event } from "../utils/Interfaces";
import { fetchApiEventos, queries } from "../utils/Fetching";
import VistaSinCookie from "../pages/vista-sin-cookie"

SwiperCore.use([Pagination]);

const Home: NextPage = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const { setEventsGroup } = EventsGroupContextProvider()
  const { event } = EventContextProvider()
  const [showEditEvent, setShowEditEvent] = useState<boolean>(false);
  const [valir, setValir] = useState<boolean>(false);

  useEffect(() => {
    fetchApiEventos({
      query: queries.getEventsByID,
      variables: { userID: user?.uid },
    })
      .then((events: Event[]) => setEventsGroup({ type: "INITIAL_STATE", payload: events }))
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    if (showEditEvent && !isMounted && !valir) {
      setIsMounted(true)
      setValir(true)
    }
    if (showEditEvent && !isMounted && valir) {
      setShowEditEvent(false)
      setValir(false)
    }
  }, [showEditEvent, isMounted, valir])


  const { user, verificationDone } = AuthContextProvider()
  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    return (
      <>
        {shouldRenderChild && (
          <ModalLeft state={isMounted} set={setIsMounted}>
            {showEditEvent ?
              <FormCrearEvento state={isMounted} set={setIsMounted} EditEvent={showEditEvent} />
              : <FormCrearEvento state={isMounted} set={setIsMounted} />
            }
          </ModalLeft>
        )}

        <section className="section relative w-full ">
          <Banner state={isMounted} set={setIsMounted} />
          <GridCards state={isMounted} set={setIsMounted} showEditEvent={showEditEvent} setShowEditEvent={setShowEditEvent} />
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
  return (
    <div className="banner bg-base w-full flex justify-center h-3/6 md:h-3/5 px-5 md:px-0 overflow-hidden relative">
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
              onClick={() => set(!state)}
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
  showEditEvent: boolean
  setShowEditEvent: Dispatch<SetStateAction<boolean>>
}

type dataTab = {
  status: string
  data: Event[]
  vacio: number[]
}

const GridCards: FC<propsGridCards> = ({ state, set, showEditEvent, setShowEditEvent }) => {
  const { isActiveStateSwiper, setIsActiveStateSwiper } = AuthContextProvider()
  const { eventsGroup } = EventsGroupContextProvider();
  const [tabsGroup, setTabsGroup] = useState<dataTab[]>([]);


  useEffect(() => {
    if (eventsGroup) {
      const arrNuevo = eventsGroup?.reduce((acc, event) => {
        acc[event.estatus.toLowerCase()].push(event)
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

      const result: dataTab[] = Object.entries(arrNuevo).map((evento: any[]) => ({
        status: evento[0],
        data: evento[1],
        vacio: countEmptys(evento[1]),
      }));

      setTabsGroup(result);
    }
  }, [eventsGroup]);

  const Lista = [
    { nombre: "Pendientes", value: "pendiente", color: "tertiary" },
    { nombre: "Archivados", value: "archivado", color: "gray-300" },
    { nombre: "Realizados", value: "realizado", color: "secondary" },
  ];

  return (
    <>
      <div className="bg-white w-full grid-cards flex flex-col   justify-center items-center max-w-screen-lg xl:max-w-screen-xl inset-x-0 mx-auto  ">
        <div className="flex gap-4">
          {Lista.map((item, idx) => (
            <button
              onClick={(e) => setIsActiveStateSwiper(idx)}
              key={idx}
              className={`${isActiveStateSwiper == idx
                ? `bg-${item.color} text-gray-500`
                : "bg-white text-gray-500"
                } w-max px-4 py-0.5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-${item.color
                } hover:text-gray-500 transition focus:outline-none text-sm font-display`}
            >
              {item.nombre}
            </button>
          ))}
        </div>
        <div className="w-full h-max ">
          {tabsGroup.map((group, idx) => {
            return (
              <div key={idx}>
                {isActiveStateSwiper == idx ? (
                  <>
                    <Swiper
                      key={idx}
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
                      className={` h-48 ${isActiveStateSwiper == idx ? "" : "hidden"}`}
                    >
                      {group?.data?.sort((a: any, b: any) => { return b.fecha_creacion - a.fecha_creacion })?.map((evento, idx) => (
                        <SwiperSlide
                          key={idx}
                          className="flex items-center justify-center"
                        >
                          <Card key={evento._id} evento={evento} grupoStatus={group.status} />
                        </SwiperSlide>
                      ))}
                      {group.status !== "pendiente" ? group.data?.length === 0 &&
                        <SwiperSlide
                          className={`flex items-center justify-center`}
                        >
                          <div className={`w-72 h-36 rounded-xl flex flex-col items-center justify-center shadow-lg bg-base border border-gray-100 transition `}>
                            <p className="font-display font-base text-md">{`Ningún evento ${group.status}`}</p>
                          </div>
                        </SwiperSlide> :
                        <SwiperSlide
                          className={`flex items-center justify-center`}
                        >
                          <CardEmpty state={state} set={set} />
                        </SwiperSlide>
                      }
                    </Swiper>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <style jsx>
        {`
          .grid-cards {
            height: 35vh;
          }
        `}
      </style>
    </>
  );
};
