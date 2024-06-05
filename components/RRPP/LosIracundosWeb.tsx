import { FC } from "react";
import Footer from "./Sub-Componentes/Comp1";
import { BodyTicket } from "./Sub-Componentes/BodyTicket";
import { InfoHeader } from "./Sub-Componentes/InfoHeader";
import HeaderComp from "./Sub-Componentes/HeaderComp";
import { AuthContextProvider } from "../../context";

interface propsLosIracundosWeb {
  data?: any
}

const LosIracundosWeb: FC<propsLosIracundosWeb> = ({data }) => {
  const datafilter = data?.data?.filter(element => (element.metadata.grupo === "ticket"))
  return (
    <div className="w-full relative bg-gray-100 overflow-hidden flex flex-col items-end justify-start pt-5 px-0 pb-0 box-border gap-[50px] tracking-[normal] leading-[normal]  mq750:gap-[25px]">
      <HeaderComp logo={"ModuloEvento/LOGOMACHALA 1.png"} PageIndex={true} />
      <InfoHeader />
      <BodyTicket ticketsArray={datafilter} />
      <Footer />
    </div>
  );
};

export default LosIracundosWeb;
