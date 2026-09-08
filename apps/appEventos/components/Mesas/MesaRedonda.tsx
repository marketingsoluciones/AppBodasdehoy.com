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

  // Diámetro por defecto 1 m (100 px = 1 m), ajustable con `diameter` (en metros). Pero se
  // garantiza un radio MÍNIMO para que las sillas no se solapen en el borde: al añadir muchas
  // sillas la mesa crece un poco. Radio = max(radio pedido, radio mínimo para las sillas).
  const diametroM = (table as any)?.diameter && (table as any).diameter > 0 ? (table as any).diameter : 1
  const baseRadius = (diametroM * 100) / 2
  const CHAIR_ARC = 34 // px que ocupa cada silla en el borde
  const nCh = table?.numberChair || 0
  const minRadius = nCh > 2 ? (CHAIR_ARC / 2) / Math.tan(Math.PI / nCh) : baseRadius
  const adyacente = Math.max(baseRadius, minRadius)
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

