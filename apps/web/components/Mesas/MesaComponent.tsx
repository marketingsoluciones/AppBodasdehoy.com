import { cloneElement, FC, ReactNode, useEffect, useState } from "react";
import { table } from '../../utils/Interfaces';
import { Chair } from "./Chair";
import { SentadoItem } from "./SentadoItem";
import { MesaImperial } from "./MesaImperial";
import { EventContextProvider } from "../../context";
import { MesaCuadradaNew } from "./MesaCuadrada";
import { MesaPodioNew } from "./MesaPodio";
import { MesaMilitar } from "./MesaMilitar";
import { Bancos } from "./Bancos";
import { MesaRedondaNew } from "./MesaRedonda";

interface propsMesaComponent {
  posicionRedonda: number;
  table: table;
  invitados: any[];
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
  redonda: tableType
  cuadrada: tableType
  podio: tableType
  bancos: tableType
  banco: tableType
  militar: tableType
};

const MesaComponent: FC<propsMesaComponent> = ({ posicionRedonda, table, invitados, setDisableWrapper, setShowFormEditar, disableDrag }) => {
  const { planSpaceActive } = EventContextProvider()
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
    redonda: posicionRedonda,
    cuadrada: [0, 90, 180, 270],
    podio: ArraySillas(),
    imperial: ArraySillas(),
  };

  const schemaGeneral: schemaType = {
    redonda: {
      position: posicionRedonda,
      component: <MesaRedonda table={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />,
      type: "radio",
    },
    cuadrada: {
      position: [0, 90, 180, 270],
      component: <MesaCuadrada table={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />,
      type: "radio",
    },
    podio: {
      position: ArraySillas(),
      component: <MesaPodio table={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />,
      type: "relative",
    },
    bancos: {
      position: ArraySillas(),
      component: <MesaBancos table={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />,
      type: "relative",
    },
    banco: {
      position: ArraySillas(),
      component: <Banco table={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />,
      type: "relative",
    },
    militar: {
      position: ArraySillas(),
      component: <Banco table={table} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />,
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
        <MesaImperial table={table} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />
      </>
    )
  }
  if (["cuadrada"].includes(table.tipo)) {
    return (
      <>
        <MesaCuadradaNew table={table} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />
      </>
    )
  }
  if (["podio"].includes(table.tipo)) {
    return (
      <>
        <MesaPodioNew table={table} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />
      </>
    )
  }
  if (["militar"].includes(table.tipo)) {
    return (
      <>
        <MesaMilitar table={table} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />
      </>
    )
  }
  if (["bancos"].includes(table.tipo)) {
    return (
      <>
        <Bancos table={table} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />
      </>
    )
  }
  if (["redonda"].includes(table.tipo)) {
    return (
      <>
        <MesaRedondaNew table={table} invitados={invitados} setDisableWrapper={setDisableWrapper} setShowFormEditar={setShowFormEditar} disableDrag={disableDrag} spaceChairs={planSpaceActive.spaceChairs} />
      </>
    )
  }
  return cloneElement(schemaGeneral[table.tipo].component, {
    cantidad_sillas: numberChair,
    children: nSillas?.map((elem, idx) => {
      const invitado = invitados.filter(element => element.chair == idx.toString())[0]
      return (
        <div key={idx} id="contentChair" className="">
          <Chair
            table={table}
            index={idx}
            position={elem}
            radio={45}
            className={schemaGeneral[table.tipo].type}>
            {invitado && <SentadoItem
              posicion={elem}
              invitado={invitado}
              setDisableWrapper={setDisableWrapper}
            />}
            <span />
          </Chair>
        </div>
      );
    }),
  });

};

export default MesaComponent;




export interface propsTableType {
  spaceChairs: number
  children?: ReactNode
  table: table
  setShowFormEditar: any
  disableDrag: any
}

const MesaRedonda: FC<propsTableType> = ({ children, table, setShowFormEditar, disableDrag, spaceChairs }) => {
  function getTanDeg(deg: number) {
    var rad = (deg * Math.PI) / 180;
    return Math.tan(rad);
  }
  const anguloOpuesto = 360 / table.numberChair / 2
  const adyacente = (spaceChairs / 2) / getTanDeg(anguloOpuesto)
  return (
    <>
      <div style={{ width: adyacente * 2, height: adyacente * 2 }} className="rounded-full transform bg-white shadow border border-gray-500 relative flex items-center justify-center">
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{table?.title}</p>
        {children}
      </div>
    </>
  );
};

const MesaCuadrada: FC<propsTableType> = ({ children, table, setShowFormEditar, disableDrag, spaceChairs }) => {
  const size = Math.ceil(table.numberChair / 4) * spaceChairs
  return (
    <>
      <div style={{ width: size, height: size }} className="shadow border border-gray-500 relative bg-white flex items-center justify-center" >
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{table?.title}</p>
        {children}
      </div>
    </>
  );
};

const MesaPodio: FC<propsTableType> = ({ children, table, setShowFormEditar, disableDrag, spaceChairs }) => {
  return (
    <>
      <div style={{ width: spaceChairs * table.numberChair, height: spaceChairs }} className="shadow border border-gray-500 relative bg-white text-center font-display text-xs tracking-tight text-gray-500" >
        <div className="flex gap-4 w-full px-6 transform -translate-y-1/2">
          {children}
        </div>
        {table?.title}
      </div>
    </>
  );
};

const MesaBancos: FC<propsTableType> = ({ children, table, setShowFormEditar, disableDrag, spaceChairs }) => {
  return (
    <>
      <div style={{ width: (spaceChairs) * table.numberChair, height: spaceChairs }} className="shadow border border-gray-500 relative bg-white flex items-center justify-center" >
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{table?.title}</p>
        {children}
      </div>
    </>
  );
};

const Banco: FC<propsTableType> = ({ children, table, setShowFormEditar, disableDrag, spaceChairs }) => {
  return (
    <>
      <div style={{ width: (spaceChairs) * table.numberChair, height: spaceChairs }} className="shadow border border-gray-500 relative bg-white flex items-center justify-center rounded-full scale-[0.6]" >
        <p className="font-display text-xs text-center mx-2 leading-[12px] tracking-tight text-gray-500">{table?.title}</p>
        {children}
      </div>
    </>
  );
};




