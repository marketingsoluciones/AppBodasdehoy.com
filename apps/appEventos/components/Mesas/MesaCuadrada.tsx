import { FC } from "react";
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";
import { propsTableType } from "./MesaComponent";

interface propsMesaCuadradra extends propsTableType {
  invitados: any[]
  setDisableWrapper: any
}
export const MesaCuadradaNew: FC<propsMesaCuadradra> = ({ table, invitados, setDisableWrapper, setShowFormEditar, disableDrag, spaceChairs }) => {
  const dec = parseInt(`${(`${(table?.numberChair / 4).toFixed(2)}`)}`.split(".")[1])
  const qwe = dec / 25
  const numberChairForSide = Math.ceil(table?.numberChair / 4)
  // TODAS las mesas cuadradas tienen el MISMO lado; lo que cambia es cuántas sillas se
  // reparten (más sillas = más juntas). Lado FIJO (no depende del nº de sillas). Por defecto
  // 1 m; ajustable si la mesa trae `side` (en metros). Escala del lienzo: 100 px = 1 m.
  const ladoM = (table as any)?.side && (table as any).side > 0 ? (table as any).side : 1
  const size = ladoM * 100
  // Unidad de espaciado interna derivada del lado FIJO (para que las sillas quepan en él).
  const spaceChairsCalc = numberChairForSide > 0 ? size / numberChairForSide : size

  const idxsSide = { a: [], b: [], c: [], d: [] }
  const sides = ["a", "b", "c", "d"]
  let cont = 0
  let control = 0
  for (let i = 0; i < table?.numberChair; i++) {
    idxsSide[`${sides[control]}`]?.push(i)
    cont++
    if (cont === numberChairForSide - (qwe !== 0 ? (control < qwe ? 0 : 1) : 0)) {
      control++
      cont = 0
    }
  }

  return (
    <>
      <div
        style={{ width: size, height: size }}
        className="bg-white shadow border border-gray-500 flex items-center justify-center relative">
        <span style={{ rotate: `-${table?.rotation}deg` }} className="font-display text-xs tracking-tight">{table.title}</span>
        <div
          style={{
            paddingTop: `${(spaceChairsCalc - 45) / 2}px`,
            paddingBottom: `${(spaceChairsCalc - 45) / 2}px`
          }}
          className="h-full my-auto inset-y-0 flex flex-col-reverse justify-between absolute left-1 transform -translate-x-full">
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
        <div
          style={{
            paddingLeft: `${(spaceChairsCalc - 45 + (idxsSide?.b?.length == numberChairForSide ? 0 : spaceChairsCalc / idxsSide?.b?.length)) / 2}px`,
            paddingRight: `${(spaceChairsCalc - 45 + (idxsSide?.b?.length == numberChairForSide ? 0 : spaceChairsCalc / idxsSide?.b?.length)) / 2}px`
          }}
          className="w-full mx-auto inset-x-0 flex justify-between absolute top-1 transform -translate-y-full">
          {idxsSide?.b?.map((item, idx) => (
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
        <div
          style={{
            paddingTop: `${(spaceChairsCalc - 45 + (idxsSide?.c?.length == numberChairForSide ? 0 : spaceChairsCalc / idxsSide?.c?.length)) / 2}px`,
            paddingBottom: `${(spaceChairsCalc - 45 + (idxsSide?.c?.length == numberChairForSide ? 0 : spaceChairsCalc / idxsSide?.c?.length)) / 2}px`
          }} className="h-full my-auto inset-y-0 flex flex-col justify-between absolute right-1 transform translate-x-full">
          {idxsSide?.c?.map((item, idx) => {
            return (
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
            )
          })}
        </div>
        <div
          style={{
            paddingLeft: `${(spaceChairsCalc - 45 + (idxsSide?.d?.length == numberChairForSide ? 0 : spaceChairsCalc / idxsSide?.d?.length)) / 2}px`,
            paddingRight: `${(spaceChairsCalc - 45 + (idxsSide?.d?.length == numberChairForSide ? 0 : spaceChairsCalc / idxsSide?.d?.length)) / 2}px`
          }}
          className="w-full mx-auto inset-x-0 flex flex-row-reverse justify-between absolute bottom-1 transform translate-y-full">
          {idxsSide?.d?.map((item, idx) => (
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