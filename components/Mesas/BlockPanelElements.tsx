import { Arbol, Arbol2, Dj, Group83, Layer2, MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, Piano, PlusIcon, } from "../icons";
import { Dispatch, FC, SetStateAction, useState } from "react";
import BlockDefault from "./BlockDefault";
import DragTable from "./DragTable"

interface propsBlockPanelElements {
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
  setModelo: Dispatch<SetStateAction<string>>
}

export const ListElements = [
  { icon: <Arbol className="relative w-max" />, title: "arbol", tipo: "element" },
  { icon: <Arbol2 className="relative w-max" />, title: "arbol2", tipo: "element" },
  { icon: <Dj className="relative w-max" />, title: "dj", tipo: "element" },
  { icon: <Layer2 className="relative w-max" />, title: "layer2", tipo: "element" },
  { icon: <Piano className="relative w-max" />, title: "piano", tipo: "element" },
  { icon: <Piano className="relative w-max" />, title: "mesaLarga", tipo: "element" },
  { icon: <Group83 className="relative w-max" />, title: "group83", tipo: undefined },
];

const BlockPanelElements: FC<propsBlockPanelElements> = ({ set, state, setModelo }) => {

  const handleClick = (item: string) => {
    set(!state)
    setModelo(item)
  }
  return (
    <>
      <div id="listTables" className="w-full h-full">
        <BlockDefault listaLength={ListElements.length}>
          {ListElements.map((item, idx) => (
            <DragTable key={idx} item={item} set={set} state={state} setModelo={setModelo} />
          ))}
        </BlockDefault>
      </div>
    </>
  );
};

export default BlockPanelElements;