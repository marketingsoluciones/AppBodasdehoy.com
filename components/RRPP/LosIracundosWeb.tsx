import { FC } from "react";
import Footer from "./Sub-Componentes/Comp1";
import Comp2 from "./Sub-Componentes/Comp2";
import Comp3 from "./Sub-Componentes/Comp3";
import Header from "./Sub-Componentes/MenuComp";

interface propsLosIracundosWeb {
  setTicket: any;
  data: any;
}

const LosIracundosWeb: FC<propsLosIracundosWeb> = ({ setTicket, data }) => {
  const datafilter = data?.data?.filter(element => (element.metadata.grupo === "ticket"))
  return (
    <div className="w-full relative bg-gray-100 overflow-hidden flex flex-col items-end justify-start pt-5 px-0 pb-0 box-border gap-[50px] tracking-[normal] leading-[normal]  mq750:gap-[25px]">
      <Header />
      <Comp3 />
      <Comp2 ticketsArray={datafilter} setTicket={setTicket} />
      <Footer />
    </div>
  );
};

export default LosIracundosWeb;
