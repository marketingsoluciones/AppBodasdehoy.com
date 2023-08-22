import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, PlusIcon, } from "../icons";
import { Dispatch, FC, SetStateAction } from "react";

interface propsBlockPanelMesas {
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
  setModelo: Dispatch<SetStateAction<string>>
}

const BlockPanelMesas: FC<propsBlockPanelMesas> = ({ set, state, setModelo }) => {
  const ListaMesas = [
    { icon: <MesaCuadrada className="relative w-max" />, title: "cuadrada" },
    { icon: <MesaPodio className="relative mt-1 w-max" />, title: "podio" },
    { icon: <MesaRedonda className="relative w-max" />, title: "redonda" },
    { icon: <MesaImperial className="relative w-max" />, title: "imperial" },
  ];

  const handleClick = (item: string) => {
    set(!state)
    setModelo(item)
  }

  return (

    <div className="bg-secondary w-full rounded-lg pb-6 md:pb-3 shadow-lg ">
      <div className="relative">
        <h1 className="font-display font-semibold text-2xl text-white px-6 py-4 md:py-1 relative">
          Mesas
        </h1>
        <span className="bg-tertiary flex gap-2 text-primary font-medium text-sm items-center px-3 rounded-lg absolute bottom-0 right-0 transform translate-y-1/2"> <PlusIcon /> escoge tu mesa con un click </span>
      </div>
      <div className="flex items-center justify-center w-full bg-white" >
        {ListaMesas.map((item, idx) => (
          <div onClick={() => handleClick(item.title)} key={idx} className="pl-2 pr-2 py-4 md:py-2 w-full mx-auto inset-x-0 flex flex-col justify-start items-center cursor-pointer transform hover:scale-105 transition">
            {item.icon}
            <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />
          </div>
        ))}
      </div>
    </div>

  );
};

export default BlockPanelMesas;