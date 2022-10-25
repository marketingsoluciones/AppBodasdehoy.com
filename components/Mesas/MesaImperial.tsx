import { FC, useEffect, useState } from "react";
import { guests, table } from "../../utils/Interfaces";
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";

interface propsMesaImperial {
  mesa: table,
  invitados: guests[]
  setDisableWrapper: any
}
export const MesaImperial: FC<propsMesaImperial> = ({ mesa, invitados, setDisableWrapper }) => {
  useEffect(() => {
    console.log("mesa", mesa)
  }, [])

  const [arrTotal, setArrTotal] = useState(() => {
    let arr = [];
    for (let i = 0; i < mesa?.cantidad_sillas; i++) {
      arr.push(i);
    }
    return arr;
  });
  const [Sillas, setSillas] = useState({
    total: mesa?.cantidad_sillas - 2,
    rowOne: () => {
      let arr = [];
      if (mesa?.cantidad_sillas - 2 !== 0) {
        arr = arrTotal.slice(2, Math.ceil((mesa?.cantidad_sillas - 2) / 2) + 2);
      }
      return arr;
    },
    rowTwo: () => {
      let arr = [];
      if (mesa?.cantidad_sillas - 2 !== 0) {
        arr = arrTotal.slice(Sillas.rowOne()?.length + 2);
      }
      return arr;
    },
  });
  useEffect(() => {
  }, [Sillas])


  return (
    <div className="w-40 left-0 h-20 bg-white shadow border border-gray-500 flex items-center justify-center relative">
      <span className="font-display text-xs tracking-tight">{mesa.nombre_mesa}</span>
      <Chair
        tipoMesa={mesa.tipo}
        nombre_mesa={mesa.nombre_mesa}
        className="absolute flex my-auto inset-y-0 left-1 transform -translate-x-full"
        index={0}
      >
        {invitados.filter(element => element.puesto == "0")[0] && <SentadoItem
          invitado={invitados.filter(element => element.puesto == "0")[0]}
          setDisableWrapper={setDisableWrapper}
        />}
        <span />
      </Chair>

      <Chair
        tipoMesa={mesa.tipo}
        nombre_mesa={mesa.nombre_mesa}
        className="absolute my-auto inset-y-0 right-1 transform translate-x-full"
        index={1}
      >
        {invitados.filter(element => element.puesto == "1")[0] && <SentadoItem
          invitado={invitados.filter(element => element.puesto == "1")[0]}
          setDisableWrapper={setDisableWrapper}
        />}
        <span />
      </Chair>

      <div className="w-full mx-auto inset-x-0 flex px-3 justify-between absolute top-1 transform -translate-y-full">
        {Sillas.rowOne().map((item, idx) => (
          <Chair
            tipoMesa={mesa.tipo}
            nombre_mesa={mesa.nombre_mesa}
            className="relative"
            key={idx}
            index={item}
          >
            {invitados.filter(element => element.puesto == item.toString())[0] && <SentadoItem
              invitado={invitados.filter(element => element.puesto == item.toString())[0]}
              setDisableWrapper={setDisableWrapper}
            />}
            <span />
          </Chair>
        ))}
      </div>

      <div className="w-full mx-auto inset-x-0 flex px-3 justify-between absolute bottom-1 transform translate-y-full">
        {Sillas.rowTwo().map((item, idx) => (
          <Chair
            tipoMesa={mesa.tipo}
            nombre_mesa={mesa.nombre_mesa}
            className="relative"
            key={idx}
            index={item}
          >
            {invitados.filter(element => element.puesto == item.toString())[0] && <SentadoItem
              invitado={invitados.filter(element => element.puesto == item.toString())[0]}
              setDisableWrapper={setDisableWrapper}
            />}
            <span />
          </Chair>
        ))}
      </div>
    </div>
  );
};