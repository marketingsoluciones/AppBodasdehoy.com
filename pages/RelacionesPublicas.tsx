import { FC, useState } from "react";
import CancelarReserva from "../components/RRPP/CancelarReserva";
import ComprasComp from "../components/RRPP/ComprasComp";
import EntradasGratis from "../components/RRPP/EntradasGratis";
import LosIracundosWeb from "../components/RRPP/LosIracundosWeb";
import PrincipalDE from "../components/RRPP/PrincipalDE";
import ReciboEntradas from "../components/RRPP/ReciboEntradas";
import RecuperarCompra from "../components/RRPP/RecuperarCompra";
import RegistroEntradasUser from "../components/RRPP/RegistroEntradasUser";
import ReservaCantidad from "../components/RRPP/ReservaCantidad";
import ReservaDatos from "../components/RRPP/ReservaDatos";
import VentasEntradas from "../components/RRPP/VentasEntradas";


const RelacionesPublicas: FC = () => {
  const [optionSelect, setOptionSelect] = useState(0)
  const handleClickOption = (idx) => {
    setOptionSelect(idx);
  };

  const ticketsArray = [
    {
      title: "Entrada General",
      disponibilidad: true,
      fechaDisponibilidad: "10 junio",
      total: 61.75,
      subTotal: 55.50,
      nameRadioButton:"General0"
    }, {
      title: "Entrada General",
      disponibilidad: false,
      fechaDisponibilidad: null,
      total: 31.75,
      subTotal: 25.50,
      nameRadioButton:"General1"
    }, {
      title: "Mesa VIP",
      disponibilidad: true,
      fechaDisponibilidad: "10 junio",
      total: 31.75,
      subTotal: 25.50,
      nameRadioButton:"MesaVip"
    }, {
      title: "Reserva VIP + Whisky",
      disponibilidad: true,
      fechaDisponibilidad: "10 junio",
      total: 174.16,
      subTotal: 155.50,
      nameRadioButton:"ReservaVip"
    },

  ]

  const [ticket, setTicket] = useState(null)
  const [count, setCount] = useState<number>(1)


  


  const dataComponents = [
    /* 0 */
    {
      component: <LosIracundosWeb componentState={optionSelect} setComponentState={setOptionSelect} ticketsArray={ticketsArray} setTicket={setTicket} />
    },
    /* 1 */
    {
      component: <PrincipalDE componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 2 */
    {
      component: <VentasEntradas componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 3 */
    {
      component: <EntradasGratis componentState={optionSelect} setComponentState={setOptionSelect} ticketsArray={ticketsArray} ticket={ticket} setCount={setCount} count={count}  />
    },
    /* 4 */
    {
      component: <RegistroEntradasUser componentState={optionSelect} setComponentState={setOptionSelect} ticketsArray={ticketsArray}  ticket={ticket} count={count}  />
    },
    /* 5 */
    {
      component: <ReciboEntradas componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 6 */
    {
      component: <ReservaCantidad componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 7 */
    {
      component: <ReservaDatos componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 8 */
    {
      component: <CancelarReserva componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 9 */
    {
      component: <ComprasComp componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 10 */
    {
      component: <RecuperarCompra componentState={optionSelect} setComponentState={setOptionSelect} />
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