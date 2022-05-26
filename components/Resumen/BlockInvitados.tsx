import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore, { Pagination } from "swiper/core";
import router from "next/router";
import { FC } from "react";
import { EventContextProvider } from "../../context";
import {
  InvitadosCancelados,
  InvitadosConfirmados,
  InvitadosPendientes,
} from "../icons";


SwiperCore.use([Pagination]);

const BlockInvitados: FC = () => {
  const {
    event,
  } = EventContextProvider();

  const totalAccordingTo = (prop: string, param: string) => {
    return event?.invitados_array?.filter((item) => item[prop] == param)?.length;
  };

  const totalInvitados = event?.invitados_array?.length;

  const ListaBloqueInvitados = [
    {
      icon: <InvitadosPendientes />,
      title: `${totalAccordingTo(
        "asistencia",
        "pendiente"
      )} de ${totalInvitados}`,
      subtitle: "por confirmar",
    },
    {
      icon: <InvitadosConfirmados />,
      title: `${totalAccordingTo(
        "asistencia",
        "confirmado"
      )} de ${totalInvitados}`,
      subtitle: "confirmados",
    },
    {
      icon: <InvitadosCancelados />,
      title: `${totalAccordingTo(
        "asistencia",
        "cancelado"
      )} de ${totalInvitados}`,
      subtitle: "cancelados",
    },
  ];

  return (
    <div className="w-1/2 md:w-2/3">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left">
        Mis invitados
      </h2>
      <div className="w-full bg-white shadow rounded-xl py-4 flex flex-col gap-4 h-48 items-center justify-center">
        <Swiper
          spaceBetween={50}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 25,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 25,
              allowTouchMove: false,
            },
          }}
          className="w-full"
        >
          {ListaBloqueInvitados.map((item, idx) => (
            <SwiperSlide
              key={idx}
              className="flex-col flex items-center justify-center w-full text-gray-500"
            >
              {item.icon}
              <p className="font-display font-semibold text-gray-300 text-xl text-gray-700">
                {item.title}
              </p>
              <p className="font-display font-ligth text-gray-300 text-xs text-gray-700">
                {item.subtitle}
              </p>
            </SwiperSlide>
          ))}
        </Swiper>
        <button
          onClick={() => router.push("/invitados")}
          className="focus:outline-none rounded-lg border border-primary px-2 mx-auto inset-x-0 font-display text-primary text-sm py-1 hover:text-white hover:bg-primary transition"
        >
          Añadir Invitados
        </button>
      </div>
    </div>
  );
};

export default BlockInvitados;
