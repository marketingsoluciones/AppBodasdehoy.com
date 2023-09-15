import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, PlusIcon, } from "../icons";
import { Dispatch, FC, SetStateAction, useState } from "react";
import BlockDefault from "./BlockDefault";
import DragTable from "./DragTable"

interface propsBlockPanelMesas {

}

export const ListTables = [
  { icon: <MesaCuadrada className="relative w-max" />, title: "cuadrada", tipo: "table" },
  { icon: <MesaPodio className="relative w-max" />, title: "podio", tipo: "table" },
  { icon: <MesaRedonda className="relative w-max" />, title: "redonda", tipo: "table" },
  { icon: <MesaImperial className="relative w-max" />, title: "imperial", tipo: "table" },
];

const BlockPanelMesas: FC<propsBlockPanelMesas> = () => {

  return (
    <>
      <div id="listTables" className="js-dropTables bg-white w-full h-full">
        <BlockDefault listaLength={ListTables.length}>
          {ListTables.map((item, idx) => (
            <DragTable key={idx} item={item}  />
          ))}
        </BlockDefault>
      </div>
    </>
  );
};

export default BlockPanelMesas;