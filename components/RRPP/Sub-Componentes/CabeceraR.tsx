import { FC } from "react"
interface propsCabeceraR {
  componentState: any;
  setComponentState: any;

}

export const CabeceraR: FC <propsCabeceraR> =({componentState, setComponentState}) => {
    return(
      <section className="w-[100%] flex flex-row items-start justify-start box-border max-w-full text-left text-sm text-gray-600 font-medium pb-5">
      <div className="flex flex-col items-start justify-start gap-[10px] max-w-full">
        <div className="flex flex-row items-center justify-start py-0 pr-4 pl-0 gap-[10px]">
          <div onClick={()=>{ 
        setComponentState(3)
      }}
          className="cursor-pointer rounded-md bg-[#6096B9] hover:bg-[#428bbd] flex flex-row items-center justify-center py-[10.5px] px-[11px]">
            <div className="flex flex-col items-start justify-start py-0 pr-px pl-0">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="relative w-auto h-auto overflow-hidden shrink-0"
                  loading="eager"
                  alt=""
                  src="ModuloEvento/FlechaIzquerda2.svg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start justify-start gap-[10px]">
            <div className="flex flex-row items-center justify-start gap-[9px] ">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="relative w-[13.2px] h-[13px] overflow-hidden shrink-0"
                  loading="eager"
                  alt=""
                  src="ModuloEventos/FlechaIzquierda.svg"
                />
              </div>
              <div className="relative tracking-[2.45px] leading-[17.5px] uppercase">
                <b>Sabado</b>
                <span>, 29 Junio 2024</span>
              </div>
            </div>
            <div className="w-[141.73px] flex flex-row items-center justify-start gap-[6px]">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="relative w-[14.7px] h-[13px] overflow-hidden shrink-0"
                  loading="eager"
                  alt=""
                  src="/icon2.svg"
                />
              </div>
              <div className="flex-1 relative tracking-[2.45px] leading-[17.5px] uppercase shrink-0 whitespace-nowrap">
                {" "}
                00:00
              </div>
              <div className="relative tracking-[2.45px] leading-[12.25px] uppercase font-www-fourvenues-com-es-christian-lanza1-my-tickets-booking-pls4z3fgj1gu901dw7c075ptv4hejjwd-cancel-b-81y931x9l-0c02b57039897024944853aa75818e88cd46dccdfaa53215199820ece72e9159-18106666259765625x764-default-font-awesome-5-free-regular-1211 text-www-fourvenues-com-es-christian-lanza1-my-tickets-booking-pls4z3fgj1gu901dw7c075ptv4hejjwd-cancel-b-81y931x9l-0c02b57039897024944853aa75818e88cd46dccdfaa53215199820ece72e9159-18106666259765625x764-default-santas-gray flex items-center shrink-0">
                
              </div>
              <div className="flex-1 relative tracking-[2.45px] leading-[17.5px] uppercase shrink-0 whitespace-nowrap">
                {" "}
                07:30
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    )
}