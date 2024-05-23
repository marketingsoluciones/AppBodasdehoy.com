import { FC } from "react";
import Comp1 from "./Sub-Componentes/Comp1";
import Comp2 from "./Sub-Componentes/Comp2";
import Comp3 from "./Sub-Componentes/Comp3";
interface propsLosIracundosWeb {
    componentState: any;
    setComponentState: any;
  
  }

const LosIracundosWeb: FC<propsLosIracundosWeb> = ({componentState, setComponentState}) => {
  return (
    <div className="w-full relative bg-gray-100 overflow-hidden flex flex-col items-end justify-start pt-5 px-0 pb-0 box-border gap-[50px] tracking-[normal] leading-[normal] mq750:gap-[25px]">
      <img
        className="w-full h-[768px] absolute !m-[0] top-[0px] right-[0px] left-[0px] max-w-full overflow-hidden shrink-0 object-cover"
        alt=""
        src="ModuloEvento/coffee_image.png"
      />
      <Comp3 componentState={componentState} setComponentState={setComponentState} />
      <Comp2 componentState={componentState} setComponentState={setComponentState}/>
      <Comp1 componentState={componentState} setComponentState={setComponentState}/>
    </div>
  );
};

export default LosIracundosWeb;
