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
        {/* <h2 className="font-display font-semibold text-gray-500 text-2xl text-center py-4">
          Resumen de las invitaciones
        </h2> */}
        <div className="bg-white w-full h-[88px] md:h-[76px] shadow-lg rounded-xl my-1 md:my-3 flex py-6 items-center justify-center">
          <div className="w-1/2 flex justify-center">
            <div className="flex gap-2 items-start md:items-center justify-center px-1 leading-4 flex-col md:flex-row">
              <InvitacionesIcon className="text-secondary w-6 h-6 md:w-10 md:h-10" />
              <div>
                <p className="font-display font-bold md:text-2xl text-gray-600 flex gap-1">
                  {`${Invitaciones?.enviadas} de ${Invitaciones?.total}`}
                </p>
                <span className="capitalize font-display font-medium text-xs md:text-sm">
                  invitaciones enviadas
                </span>
              </div>
            </div>
          </div>
          <div className="w-1/2 flex justify-center">
            <div className="flex gap-2 items-start md:items-center justify-center px-1 leading-4 flex-col md:flex-row">
              <InvitacionesIcon className="text-primary w-6 h-6 md:w-10 md:h-10" />
              <div>
                <p className="font-display font-bold md:text-2xl text-gray-600 flex gap-1">
                  {`${Invitaciones?.pendientes} de ${Invitaciones?.total}`}
                </p>
                <span className="capitalize font-display font-medium text-xs md:text-sm">
                  invitaciones pendientes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};