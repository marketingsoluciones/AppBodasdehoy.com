import { FC, FunctionComponent, useState } from "react";
import { DatosComprador } from "./Sub-Componentes/DatosComprador";
import { DataArray } from "./Sub-Componentes/DataArray";
import { ResumenComponents } from "./Sub-Componentes/ResumenC";
import { CabeceraR } from "./Sub-Componentes/CabeceraR";
import { CheckCondition } from "./Sub-Componentes/CheckConition";
import HeaderComp from "./Sub-Componentes/HeaderComp";
interface propsRegistroEntradasUser {
    componentState: any;
    setComponentState: any;
  
  }

const RegistroEntradasUser: FC <propsRegistroEntradasUser> = ({componentState, setComponentState}) => {
  return (
    <div className="bg-slate-100 w-full h-full flex flex-col gap-4 items-center justify-start px-10 pt-10">
      <HeaderComp/>
      <div className="w-[100%] h-full text-left text-sm font-medium">

        <CabeceraR componentState={componentState} setComponentState={setComponentState}/>

        <div className="w-full right-[0px] left-[0px] flex flex-col items-start py-0 pl-0 box-border text-xl  text-gray">
          <div className="relative w-full leading-[31.5px] font-semibold inline-block max-h-[31.5px]">
            Concierto de los Iracundos
          </div>
        </div>
        <div className="w-full flex flex-row items-start justify-center py-0 pl-0 box-border gap-[21px] text-sm text-black">
          
            <div className="self-stretch flex flex-col items-center justify-start gap-[21px]">
            {
              DataArray.map((item,idx)=>{
                return(
                  <div key={idx}>
                  <DatosComprador idx={idx} item={item} />
                  </div>
                )
              })
            }

          <CheckCondition/>
            </div>
          

          <ResumenComponents componentState={componentState} setComponentState={setComponentState}/>
          
        </div>
      </div>
    </div>
  );
};

export default RegistroEntradasUser;