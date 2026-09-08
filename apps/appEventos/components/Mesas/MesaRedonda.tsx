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

  // TODAS las mesas redondas tienen el MISMO diámetro; lo que cambia es cuántas sillas se
  // reparten alrededor (más sillas = más juntas). El diámetro es FIJO (no depende del nº de
  // sillas). Por defecto 1 m; ajustable si la mesa trae `diameter` (en metros). Escala del
  // lienzo: 100 px = 1 m.
  const diametroM = (table as any)?.diameter && (table as any).diameter > 0 ? (table as any).diameter : 1
  const adyacente = (diametroM * 100) / 2
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

