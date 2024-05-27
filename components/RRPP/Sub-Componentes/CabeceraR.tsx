import { FC } from "react"
interface propsCabeceraR {
  componentState: any;
  setComponentState: any;

}

export const CabeceraR: FC <propsCabeceraR> =({componentState, setComponentState}) => {
    return(
      <section className="self-stretch flex flex-col  items-start justify-start py-0 md:px-10 gap-[10px] text-left text-sm text-gray-600 mq416:pr-[362px] mq416:box-border">
        
        <div className="flex flex-row items-start justify-start gap-[10px]">
          
          <div onClick={()=>{ 
        setComponentState(3)
      }} 
           className="cursor-pointer rounded-md bg-[#6096B9] flex flex-row items-center justify-center py-[10.5px] pr-[11.299999999995634px] pl-[11.400000000001455px]">
            <div className="flex flex-col items-start justify-start">
              <div className="h-3.5 flex flex-row items-start justify-start">
                <img
                  className="h-3.5 w-[12.3px] relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/flechablanca.svg"
                />
              </div>
            </div>
          </div>


          <div className="flex flex-col items-start justify-start gap-[10px] min-w-[155px]">
            <div className="self-stretch flex flex-row items-center justify-start gap-[9px]">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="h-[13px] w-[13.2px] relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/vre.svg"
                />
              </div>
              <div className="h-[18px] w-[217px] relative tracking-[2.45px] leading-[17.5px] uppercase font-medium inline-block">
                <b>Sabado</b>


                <span>, 29 Junio 2024</span>
              </div>
            </div>
            <div className="w-[138.7px] flex flex-row items-center justify-start gap-[6px]">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="h-[13px] w-[14.7px] relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/relog3.svg"
                />
              </div>
              <div className="h-[18px] flex-1 relative tracking-[2.45px] leading-[18px] uppercase font-medium inline-block whitespace-nowrap">
                {" "}
                00:00
              </div>
              <div className="h-[13px] w-[7px] text-xs relative tracking-[2.45px] leading-[12.25px] uppercase font-medium text-gray-400 flex items-center">
                /
              </div>
              <div className="h-[18px] flex-1 relative tracking-[2.45px] leading-[18px] uppercase font-medium inline-block whitespace-nowrap">
                {" "}
                07:30
              </div>
            </div>
          </div>

        </div>
        <div className="flex flex-col items-start justify-start text-xl text-[#6096B9]">
          <b className="w-auto h-[31.5px] relative leading-[31.5px] inline-block max-w-[1024px] max-h-[31.5px] mq416:max-w-full">
            Concierto de los Iracundos
          </b>
        </div>
      </section>
    )
}