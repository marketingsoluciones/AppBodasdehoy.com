import { cloneElement, FC, ReactNode, TouchEvent, useEffect, useState } from "react";
import useHover from "../../hooks/useHover";
import Tooltip from "../Utils/Tooltip";
import { guests, signalItem, table } from '../../utils/Interfaces';
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";
import { MesaImperial } from "./MesaImperial";
import Invitados from "../../pages/invitados";
import { EditMesa } from "./EditMesa";

interface propsMesaComponent {
  posicion: number;
  mesa: table;
  invitados: guests[];
  setDisableWrapper: any
  setShowFormEditar: any
}

enum types {
  radio,
  relative,
}
type tableType = {
  position: any;
  component: any;
  type: keyof typeof types;
};
type schemaType = {
  redonda: tableType;
  cuadrada: tableType;
  podio: tableType;
};

const MesaComponent: FC<propsMesaComponent> = ({ posicion, mesa, invitados, setDisableWrapper, setShowFormEditar }) => {
  const { cantidad_sillas } = mesa;
  const [nSillas, setNSillas] = useState([]);

  // Crear array a partir de un numero para poder renderizar sillas
  const ArraySillas: CallableFunction = (): number[] => {
    let arr = [];
    for (let i = 0; i < mesa?.cantidad_sillas; i++) {
      arr.push(i);
    }
    return arr;
  };

  const posiciones = {
    redonda: posicion,
    cuadrada: [0, 90, 180, 270],
    podio: ArraySillas(),
    imperial: ArraySillas(),
  };

  const schemaGeneral: schemaType = {
    redonda: {
      position: posicion,
      component: <MesaRedonda mesa={mesa} setShowFormEditar={setShowFormEditar} />,
      type: "radio",
    },
    cuadrada: {
      position: [0, 90, 180, 270],
      component: <MesaCuadrada mesa={mesa} setShowFormEditar={setShowFormEditar} />,
      type: "radio",
    },
    podio: {
      position: ArraySillas(),
      component: <MesaPodio mesa={mesa} setShowFormEditar={setShowFormEditar} />,
      type: "relative",
    },
  };

  // Setear estado con el array correspondiente
  useEffect(() => {
    setNSillas(posiciones[mesa?.tipo]);
  }, []);

  if (["imperial"].includes(mesa.tipo)) {
    return (
      <>
        <MesaImperial mesa={mesa} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} />
      </>
    )
  } else {
    return cloneElement(schemaGeneral[mesa.tipo].component, {
      cantidad_sillas,
      children: nSillas?.map((valor, idx) => {
        const invitado = invitados.filter(element => element.puesto == idx.toString())[0]
        return (
          <>
            <Chair
              key={idx}
              index={idx}
              tipoMesa={mesa?.tipo}
              posicion={valor}
              nombre_mesa={mesa?.nombre_mesa}
              className={schemaGeneral[mesa.tipo].type}
            >
              {/* <span>otro</span> */}
              {invitado && <SentadoItem
                key={idx}
                posicion={valor}
                invitado={invitado}
                setDisableWrapper={setDisableWrapper}
              />}
              <span />
            </Chair>
          </>
        );
      }),
    });
  }
};

export default MesaComponent;




interface propsTableType {
  cantidad_sillas?: number
  children?: ReactNode
  mesa: table
  setShowFormEditar: any
}

const MesaRedonda: FC<propsTableType> = ({ cantidad_sillas, children, mesa, setShowFormEditar }) => {
  return (
    <>
      <EditMesa mesa={mesa} setShowFormEditar={setShowFormEditar} />
      <div
        className="rounded-full transform bg-white w-20 h-20 shadow border border-gray-500 relative flex items-center justify-center"
      >
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{mesa?.nombre_mesa}</p>
        {children}
      </div>
    </>
  );
};

const MesaCuadrada: FC<propsTableType> = ({ cantidad_sillas, children, mesa, setShowFormEditar }) => {
  return (
    <>
      <EditMesa mesa={mesa} setShowFormEditar={setShowFormEditar} />
      <div
        className="w-20 h-20 shadow border border-gray-500 relative bg-white flex items-center justify-center"
      >
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{mesa?.nombre_mesa}</p>
        {children}
      </div>
    </>
  );
};

const MesaPodio: FC<propsTableType> = ({ cantidad_sillas, children, mesa, setShowFormEditar }) => {
  return (
    <>
      <EditMesa mesa={mesa} setShowFormEditar={setShowFormEditar} />
      <div
        className="w-max h-20 shadow border border-gray-500 relative bg-white text-center font-display text-xs tracking-tight text-gray-500"
      >
        <div className="flex gap-4 w-full px-6 transform -translate-y-1/2">
          {children}
        </div>
        {mesa?.nombre_mesa}
      </div>
    </>
  );
};





