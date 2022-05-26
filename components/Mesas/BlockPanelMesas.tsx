import {
  FlechaIcon,
  MesaCuadrada,
  MesaImperial,
  MesaPodio,
  MesaRedonda,
  PlusIcon,
} from "../icons";

import SwiperCore, { Pagination, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from "swiper/react";

import { Dispatch, FC, SetStateAction } from "react";

// install Swiper modules
SwiperCore.use([Pagination, Navigation]);

interface propsBlockPanelMesas {
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
  setModelo: Dispatch<SetStateAction<string>>
}

const BlockPanelMesas : FC <propsBlockPanelMesas> = ({set, state, setModelo}) => {
  const ListaMesas = [
    { icon: <MesaCuadrada className="relative w-max" />, title: "cuadrada" },
    { icon: <MesaPodio className="relative mt-1 w-max" />, title: "podio" },
    { icon: <MesaRedonda className="relative w-max" />, title: "redonda" },
    { icon: <MesaImperial className="relative w-max" />, title: "imperial" },
  ];

  const handleClick = (item : string) => {
    set(!state)
    setModelo(item)
  }

  return (
    <div className="w-full h-max shadow-lg relative">
    <div className="w-full bg-secondary rounded-xl pb-10 relative z-20">
      <div className="w-full relative">
        <h1 className="font-display font-semibold text-2xl text-white px-6 py-4">
          Mesas
        </h1>
        <span className="bg-tertiary z-10 flex gap-2 text-primary font-medium text-sm items-center px-3 rounded-lg absolute bottom-0 right-0 transform translate-y-1/2"> <PlusIcon /> escoge tu mesa con un click </span>
      </div>
      <div className="flex items-center justify-center w-full bg-white" >
      <Swiper
           pagination={{clickable: true}}
           navigation
           spaceBetween={20} 
            breakpoints={{
              0: {
                "slidesPerView": 1,
              },
              1024: {
                "slidesPerView": 3,
              },

            }}
            className=" w-full"
          >
        {ListaMesas.map((item, idx) => (
          <SwiperSlide
            onClick={() => handleClick(item.title)}
            key={idx}
            className="py-6 w-full mx-auto inset-x-0 flex flex-col justify-start items-center cursor-pointer transform hover:scale-105 transition"
          >
            {item.icon}
            <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />
          </SwiperSlide>
        ))}
      </Swiper>
      </div>
    </div>
      {/* <div onClick={() => set(!state)} className="w-12 h-12 rounded-lg bg-gray-300 absolute z-10 top-1 right-0 transform translate-x-1/2 cursor-pointer flex justify-end overflow-hidden">
        <span className="w-1/2 flex items-center justify-center px-1">
         <FlechaIcon className="text-white" />

        </span>
      </div> */}
      
    </div>
  );
};

export default BlockPanelMesas;
