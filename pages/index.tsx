import { SetStateAction, useEffect, useState, Dispatch, FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import { CircleBanner, CrearEventoIcon, LineaHome } from "../components/icons";
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

const Home: NextPage = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const { user, verificationDone } = AuthContextProvider()
  const { setEventsGroup } = EventsGroupContextProvider()

  useEffect(() => {
    fetchApiEventos({
      query: queries.getEventsByID,
      variables: { userID: user?.uid },
    })
      .then((events: Event[]) => setEventsGroup({ type: "INITIAL_STATE", payload: events }))
      .catch((error) => console.log(error));
  }, []);

  if (verificationDone) {
    if (user) {
      return (
        <>
          {shouldRenderChild && (
            <ModalLeft state={isMounted} set={setIsMounted}>
              <FormCrearEvento state={isMounted} set={setIsMounted} />
            </ModalLeft>
          )}

          <section className="section relative w-full ">
            <Banner state={isMounted} set={setIsMounted} />
            <GridCards state={isMounted} set={setIsMounted} />
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
    return (
      <VistaSinCookie />
    )
  }

  /* return (
    <>
      {shouldRenderChild && (
        <ModalLeft state={isMounted} set={setIsMounted}>
          <FormCrearEvento state={isMounted} set={setIsMounted} />
        </ModalLeft>
      )}

      <section className="section relative w-full ">
        <Banner state={isMounted} set={setIsMounted} />
        <GridCards state={isMounted} set={setIsMounted} />
      </section>
      <style jsx>
        {`
          .section {
            height: calc(100vh - 190px);
          }
        `}
      </style>
    </>
  ); */
};
export default Home;

export async function getServerSideProps({ req, res }) {
  // try {
  //   const sessionCookie = req?.cookies?.___sessionBodas;
  //   console.log(sessionCookie);
  //   if (sessionCookie) {
  //     const query = {
  //       query: `mutation ($sessionCookie : String){
  //         status(sessionCookie: $sessionCookie){
  //           customToken
  //         }
  //       }`,
  //       variables: {
  //         sessionCookie,
  //       },
  //     };

  //     const {
  //       data: {
  //         data: { status },
  //       },
  //     } = await api.ApiBodasExpress(query);
  //     if (status) {
  //       return { props: status };
  //     } else {
  //       throw new Error("No hay customToken");
  //     }
  //     console.log("SI TENGO");
  //   } else {
  //     throw new Error("No hay sessionToken");
  //   }
  // } catch (error) {
  //   console.log("NO TENGO");
  //   res.statusCode = 302;
  //   res.setHeader("Location", `https://bodasdehoy.com/login`);
  //   console.log(JSON.stringify(error, null, 2));
  //   return { props: {} };
  // }

  return { props: {} };
  // if (token) {
  //   try {
  //     const {data:usuario} = await api.MiUsuario(token);
  //     return { props: { usuario } };
  //   } catch (error) {
  //     res.statusCode = 302
  //     res.setHeader('Location', `https://bodasdehoy.com`)
  //     console.log("Hola mundo");
  //     return { props: {} };
  //   }

  // } else {
  //   res.statusCode = 302
  //   res.setHeader('Location', `https://bodasdehoy.com`)
  //   return { props: {} };
  // }
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
          <span className="flex gap-2 items-end">
            <button
              onClick={() => set(!state)}
              className="mt-4 bg-primary font-display font-medium text-white px-10 py-1 rounded-lg  box-border hover:bg-gray-200 transition focus:outline-none z-20"
            >
              Crear evento
            </button>
            <CrearEventoIcon className="text-primary" />
          </span>
          <LineaHome className="hidden md:flex md:-bottom-10 xl:-bottom-5 absolute w-full z-10 left-0 w-max" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden md:block relative overflow-hidden"
        >
          <CircleBanner className="w-full h-auto top-10 transform translate-y-1/6 absolute bottom-0 z-0 right-0 z-0" />
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
  state: boolean;
  set: Dispatch<SetStateAction<boolean>>;
}

type dataTab = {
  status: string
  data: Event[]
  vacio: number[]
}

const GridCards: FC<propsGridCards> = ({ state, set }) => {
  const { eventsGroup } = EventsGroupContextProvider();
  const [tabsGroup, setTabsGroup] = useState<dataTab[]>([]);
  const [isActive, setIsActive] = useState<number>(0);

  console.log(eventsGroup)
  useEffect(() => {
    if (eventsGroup) {
      const arrNuevo = eventsGroup?.reduce(
        (acc, event) => {
          acc[event?.estatus?.toLowerCase()].push(event);
          return acc;
        },
        { pendiente: [], realizado: [], borrado: [] }
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
    { nombre: "Realizados", value: "realizado", color: "secondary" },
    /* { nombre: "Eliminados", value: "borrado", color: "gray-100" }, */
  ];

  return (
    <>
      <div className="bg-white w-full grid-cards flex flex-col pt-8 gap-6 justify-center items-center max-w-screen-lg xl:max-w-screen-xl inset-x-0 mx-auto  ">
        <div className="flex gap-4">
          {Lista.map((item, idx) => (
            <button
              onClick={(e) => setIsActive(idx)}
              key={idx}
              className={`${isActive == idx
                ? `bg-${item.color} text-gray-500`
                : "bg-white text-gray-500"
                } w-max px-4 py-0.5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-${item.color
                } hover:text-gray-500 transition focus:outline-none text-sm`}
            >
              {item.nombre}
            </button>
          ))}
        </div>
        <div className="w-full ">
          {tabsGroup.map((group, idx) => (
            <>
              {isActive == idx ? (
                <Swiper
                  key={idx}
                  spaceBetween={50}
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
                  className={` h-40 ${isActive == idx ? "" : "hidden"}`}
                >
                  {group?.data?.map((evento, idx) => (
                    <SwiperSlide
                      key={idx}
                      className="flex items-center justify-center"
                    >
                      <Card key={evento._id} evento={evento} />
                    </SwiperSlide>
                  ))}
                  {group?.vacio?.map((e, idx) => (
                    <SwiperSlide
                      key={idx}
                      className={`flex items-center justify-center`}
                    >
                      <CardEmpty state={state} set={(accion) => set(accion)} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : null}
            </>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .grid-cards {
            height: 30vh;
          }
        `}
      </style>
    </>
  );
};
