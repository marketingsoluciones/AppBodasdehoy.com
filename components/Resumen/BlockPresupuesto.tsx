import React from "react";
import { CochinoIcon, DineroIcon } from "../icons";
import { Swiper, SwiperSlide } from "swiper/react";
import router from "next/router";
import { getCurrency } from "../../utils/Funciones";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { useAllowed } from "../../hooks/useAllowed";


const BlockPresupuesto = () => {
  const { event } = EventContextProvider();
  const [isAllowed, ht] = useAllowed()
  const ListaBlock = [
    { icon: <CochinoIcon className="text-gray-500" />, amount: getCurrency(event?.presupuesto_objeto?.coste_estimado, event?.presupuesto_objeto?.currency), subtitle: "estimado" },
    { icon: <DineroIcon className="text-gray-500" />, amount: getCurrency(event?.presupuesto_objeto?.coste_final, event?.presupuesto_objeto?.currency), subtitle: "gastado" },
  ];
  return (
    <div className="w-[50%]* md:w-1/3 box-border">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left">
        Presupuesto
      </h2>

      <div className="w-full shadow rounded-xl bg-white py-4 flex flex-col gap-4 h-48 items-center justify-center">
        <Swiper
          spaceBetween={50}
          breakpoints={{
            0: {
              "slidesPerView": 3,
              "spaceBetween": 25,
            },
            768: {
              "slidesPerView": 3,
              "spaceBetween": 25,
              "allowTouchMove": false

            },

          }}
          className="w-full"
        >
          {ListaBlock.map((item, idx) => (
            <SwiperSlide key={idx} className="mx-auto inset-x-0 w-max flex flex-col justify-center items-center ">
              <span className="py-1">
                {item.icon}
              </span>
              <p className="font-display font-semibold text-lg text-gray-700 leading-6">
                {item.amount}
              </p>
              <p className="font-display font-base text-xs text-gray-500">
                {item.subtitle}
              </p>
            </SwiperSlide>
          ))}
        </Swiper>

        <button onClick={() => !isAllowed("presupuesto") ? ht() : router.push("/presupuesto")} className="focus:outline-none rounded-lg border border-primary px-2 mx-auto inset-x-0 font-display text-primary text-sm py-1 hover:text-white hover:bg-primary transition">
          Añadir gastos
        </button>
      </div>
    </div>
  );
};

export default BlockPresupuesto;
