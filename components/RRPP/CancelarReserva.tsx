import { FC } from "react";
import HeaderComp from "./Sub-Componentes/HeaderComp";
interface propsCancelarReserva {
    componentState: any;
    setComponentState: any;
  
  }

const CancelarReserva: FC <propsCancelarReserva> = ({componentState, setComponentState}) => {
  return (
    <div className="w-[100%] h-[100vh] max-w-full flex flex-col items-center justify-center pt-[20px] box-border tracking-[normal] text-left text-xl text-[#6096B9]">
      <HeaderComp componentState={componentState} setComponentState={setComponentState}/>
      <div className="flex-1 flex flex-col items-center justify-center max-w-[700px] mq450:max-w-full mq650:max-w-full mq675:max-w-full">
        
        <div className="self-stretch flex flex-row items-start justify-center py-0 px-5">
          <div className="flex flex-col items-start justify-start pt-0 px-0 pb-3.5">
            <div className="flex flex-row items-center justify-center">
              <div className="flex flex-col items-start justify-start pt-[21px] pb-[10.5px] pr-px pl-0">
                <h3 className="m-0 relative text-inherit tracking-[4.2px] leading-[28px] uppercase font-bold font-inherit mq450:text-mid mq450:leading-[22px]">
                  Cancelar reserva
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="self-stretch  flex flex-row items-start justify-start pt-0 px-0 pb-[21px] box-border min-h-[521px] max-w-full text-sm text-black ">
          <div className="flex-1 rounded-md bg-white shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] overflow-hidden flex flex-col items-start justify-start pt-0 px-0 pb-[10.5px] box-border gap-[24.5px] min-h-[500px] max-w-full">
            <img
              className="self-stretch h-[200px] max-w-full overflow-hidden shrink-0 object-cover"
              loading="lazy"
              alt=""
              src="ModuloEvento/vip.jpg"
            />
            <div className="self-stretch flex flex-col items-start justify-start gap-[28px] max-w-full">
              <div className="self-stretch flex flex-col items-start justify-start gap-[17.5px] max-w-full">
                <div className="self-stretch flex flex-col items-start justify-start py-3.5 px-0">
                  <div className="self-stretch flex flex-col items-start justify-start py-[10.5px] pr-[534.2999999999993px] pl-[10.5px] mq450:pr-5 mq450:box-border">
                    <div className="flex flex-row items-center justify-start gap-[10.229999542236328px]">
                      <div className="relative leading-[13px] inline-block min-w-[11px]">
                        <img src="ModuloEvento/calcal.svg" alt="" />
                      </div>
                      <div className="relative text-sm leading-[21px] font-light font-www-fourvenues-com-es-christian-lanza1-success-hlruskh2900003j8e5u90hawff1v50hb-1358x573-default-inter-semi-bold-175">
                        29 Sab. Junio 2024
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-start gap-[12.8px] text-smi-3 text-www-fourvenues-com-es-christian-lanza1-my-tickets-booking-pls4z3fgj1gu901dw7c075ptv4hejjwd-cancel-b-81y931x9l-0c02b57039897024944853aa75818e88cd46dccdfaa53215199820ece72e9159-18106666259765625x764-default-nero">
                      <div className="h-[13px] w-2.5 relative leading-[12.25px] flex items-center">
                       
                      </div>
                      <div className="relative text-sm leading-[21px] font-light font-www-fourvenues-com-es-christian-lanza1-success-hlruskh2900003j8e5u90hawff1v50hb-1358x573-default-inter-semi-bold-175 text-text-primary inline-block min-w-[92px]">
                        Banaoro / Rocafuerte y 25 de junio
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-start gap-[10.229999542236328px]">
                      <div className="relative leading-[13px] inline-block min-w-[11px]">
                      <img src="ModuloEvento/humanci.svg" alt="" />
                      
                      </div>
                      <div className="relative text-sm leading-[21px] font-light font-www-fourvenues-com-es-christian-lanza1-success-hlruskh2900003j8e5u90hawff1v50hb-1358x573-default-inter-semi-bold-175 inline-block min-w-[9px]">
                        5
                      </div>
                    </div>
                  </div>
                </div>
                <div className="self-stretch flex flex-row items-start justify-center py-0 px-5 box-border max-w-full">
                  <div className="flex flex-row items-start justify-start max-w-full">
                    
                    <div className="h-5 w-2.5 relative rounded-tl-none rounded-tr-full rounded-br-full rounded-bl-none bg-black" />
                    
                    <div className="flex flex-col items-start justify-start pt-[5.5px] px-0 pb-0 box-border max-w-[calc(100%_-_20px)]">
                      
                      <div className="flex flex-row items-start justify-start gap-[1.5866666666666185px] mq450:flex-wrap">

                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>
                        <div className="h-[9px] w-6 rounded-md bg-black flex flex-col items-start justify-start p-0.5 box-border">
                          <div className="w-5 h-[5px] relative rounded-md bg-black hidden" />
                        </div>


                      </div>

                    </div>

                    <div className="h-5 w-2.5 relative rounded-tl-full rounded-tr-none rounded-br-none rounded-bl-full bg-black" />
                  
                  </div>
                </div>
              </div>
              <div className="w-[514.8px] flex flex-row items-start justify-center py-0 px-5 box-border max-w-full">
                <div className="flex flex-col items-start justify-start">
                  <div className="relative leading-[25px] font-semibold shrink-0 [debug_commit:f6aba90]">
                    Datos de contacto
                  </div>
                  <div className="relative text-sm leading-[21px] font-light text-gray-400 inline-block min-w-[94px] shrink-0 [debug_commit:f6aba90] mt-[-0.25px]">
                    christian lanza
                  </div>
                  <div className="flex flex-col items-start justify-start shrink-0 [debug_commit:f6aba90] mt-[-0.25px] text-xs text-gray-400">
                    <div className="flex flex-row items-start justify-start gap-[12.8px]">
                      <div className="w-2.5 flex flex-col items-start justify-start pt-1 px-0 pb-0 box-border">
                        <div className="self-stretch h-[13px] relative leading-[12.25px] flex items-center">
                          <img src="ModuloEvento/telefono.svg" alt="" />
                        </div>
                      </div>
                      <div className="relative text-sm leading-[21px] font-light  inline-block min-w-[108px] whitespace-nowrap">
                        +584127894772
                      </div>
                    </div>
                    <div className="flex flex-row items-start justify-start gap-[9.799999999999272px] text-smi-1 text-text-disabled">
                      <div className="flex flex-col items-start justify-start pt-1 px-0 pb-0">
                        <div className="relative leading-[13px] inline-block min-w-[13px]">
                          <img src="ModuloEvento/mensajeria.svg" alt="" />
                        </div>
                      </div>
                      <div className="relative text-sm leading-[21px] font-light whitespace-nowrap">
                        christian.lanza95@gmail.com
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="self-stretch flex flex-row items-start justify-center py-0 px-5">
          <button onClick={()=>{ 
        setComponentState(1)
      }} 
           className="cursor-pointer [border:none] p-0 bg-[transparent] w-[161.1px] flex flex-col items-start justify-start">
            <div className="self-stretch flex flex-row items-center justify-center">
              <div className="flex-1 rounded-md bg-[#6096B9] flex flex-col items-center justify-start pt-[9.80000000000291px] pb-[10.69999999999709px] pr-[8.099999999998545px] pl-2.5 whitespace-nowrap">
                <div className="self-stretch relative text-mid-5 leading-[25px] font-medium text-white text-center">
                  Cancelar reserva
                </div>
              </div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CancelarReserva;