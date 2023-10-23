import { Arbol, Arbol2, Dj, Group83, Layer2, MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, Piano, PlusIcon, } from "../icons";
import { Dispatch, FC, SetStateAction, useState } from "react";
import BlockDefault from "./BlockDefault";
import DragTable from "./DragTable"

interface propsBlockPanelElements {

}

export const ListElements = [
  { icon: <Arbol className="relative w-max" />, title: "arbol", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <Arbol2 className="relative w-max" />, title: "arbol2", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <Dj className="relative w-max" />, title: "dj", tipo: "element", size: { width: 140, height: 110 } },
  { icon: <Layer2 className="relative w-max" />, title: "layer2", tipo: "element", size: { width: 280, height: 250 } },
  { icon: <Piano className="relative w-max" />, title: "piano", tipo: "element", size: { width: 120, height: 120 } },
  { icon: <Group83 className="relative w-max" />, title: "group83", tipo: "element" },
];

const BlockPanelElements: FC<propsBlockPanelElements> = () => {

  return (
    <>
      <div id="listTables" className="w-full h-full">
        <BlockDefault listaLength={ListElements.length}>
          {ListElements.map((item, idx) => (
            <DragTable key={idx} item={item} />
          ))}
        </BlockDefault>
      </div>
    </>
  );
};

export default BlockPanelElements;