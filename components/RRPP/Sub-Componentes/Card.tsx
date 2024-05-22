import { FC } from "react";


const Card1: FC = () => {
  return (
    <div className="w-auto rounded-md bg-gray-100 shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] max-w-full overflow-hidden flex flex-row items-start justify-start leading-[normal] tracking-[normal] [row-gap:20px]">

        <div className="h-[159px] w-[138.6px] relative shrink-0 [debug_commit:bf4bc93]">
          <img src="ModuloEvento/evento1.jpg" alt="" />
      
      </div>

      <section className="flex flex-col items-start justify-start pt-[10.5px] px-2.5 pb-2.5 box-border relative min-w-[244px] min-h-[159px] max-w-full text-left text-sm text-gray-600 font-semibold mq401:flex-1">
        <div className="self-stretch flex flex-col items-start justify-start py-0 pr-px pl-0 gap-[10.5px]">
          <div className="self-stretch flex flex-row flex-wrap items-center justify-between gap-[20px]">
            <div className="w-auto flex flex-col items-start justify-start py-0 pr-2.5 pl-0 box-border">
             

                  <div className="flex flex-col items-start justify-start">
                    <div className="relative tracking-[2.45px] leading-[17.5px] uppercase inline-block">
                      <span className="font-extralight">sáb.</span> 
                      <b>28</b>
                      <span className="font-extralight">dic.</span>
                      
                    </div>
                  </div>
                  
                <div className="flex-1 flex flex-row items-center justify-start gap-[0.5px] ml-[-2px]">
                  <div className="flex-1 relative tracking-[2.45px] leading-[18px] uppercase whitespace-nowrap">
                    00:00 
                  </div>
                  <div className="flex flex-row items-start justify-start">
                    <img
                      className="h-[13px] w-[13.2px] relative overflow-hidden shrink-0"
                      loading="lazy"
                      alt=""
                      src="/icon1.svg"
                    />
                  </div>
                  <div className="flex-1 relative tracking-[2.45px] leading-[18px] uppercase inline-block min-w-[46px] whitespace-nowrap">
                    07:30
                  </div>
                </div>

              
            </div>
            <div className="w-[87px] rounded-[5.25px] bg-wwwfourvenuescom-elm flex flex-col items-start justify-start py-[3.5px] pr-1 pl-1.5 box-border text-profourvenuescom-nero">
              <div className="relative tracking-[2.45px] leading-[18px] uppercase inline-block min-w-[75px]">
                Entrada
              </div>
            </div>
          </div>
          <div className="self-stretch overflow-hidden flex flex-col items-start justify-start text-2xl text-text-primary">
            <div className="self-stretch relative leading-[28px] font-semibold mq450:text-mid mq450:leading-[22px]">
              Playa y rumba
            </div>
          </div>
        </div>
        <div className="!m-[0] absolute w-[52.65%] right-[44.55%] bottom-[10px] left-[2.8%] flex flex-row items-start justify-start py-0 px-0 box-border">
          <button className="cursor-pointer [border:none] pt-[0.3px] pb-[0.2px] pr-[3px] pl-0 bg-[transparent] flex flex-col items-start justify-center">
            <div className="rounded-[5.25px] bg-wwwfourvenuescom-ship-gray flex flex-row items-center justify-start pt-[3px] px-[7px] pb-[3.5px] gap-[3.5px]">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="h-[13px] w-[9.2px] relative overflow-hidden shrink-0"
                  alt=""
                  src="/icon-1.svg"
                />
              </div>
              <div className="relative text-smi-3 leading-[18px] capitalize font-profourvenuescom-inter-bold-14 text-wwwfourvenuescom-shamrock text-left inline-block min-w-[60px]">
                Descargar
              </div>
            </div>
          </button>
          <button className="cursor-pointer [border:none] pt-[3.3px] px-[7px] pb-[3.7px] bg-wwwfourvenuescom-ship-gray rounded-[5.25px] flex flex-row items-center justify-start">
            <div className="flex flex-row items-start justify-start">
              <img
                className="h-[13px] w-[9.2px] relative overflow-hidden shrink-0"
                alt=""
                src="/icon-2.svg"
              />
            </div>
            <div className="relative text-smi-3 leading-[18px] font-profourvenuescom-inter-bold-14 text-wwwfourvenuescom-santas-gray text-left inline-block min-w-[86px]">
               Beach Aguilas
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Card1;
