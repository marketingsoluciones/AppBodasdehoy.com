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
  // { icon: <Group83 className="relative w-max" />, title: "group83", tipo: undefined },
];

const BlockPanelElements: FC<propsBlockPanelElements> = () => {

  return (
    <>
      <div id="listTables" className="w-full h-full">
        <BlockDefault listaLength={ListElements.length}>
          {ListElements.map((item, idx) => (
            <DragTable key={idx} item={item} />
          ))}
          <div id="added-svg" onClick={() => { console.log(10001) }} className="w-20 h-16 static">
            <span className="w-full h-full flex items-center ">
              <div className="w-full h-full p-2 flex-col justify-center items-center *cursor-pointer relative">
                <div className="w-full h-full flex transform hover:scale-105 transition justify-center items-center relative">
                  <div className="js-dragDefault w-full h-10 flex justify-center items-center">
                    <Group83 className="relative w-max" />
                    <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />
                  </div>
                </div>
              </div>
            </span>
            <style>{`
              .listTables {
                touch - action: none;
                user-select: none;
              }
            `}</style>
          </div>
        </BlockDefault>
      </div>
    </>
  );
};

export default BlockPanelElements;