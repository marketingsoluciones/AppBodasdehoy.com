import { FC, memo } from "react";
import HeaderComp from "./Sub-Componentes/HeaderComp";
interface propsPrincipalDE {
  componentState: any;
  setComponentState: any;

}

const PrincipalDE: FC<propsPrincipalDE> = ({ componentState, setComponentState }) => {
  return (
    <div className="w-[100%] h-[100vh] bg-slate-100 overflow-hidden flex flex-col pt-[20px]  box-border gap-[21px] tracking-[normal] text-left text-sm text-gray-600 font-medium mq416:pl-11 mq416:pr-11 mq416:box-border">
      <HeaderComp componentState={componentState} setComponentState={setComponentState}/>
      <div className="flex md:flex-row flex-col items-center justify-center gap-4">
        
        <div onClick={() => {
          setComponentState(2)
        }}
          className="cursor-pointer md:w-[550px] w-auto rounded-md bg-white shadow-[0px_16px_25px_-5px_rgba(0,_0,_0,_0.1),_0px_10px_10px_-5px_rgba(0,_0,_0,_0.04)] overflow-hidden flex flex-row items-start justify-start gap-[10.5px] md:min-w-[364px] min-w-[300px] max-w-full mq416:min-w-full">
          <img
            className=" md:w-[126px] w-[100px] h-[160px] relative overflow-hidden shrink-0 object-cover"
            loading="lazy"
            alt=""
            src="ModuloEvento/evento1.jpg"
          />
          <div className="w-full flex flex-col items-start justify-start pt-[10.5px] px-0 pb-0 box-border md:min-w-[238.1999999999971px]">
            <div className="self-stretch flex flex-col items-start justify-start gap-[50.5px]">
              <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px]">
                <div className="self-stretch flex flex-row items-end justify-start gap-[6.6px]">
                  
                  <div className="flex flex-row items-center justify-center">
                    <div className="flex flex-col items-start justify-start py-0 pr-[10.5px] pl-0 text-white">
                      <div className="rounded-[5.25px] bg-blue-400 flex flex-col items-start justify-start py-[3.5px] px-[7px]">
                        <div className="overflow-x-auto flex flex-row items-start justify-start py-0 pr-[2.5px] pl-0 gap-[4.4px]">
                          <div className="h-[17.5px] w-9 relative tracking-[2.45px] leading-[17.5px] uppercase font-extralight inline-block min-w-[36px] max-h-[17.5px] whitespace-nowrap">
                            Sab.
                          </div>
                          <b className="h-[17.5px] w-auto relative tracking-[2.45px] leading-[17.5px] uppercase inline-block min-w-[21px] max-h-[17.5px] whitespace-nowrap">
                            29
                          </b>
                          <div className="h-[17.5px] w-auto relative tracking-[2.45px] leading-[17.5px] uppercase font-extralight inline-block min-w-[36px] max-h-[17.5px] whitespace-nowrap">
                            Jun.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-1">

                    <div className="flex items-start justify-start">
                      <div className="w-auto h-[18px] relative tracking-[2.45px] leading-[18px] uppercase inline-block min-w-[47px] whitespace-nowrap">
                        00:00
                      </div>
                    </div>

                    <div className="w-auto flex items-start justify-start box-border ">
                      <div className="self-stretch h-[13px] relative tracking-[2.45px] leading-[12.25px] uppercase inline-block whitespace-nowrap">
                        <img className="text-gray-400" src="ModuloEvento/Symbol123.svg" alt="" />
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                    <div className="w-auto h-[18px] relative tracking-[2.45px] leading-[18px] uppercase inline-block min-w-[46px] whitespace-nowrap">
                      07:30
                    </div>
                  </div>

                  </div>
                  </div>

                </div>
                <h3 className="m-0 w-auto h-7 relative text-base leading-[28px] font-semibold font-inherit text-gray-600 inline-block  mq416:max-w-full">
                  Concierto de los Iracundos
                </h3>
              </div>
              <button className="cursor-pointer [border:none] pt-[3.5px] pb-[3px] px-1 bg-red rounded-[5.25px] flex flex-row items-start justify-start gap-[3.5px] opacity-[0.4]">
                <div className="h-[15px] flex flex-col items-start justify-start pt-0.5 px-0 pb-0 box-border">
                  <img
                    className="w-[9.2px] h-[13px] relative overflow-hidden shrink-0"
                    alt=""
                    src="ModuloEvento/ubi1.svg"
                  />
                </div>
                <div className="h-[18px] w-auto relative text-xs leading-[18px] font-medium text-white text-left inline-block ">
                  Banaoro / Rocafuerte y 25 de junio
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="w-[327.3px] bg-white rounded-md flex flex-col items-start justify-start pt-[7.5px] px-0 pb-0 box-border min-w-[327.3000000000029px] min-h-[160px] max-w-full text-center text-sm">
          <div className="self-stretch flex flex-col items-start justify-start">
            <div className="self-stretch rounded-2xs-5 bg-primary-contrast flex flex-col items-center justify-center pt-[21px] px-[21px] pb-[31.5px]">
              <div className="h-[35px] flex flex-col items-start justify-start">
                <img
                  className="w-[35px] h-[35px] relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/check123.svg"
                />
              </div>
              <div className="self-stretch flex flex-col items-start justify-start pt-[10.5px] px-0 pb-0">
                <div className="self-stretch flex flex-col items-center justify-start py-0 pr-1 pl-[3.7000000000043656px]">
                  <div className="self-stretch h-[42px] relative leading-[21px] inline-block text-gray-400 font-medium">
                    <p className="m-0 ">
                      Profesional autorizado y verificado para la
                    </p>
                    <p className="m-0">venta y distribución</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDE;