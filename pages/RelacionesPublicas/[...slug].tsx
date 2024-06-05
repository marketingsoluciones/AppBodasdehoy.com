import { FC, useEffect, useState } from "react";
import CancelarReserva from "./CancelarReserva";
import ComprasComp from "./ComprasComp";
import EntradasGratis from "./EntradasGratis";
import LosIracundosWeb from "../../components/RRPP/LosIracundosWeb";
import PrincipalDE from "./PrincipalDE";
import ReciboEntradas from "./ReciboEntradas";
import RecuperarCompra from "./RecuperarCompra";
import RegistroEntradasUser from "./RegistroEntradasUser";
import ReservaCantidad from "./ReservaCantidad";
import ReservaDatos from "./ReservaDatos";
import VentasEntradas from "./VentasEntradas";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useRouter } from "next/router";
import { AuthContextProvider } from "../../context";


const Slug = (params) => {
  const router = useRouter()
  const initialStage = router?.query?.stage
  const stage = initialStage && +initialStage
  const [optionSelect, setOptionSelect] = useState(stage != null ? stage : 0)
  const [data, setData] = useState({})
  const { EventTicket } = AuthContextProvider()

  console.log("event ticket", EventTicket)

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

  // //Array de componentes
  // const dataComponents = [
  //   /* 0 */
  //   {
  //     component: <LosIracundosWeb componentState={optionSelect} setComponentState={setOptionSelect} setTicket={setTicket} data={data} />
  //   },
  //   /* 1 */
  //   {
  //     component: <PrincipalDE componentState={optionSelect} setComponentState={setOptionSelect} />
  //   },
  //   /* 2 */
  //   {
  //     component: <VentasEntradas componentState={optionSelect} setComponentState={setOptionSelect} data={data} setTicket={setTicket} />
  //   },
  //   /* 3 */
  //   {
  //     component: <EntradasGratis componentState={optionSelect} setComponentState={setOptionSelect} ticket={ticket} setCount={setCount} count={count} data={data} />
  //   },
  //   /* 4 */
  //   {
  //     component: <RegistroEntradasUser componentState={optionSelect} setComponentState={setOptionSelect} ticket={ticket} count={count} data={data} />
  //   },
  //   /* 5 */
  //   {
  //     component: <ReciboEntradas componentState={optionSelect} setComponentState={setOptionSelect} />
  //   },
  //   /* 6 */
  //   {
  //     component: <ReservaCantidad componentState={optionSelect} setComponentState={setOptionSelect} />
  //   },
  //   /* 7 */
  //   {
  //     component: <ReservaDatos componentState={optionSelect} setComponentState={setOptionSelect} />
  //   },
  //   /* 8 */
  //   {
  //     component: <CancelarReserva componentState={optionSelect} setComponentState={setOptionSelect} />
  //   },
  //   /* 9 */
  //   {
  //     component: <ComprasComp componentState={optionSelect} setComponentState={setOptionSelect} />
  //   },
  //   /* 10 */
  //   {
  //     component: <RecuperarCompra componentState={optionSelect} setComponentState={setOptionSelect} />
  //   },

  // ]

  return (
    <div className="w-[100%] h-[100%] items-center justify-center">
      <div id="rootElement" />
      hola
      {/* {dataComponents[optionSelect].component} */}
    </div>
  );
};

export default Slug;

export async function getServerSideProps({ params }) {
  console.log(params)
  return {
    props: params,
  };
}