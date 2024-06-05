import { FC } from "react";


const Card1: FC = () => {
  return (
    <div className="w-auto rounded-md bg-white shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] max-w-full overflow-hidden flex flex-row items-start justify-start md:leading-[normal] md:tracking-[normal]">

      <div className="md:h-[159px] h-[100%] w-[138.6px] relative shrink-0 [debug_commit:bf4bc93]">
        <img src="../ModuloEvento/evento1.jpg" alt="" />

      </div>

      <section className="h-[100%] flex flex-col items-start justify-between pt-[10.5px] px-2.5 pb-2.5 box-border relative min-w-[244px] min-h-[159px] md:gap-1 gap-10 max-w-full text-left text-sm text-gray-600 font-semibold mq401:flex-1">

        <div className="self-stretch flex flex-col items-start justify-start py-0 pr-px pl-0 md:gap-[10.5px] gap-1">
          <div className="self-stretch flex flex-row items-center justify-between md:gap-[20px] gap-2">
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
                    src="../ModuloEvento/Vectorflechita.svg"
                  />
                </div>
                <div className="flex-1 relative tracking-[2.45px] leading-[18px] uppercase inline-block min-w-[46px] whitespace-nowrap">
                  07:30
                </div>
              </div>


            </div>
            <div className="md:w-[87px] w-auto rounded-[5.25px] bg-green flex flex-col items-center justify-center py-[3.5px] pr-1 pl-1 box-border md:text-sm text-xs">
              <div className="relative tracking-[2.45px] leading-[18px] uppercase inline-blockmd:min-w-[75px] text-white">
                Entrada
              </div>
            </div>
          </div>
          <div className="self-stretch overflow-hidden flex flex-col items-start justify-start text-sm text-text-primary">
            <div className="self-stretch relative leading-[28px] font-semibold mq450:text-mid mq450:leading-[22px]">
              Concierto de los Iracundos
            </div>
          </div>
        </div>

        <div className="w-auto flex md:flex-row flex-col gap-1 items-start justify-start py-0 px-0 box-border">
          <button className="cursor-pointer [border:none] pt-[0.3px] pb-[0.2px] pr-[3px] pl-0 bg-[transparent] flex flex-col items-start justify-center">
            <div className="rounded-[5.25px] bg-[#3F3F46] flex flex-row items-center justify-start pt-[3px] px-[7px] pb-[3.5px] gap-[3.5px]">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="h-[13px] w-[9.2px] relative overflow-hidden shrink-0"
                  alt=""
                  src="../ModuloEvento/Vectordescarga.svg"
                />
              </div>
              <div className="relative md:text-sm text-xs leading-[18px] capitalize text-green text-left inline-block min-w-[60px]">
                Descargar
              </div>
            </div>
          </button>
          <button className="cursor-pointer [border:none] pt-[3.3px] px-[7px] pb-[3.7px] rounded-[5.25px] bg-[#3F3F46] flex flex-row items-center justify-start">
            <div className="flex flex-row items-start justify-start">
              <img
                className="h-[13px] w-[9.2px] relative overflow-hidden shrink-0"
                alt=""
                src="../ModuloEvento/Containerubicacion.svg"
              />
            </div>
            <div className="relative md:text-sm text-xs leading-[18px] text-gray-300 text-left inline-block min-w-[86px]">
              Banaoro / RocaFuerte Y 25 de junio
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Card1;
