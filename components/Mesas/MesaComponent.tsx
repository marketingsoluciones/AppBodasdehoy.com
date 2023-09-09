import { cloneElement, FC, ReactNode, useEffect, useState } from "react";
import { guests, table } from '../../utils/Interfaces';
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";
import { MesaImperial } from "./MesaImperial";
import { EditMesa } from "./EditMesa";

interface propsMesaComponent {
  posicion: number;
  table: table;
  invitados: guests[];
  setDisableWrapper: any
  setShowFormEditar: any
  disableDrag: any
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

const MesaComponent: FC<propsMesaComponent> = ({ posicion, table, invitados, setDisableWrapper, setShowFormEditar, disableDrag }) => {
  const { numberChair } = table;
  const [nSillas, setNSillas] = useState([]);

  // Crear array a partir de un numero para poder renderizar sillas
  const ArraySillas: CallableFunction = (): number[] => {
    let arr = [];
    for (let i = 0; i < table?.numberChair; i++) {
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
      component: <MesaRedonda mesa={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} />,
      type: "radio",
    },
    cuadrada: {
      position: [0, 90, 180, 270],
      component: <MesaCuadrada mesa={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} />,
      type: "radio",
    },
    podio: {
      position: ArraySillas(),
      component: <MesaPodio mesa={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} />,
      type: "relative",
    },
  };

  // Setear estado con el array correspondiente
  useEffect(() => {
    setNSillas(posiciones[table?.tipo]);
  }, []);

  if (["imperial"].includes(table.tipo)) {
    return (
      <>
        <MesaImperial table={table} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} />
      </>
    )
  } else {
    return cloneElement(schemaGeneral[table.tipo].component, {
      cantidad_sillas: numberChair,
      children: nSillas?.map((valor, idx) => {
        const invitado = invitados.filter(element => element.puesto == idx.toString())[0]
        return (
          <>
            <Chair
              key={idx}
              index={idx}
              tipoMesa={table?.tipo}
              position={valor}
              title={table?.title}
              className={schemaGeneral[table.tipo].type}
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
  disableDrag: any
}

const MesaRedonda: FC<propsTableType> = ({ children, mesa, setShowFormEditar, disableDrag }) => {
  return (
    <>
      <EditMesa mesa={mesa} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} />
      <div
        className="rounded-full transform bg-white w-20 h-20 shadow border border-gray-500 relative flex items-center justify-center"
      >
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{mesa?.title}</p>
        {children}
      </div>
    </>
  );
};

const MesaCuadrada: FC<propsTableType> = ({ children, mesa, setShowFormEditar, disableDrag }) => {
  return (
    <>
      <EditMesa mesa={mesa} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} />
      <div
        className="w-20 h-20 shadow border border-gray-500 relative bg-white flex items-center justify-center"
      >
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{mesa?.title}</p>
        {children}
      </div>
    </>
  );
};

const MesaPodio: FC<propsTableType> = ({ children, mesa, setShowFormEditar, disableDrag }) => {
  return (
    <>
      <EditMesa mesa={mesa} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} />
      <div
        className="w-max h-20 shadow border border-gray-500 relative bg-white text-center font-display text-xs tracking-tight text-gray-500"
      >
        <div className="flex gap-4 w-full px-6 transform -translate-y-1/2">
          {children}
        </div>
        {mesa?.title}
      </div>
    </>
  );
};





