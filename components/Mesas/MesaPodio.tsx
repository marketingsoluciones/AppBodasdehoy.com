import { FC } from "react";
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";
import { propsTableType } from "./MesaComponent";

interface propsMesaPodio extends propsTableType {
  invitados: any[]
  setDisableWrapper: any
}
export const MesaPodioNew: FC<propsMesaPodio> = ({ table, invitados, setDisableWrapper, setShowFormEditar, disableDrag, spaceChairs }) => {

  const idxsSide = { a: [] }
  for (let i = 0; i < table?.numberChair; i++) {
    idxsSide?.a?.push(i)
  }

  return (
    <>
      <div
        style={{ width: spaceChairs * table.numberChair, height: spaceChairs }}
        className="bg-white shadow border border-gray-500 flex items-center justify-center relative">
        <span style={{ rotate: `-${table?.rotation}deg` }} className="font-display text-xs tracking-tight">{table.title}</span>

        <div
          style={{
            paddingLeft: `${(spaceChairs - 45) / 2}px`,
            paddingRight: `${(spaceChairs - 45) / 2}px`
          }}
          className="w-full mx-auto inset-x-0 flex justify-between absolute top-1 transform -translate-y-full">
          {idxsSide?.a?.map((item, idx) => (
            <Chair
              table={table}
              className="relative"
              key={idx}
              index={item}
            >
              {invitados?.filter(element => element.chair == item.toString())[0] && <SentadoItem
                invitado={invitados?.filter(element => element.chair == item.toString())[0]}
                setDisableWrapper={setDisableWrapper}
              />}
              <span />
            </Chair>
          ))}
        </div>
      </div>
    </>
  );
};