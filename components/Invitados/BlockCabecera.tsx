import {
  CanceladoIcon,
  ConfirmadosIcon,
  MesaIcon,
  PendienteIcon,
} from "../icons";
import {EventContextProvider} from "../../context";
import { useRouter } from "next/router";
import { Swiper, SwiperSlide } from "swiper/react";
import BlockTitle from "../Utils/BlockTitle";


const BlockCabecera = () => {
  const { event } = EventContextProvider();
  const router = useRouter();

  const totalSegun = (prop, param) => {
    return event?.invitados_array?.filter((item) => item[prop] == param);
  };
  const ObjInvitado = {
    total: event?.invitados_array?.length,
  };

  const TotalList = [
    {
      title: `${totalSegun("asistencia", "pendiente")?.length} de ${
        ObjInvitado?.total
      }`,
      subtitle: "por confirmar",
      icon: <PendienteIcon />,
    },
    {
      title: `${totalSegun("asistencia", "confirmado")?.length} de ${
        ObjInvitado?.total
      }`,
      subtitle: "confirmados",
      icon: <ConfirmadosIcon />,
    },
    {
      title: `${totalSegun("asistencia", "cancelado")?.length} de ${
        ObjInvitado?.total
      }`,
      subtitle: "cancelados",
      icon: <CanceladoIcon />,
    },
  ];
  return (
    <>
      <BlockTitle title="Mis invitados"/>
      <div className="w-full flex flex-col gap-4 md:grid md:grid-cols-6 my-2 py-2 md:border-b-4 md:border-primary relative">
        
        <div className="flex gap-10 items-center justify-center h-full w-full md:col-span-2 py-4">
          <div className="flex gap-1 items-center justify-end ">
          <p className="font-display font-semibold text-4xl text-primary">
            {ObjInvitado?.total}
          </p>
          <p className="font-display text-primary">invitados</p>
          </div>
          <div className="flex flex-col gap-1 items-start justify-center h-full col-span-1">
            <p className="font-display font-semibold text-sm text-gray-500 flex gap-1">
              {totalSegun("grupo_edad", "adulto")?.length}{" "}
              <span className="font-xs font-light">adultos</span>
            </p>
            <p className="font-display font-semibold text-sm text-gray-500 flex gap-1">
              {totalSegun("grupo_edad", "niño")?.length}{" "}
              <span className="font-xs font-light">niños y bebes</span>
            </p>
          </div>
        </div>

        <Swiper
            breakpoints={{
              0: {
                "slidesPerView": 2,
                "spaceBetween": 25,
              },
              768: {
                "slidesPerView": 3,
                "allowTouchMove":false,
                "spaceBetween": 25,
                
                
              },

            }}
            className="bg-white rounded-xl col-span-3 shadow-lg flex items-center w-full justify-center h-24 md:h-auto relative">

          {TotalList.map((item, idx) => (
            <SwiperSlide key={idx} className="flex gap-2 items-center justify-center">
              {item?.icon}
              <span>
                <p className="font-display text-lg font-semibold text-gray-700 leading-5">
                  {item?.title}
                </p>
                <p className="font-display text-xs font-medium text-gray-500">
                  {item?.subtitle}
                </p>
              </span>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="md:flex w-40 h-40 bg-primary rounded-full col-span-1 absolute right-0 flex flex-col items-center justify-center hidden z-20">
          <MesaIcon className="text-white" />
          <p className="font-display text-md font-semibold text-white">
            sentar <span className="font-light">invitados</span>
          </p>
          <button
            onClick={() => router.push("/mesas")}
            className="focus:outline-none bg-tertiary rounded-lg text-gray-700 font-display text-sm font-semibold px-2 "
          >
            Añadir mesa
          </button>
        </div>
      </div>
    </>
  );
};

export default BlockCabecera;
