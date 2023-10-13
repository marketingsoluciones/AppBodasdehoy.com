import { FC } from "react";
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";
import { propsTableType } from "./MesaComponent";

interface propsMesaImperial extends propsTableType {
  invitados: any[]
  setDisableWrapper: any
}
export const MesaImperial: FC<propsMesaImperial> = ({ table, invitados, setDisableWrapper, setShowFormEditar, disableDrag, spaceChairs }) => {

  const idxsRow = { one: [], two: [] }
  for (let i = 2; i < table?.numberChair; i++) {
    if (i <= Math.ceil(table?.numberChair / 2)) {
      idxsRow.one.push(i)
    } else {
      idxsRow.two.push(i)
    }
  }

  return (
    <>
      <div style={{ width: Math.ceil((table.numberChair - 2) / 2) * spaceChairs, height: spaceChairs }} className="bg-blue-300 shadow border border-gray-500 flex items-center justify-center relative">
        <span className="font-display text-xs tracking-tight">{table.title}</span>
        <Chair
          table={table}
          className="absolute flex my-auto inset-y-0 left-1 transform -translate-x-full"
          index={0}
        >
          {invitados.filter(element => element.chair == "0")[0] && <SentadoItem
            invitado={invitados.filter(element => element.chair == "0")[0]}
            setDisableWrapper={setDisableWrapper}
          />}
          <span />
        </Chair>
        <Chair
          table={table}
          className="absolute my-auto inset-y-0 right-1 transform translate-x-full"
          index={1}
        >
          {invitados.filter(element => element.chair == "1")[0] && <SentadoItem
            invitado={invitados.filter(element => element.chair == "1")[0]}
            setDisableWrapper={setDisableWrapper}
          />}
          <span />
        </Chair>
        <div style={{ paddingLeft: `${(spaceChairs - 45) / 2}px`, paddingRight: `${(spaceChairs - 45) / 2}px` }} className="w-full mx-auto inset-x-0 flex justify-between absolute top-1 transform -translate-y-full">
          {idxsRow.one.map((item, idx) => (
            <Chair
              table={table}
              className="relative"
              key={idx}
              index={item}
            >
              {invitados.filter(element => element.chair == item.toString())[0] && <SentadoItem
                invitado={invitados.filter(element => element.chair == item.toString())[0]}
                setDisableWrapper={setDisableWrapper}
              />}
              <span />
            </Chair>
          ))}
        </div>
        <div style={{ paddingLeft: `${(spaceChairs - 45) / 2}px`, paddingRight: `${(spaceChairs - 45) / 2}px` }} className="w-full mx-auto inset-x-0 flex justify-between absolute bottom-1 transform translate-y-full">
          {idxsRow.two.map((item, idx) => (
            <Chair
              table={table}
              className="relative"
              key={idx}
              index={item}
            >
              {invitados.filter(element => element.chair == item.toString())[0] && <SentadoItem
                invitado={invitados.filter(element => element.chair == item.toString())[0]}
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