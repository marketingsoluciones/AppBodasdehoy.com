import { FC, useEffect, useState } from "react";
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
import { fetchApiBodas, queries } from "../utils/Fetching";


const RelacionesPublicas: FC = () => {
  const [optionSelect, setOptionSelect] = useState(4)
  const [data, setData] = useState({})

  //
  /* const handleClickOption = (idx) => {
    setOptionSelect(idx);
  }; */

  //fetch para obtener la data de todos los productos de stripe
  useEffect(() => {
    const fetchData = async () => {
      const data = JSON.parse(await fetchApiBodas({
        query: queries.getAllProducts,
        variables: {},
        development: "bodasdehoy"
      }));
      const asd = data.reduce((acc, item) => {
        if (!acc.modulos.includes(item.metadata.grupo)) {
          acc.modulos.push(item.metadata.grupo)
        }
        return acc
      }, { modulos: [] })
      setData({ data, ...asd })
    }
    fetchData()
  }, [optionSelect])

  //Estado que almacena el ticket seleccionado 
  const [ticket, setTicket] = useState(null)

  //Estado que almacena el numero de ticket que se quieren comprar 
  const [count, setCount] = useState<number>(1)

  //Funcion que reinicia elcontador de tickets si el componente que se renderiza es menor a 3 en el array de componentes
  useEffect(() => {
    if (optionSelect < 3) {
      setCount(1)
    }
  }, [optionSelect])

  //Array de componentes
  const dataComponents = [
    /* 0 */
    {
      component: <LosIracundosWeb componentState={optionSelect} setComponentState={setOptionSelect} setTicket={setTicket} data={data} />
    },
    /* 1 */
    {
      component: <PrincipalDE componentState={optionSelect} setComponentState={setOptionSelect} />
    },
    /* 2 */
    {
      component: <VentasEntradas componentState={optionSelect} setComponentState={setOptionSelect} data={data} setTicket={setTicket} />
    },
    /* 3 */
    {
      component: <EntradasGratis componentState={optionSelect} setComponentState={setOptionSelect} ticket={ticket} setCount={setCount} count={count} data={data} />
    },
    /* 4 */
    {
      component: <RegistroEntradasUser componentState={optionSelect} setComponentState={setOptionSelect} ticket={ticket} count={count} data={data}/>
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