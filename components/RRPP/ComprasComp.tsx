import { FC } from "react";
import Checkbox from "./Checkbox1";
import Card1 from "./Sub-Componentes/Card";
import HeaderComp from "./Sub-Componentes/HeaderComp";

interface propsComprasComp {
    componentState: any;
    setComponentState: any;
  
  }

const ComprasComp: FC<propsComprasComp> = ({componentState, setComponentState}) => {
  return (
    <div className="w-[100%] h-[100%] bg-slate-100 pt[20px] [filter:blur(0px)] flex flex-col items-start justify-start pt-[20px] gap-[21px] tracking-[normal] leading-[normal] mq450:max-w-full mq725:max-w-full mq975:max-w-full mq1000:max-w-full">
      <HeaderComp componentState={componentState} setComponentState={setComponentState}/>
      <section className="self-stretch flex flex-col items-start justify-start gap-[10.5px] text-center text-7xl-3 px-10 text-gray-600 font-medium">
        <div className="self-stretch flex flex-col items-center justify-start py-0 px-5">
          <b className="relative leading-[32px] mq450:text-2xl mq450:leading-[25px]">
            Mis Compras
          </b>
        </div>
        <div className="self-stretch flex flex-col items-end justify-start">
          <button className="cursor-pointer [border:none] py-[3.5px] px-[7px] bg-gray-300 hover:bg-gray-500 rounded-[5.25px] flex flex-row items-center justify-end gap-[3.5px]">
            <div className="flex flex-row items-start justify-start">
        <Checkbox/>
            </div>
            <div className="relative text-xs leading-[18px] text-white text-center">
              Mostrar todos los tickets
            </div>
          </button>
        </div>
        <div className="self-stretch flex flex-col items-start justify-start py-0 pr-5 pl-0 text-left text-sm text-wwwfourvenuescom-santas-gray">
          <b className="relative tracking-[2.8px] leading-[21px] uppercase">
            diciembre,2024
          </b>
        </div>
        <div className="flex flex-wrap items-center justify-center">
        <Card1/>
        </div>
      </section>
      <section className="w-full flex flex-row items-start justify-center py-0 px-[262px] box-border text-center text-sm text-gray-600 mq450:pl-5 mq450:pr-5 mq450:box-border mq450:max-w-full mq725:pl-[131px] mq725:pr-[131px] mq725:box-border mq725:max-w-full mq975:max-w-full mq1000:max-w-full">
        <div className="flex-1 rounded-md box-border flex flex-col items-start justify-start pt-5 px-[21px] pb-6 gap-[10.8px] max-w-[500px] border-[1px] border-solid border-gray-300 mq725:max-w-full">
          <div className="self-stretch flex flex-row items-start justify-center text-[16px] text-wwwfourvenuescom-santas-gray">
            <div className="relative leading-[25px]">
              ¿No encuentras tu ticket?
            </div>
          </div>
          <div className="self-stretch flex flex-row items-start justify-start py-0 px-12 box-border max-w-full mq450:pl-6 mq450:pr-6 mq450:box-border">
            <div className="flex-1 flex flex-col items-end justify-start gap-[3px] max-w-full">
              <div className="relative leading-[21px] text-gray-400 ">
                Intenta recuperarlo rellenando los datos de tu compra:
              </div>
              <div className="self-stretch flex flex-row items-start justify-center py-0 pr-5 pl-[22px]">
                <button onClick={()=>{ 
        setComponentState(9)
      }}
                className="cursor-pointer [border:none] py-0 px-2.5 bg-[#6096B9] hover:bg-[#3f85b4] rounded-md flex flex-row items-end justify-start gap-[10.9px]">
                  <div className="flex flex-col items-start justify-end pt-0 px-0 pb-[10.5px]">
                    <img
                      className="w-[15.8px] h-3.5 relative overflow-hidden shrink-0"
                      alt=""
                      src="ModuloEvento/Vectorlapis.svg"
                    />
                  </div>
                  <div className="relative text-sm leading-[36px] font-medium text-white text-center inline-block min-w-[111px]">
                    Recuperar ticket
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="self-stretch flex flex-col items-center justify-start">
            <div className="self-stretch flex flex-col items-center justify-start py-0 px-2.5">
              <div className="relative leading-[21px] text-gray-400">
                O ponte en contacto con nuestro equipo de atención al cliente
                en:
              </div>
            </div>
            <div className="rounded-md bg-[#6096B9] hover:bg-[#3f85b4] flex flex-row items-center justify-start py-0 px-2.5 gap-[10.9px] z-[1] mt-[-0.5px] text-profourvenuescom-nero">
              <div className="flex flex-row items-start justify-center pt-0.5 px-0 pb-px">
                <div className="flex flex-row items-start justify-start">
                  <img
                    className="h-3.5 w-3.5 relative overflow-hidden shrink-0"
                    alt=""
                    src="ModuloEvento/Containermensaje.svg"
                  />
                </div>
              </div>
              <div className="relative leading-[36px] font-medium whitespace-nowrap text-white">
                soporte@fourvenues.com
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ComprasComp;
