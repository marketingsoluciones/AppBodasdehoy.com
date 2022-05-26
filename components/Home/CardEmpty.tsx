import useHover from "../../hooks/useHover";
import { CrearEventoIcon } from "../icons";
import {Dispatch, FC, memo, SetStateAction} from 'react'

interface propsCadEmpty {
  set : Dispatch<SetStateAction<boolean>>
  state : boolean
}

const CardEmpty : FC<propsCadEmpty> = ({set, state}) => {
  const [hoverRef, isHovered] = useHover();

  return (
    <div
    //@ts-ignore
      ref={hoverRef}
      onClick={() => set(!state)}
      className={`w-72 h-36 rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-lg bg-base border border-gray-100 transition ${
        isHovered
          ? "transform scale-105 duration-700  text-gray-400"
          : "text-primary"
      }`}
    >
      <CrearEventoIcon className="w-8 h-8" />
      <p className="font-display font-base text-md">Crear evento</p>
    </div>
  );
};

export default memo(CardEmpty)
