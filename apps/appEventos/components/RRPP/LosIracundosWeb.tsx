import { FC } from "react";
import Footer from "./Sub-Componentes/Comp1";
import { BodyTicket } from "./Sub-Componentes/BodyTicket";
import { InfoHeader } from "./Sub-Componentes/InfoHeader";
import HeaderComp from "./Sub-Componentes/HeaderComp";

interface propsLosIracundosWeb {
  data?: any
}

const LosIracundosWeb: FC<propsLosIracundosWeb> = ({ data }) => {
  const datafilter = data?.data?.filter(element => (element.metadata.grupo === "ticket"))
  return (
    <div className="w-full bg-gray-100 flex flex-col box-border gap-[50px]">
      <HeaderComp logo={"ModuloEvento/LOGOMACHALA 1.png"} PageIndex={true} />
      <InfoHeader />
      <BodyTicket ticketsArray={datafilter} />
      <Footer />
    </div>
  );
};

export default LosIracundosWeb;
