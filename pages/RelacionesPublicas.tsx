import { FC, useState } from "react";
import CancelarReserva from "../components/RRPP/CancelarReserva";
import ComprasComp from "../components/RRPP/ComprasComp";
import EntradasGratis from "../components/RRPP/EntradasGratis";
import PrincipalDE from "../components/RRPP/PrincipalDE";
import ReciboEntradas from "../components/RRPP/ReciboEntradas";
import RegistroEntradasUser from "../components/RRPP/RegistroEntradasUser";
import ReservaCantidad from "../components/RRPP/ReservaCantidad";
import ReservaDatos from "../components/RRPP/ReservaDatos";
import VentasEntradas from "../components/RRPP/VentasEntradas";


const RelacionesPublicas: FC = () => {
  const [optionSelect, setOptionSelect] = useState(0)
  const handleClickOption = (idx) => {
    setOptionSelect(idx);
  };

  const dataComponents = [
    {
      component: <PrincipalDE componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <VentasEntradas componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <EntradasGratis componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <RegistroEntradasUser componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <ReciboEntradas componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <ReservaCantidad componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <ReservaDatos componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <CancelarReserva componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    {
      component: <ComprasComp componentState={optionSelect} setComponentState={setOptionSelect} />
    },
  ]

  return (
    <div className="w-[100%] h-[100%] items-center justify-center">
      <div id="rootElement" />
      {dataComponents[optionSelect].component}
    </div>
  );
};

export default RelacionesPublicas;