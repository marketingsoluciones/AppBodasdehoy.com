import { FC } from "react";
import { InvitacionesIcon } from "../icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { EventContextProvider } from "../../context";

export const CounterInvitations: FC = () => {
  const { event } = EventContextProvider();
  const Invitaciones = event?.invitados_array?.reduce(
    (acc, invitado) => {
      if (invitado.invitacion) {
        acc.enviadas++;
        acc.total++;
      } else {
        acc.pendientes++;
        acc.total++;
      }
      return acc;
    },
    { enviadas: 0, pendientes: 0, total: 0 }
  );

  return (
    <>
      <div>
        <h2 className="font-display font-semibold text-gray-500 text-2xl text-center py-4">
          Estadisticas de invitaciones
        </h2>
        <div className="bg-white py-10 w-full shadow-lg rounded-xl ">
          <Swiper
            spaceBetween={50}
            breakpoints={{
              0: {
                slidesPerView: 1,
                spaceBetween: 25,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 25,
                allowTouchMove: false,
              },
            }}
            className="w-full h-max flex gap-12 items-center justify-center"
          >
            <SwiperSlide className="flex gap-3 items-center justify-center">
              <InvitacionesIcon className="text-secondary" />
              <p className="font-display font-bold text-2xl leading-4 text-gray-300 flex gap-1">
                {`${Invitaciones?.enviadas} de ${Invitaciones?.total}`}
                <span className="capitalize font-display font-medium text-sm">
                  invitaciones enviadas
                </span>
              </p>
            </SwiperSlide>

            <SwiperSlide className="flex gap-3 items-center justify-center">
              <InvitacionesIcon className="text-primary" />
              <p className="font-display font-bold text-2xl leading-4 text-gray-300  flex gap-1">
                {`${Invitaciones?.pendientes} de ${Invitaciones?.total}`}
                <span className="capitalize font-display font-medium text-sm">
                  invitaciones pendientes
                </span>
              </p>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </>
  );
};