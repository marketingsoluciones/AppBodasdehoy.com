import { FC } from "react";
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";
import { propsTableType } from "./MesaComponent";

interface propsRedonda extends propsTableType {
  invitados: any[]
  setDisableWrapper: any
}
export const MesaRedondaNew: FC<propsRedonda> = ({ table, invitados, setDisableWrapper, setShowFormEditar, disableDrag, spaceChairs }) => {
  const idxs = []

  for (let i = 0; i < table?.numberChair; i++) {
    idxs?.push(i)
  }

  function getTanDeg(deg: number) {
    var rad = (deg * Math.PI) / 180;
    return Math.tan(rad);
  }
  const anguloOpuesto = 360 / table.numberChair / 2
  const adyacente = (spaceChairs / 2) / getTanDeg(anguloOpuesto)
  return (
    <>
      <div style={{ width: (adyacente * 2), height: (adyacente * 2) }} className="rounded-full transform bg-white shadow border border-gray-500 relative flex items-center justify-center">
        <span style={{ rotate: `-${table?.rotation}deg` }} className="font-display text-xs text-center tracking-tight">{table.title}</span>
        {
          idxs?.map((item, idx) => (
            <Chair
              table={table}
              className="radio"
              key={idx}
              index={item}
              position={360 / table.numberChair * (idx + 1)}
              radio={adyacente}
            >
              {invitados?.filter(element => element.chair == item.toString())[0] && <SentadoItem
                invitado={invitados?.filter(element => element.chair == item.toString())[0]}
                setDisableWrapper={setDisableWrapper}
              />}
              <span />
            </Chair>
          ))
        }
      </div>
    </>
  );
};

