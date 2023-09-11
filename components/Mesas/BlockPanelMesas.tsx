import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, PlusIcon, } from "../icons";
import { Dispatch, FC, SetStateAction, useState } from "react";
import BlockDefault from "./BlockDefault";
import DragTable from "./DragTable"

interface propsBlockPanelMesas {
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
  setModelo: Dispatch<SetStateAction<string>>
}

export const ListaMesas = [
  { icon: <MesaCuadrada className="relative w-max" />, title: "cuadrada" },
  { icon: <MesaPodio className="relative w-max" />, title: "podio" },
  { icon: <MesaRedonda className="relative w-max" />, title: "redonda" },
  { icon: <MesaImperial className="relative w-max" />, title: "imperial" },
];

const BlockPanelMesas: FC<propsBlockPanelMesas> = ({ set, state, setModelo }) => {

  const handleClick = (item: string) => {
    set(!state)
    setModelo(item)
  }
  return (
    <div id="listTables" className="js-drop-mesas bg-white w-full h-full">
      <BlockDefault>
        {ListaMesas.map((item, idx) => (
          <DragTable key={idx} item={item} set={set} state={state} setModelo={setModelo} />
          // <div onClick={() => handleClick(item.title)} key={idx} className="w-full h-full p-2 flex-col justify-center items-center cursor-pointer">
          //   <div key={idx} className="jkrelative w-full h-full flex transform hover:scale-105 transition justify-center items-center">
          //     {item.icon}
          //     <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />
          //   </div>
          // </div>
        ))}
      </BlockDefault>
    </div>
  );
};

export default BlockPanelMesas;