import { FC, memo } from "react";
interface propsPrincipalDE {
    componentState: any;
    setComponentState: any;
  
  }

const PrincipalDE: FC <propsPrincipalDE> = ({componentState,setComponentState}) => {
  return (
    <div className="w-[100%] h-[100%] bg-slate-100 overflow-hidden flex flex-row items-start justify-center pt-[40.5px] px-[88px] box-border gap-[21px] tracking-[normal] text-left text-sm text-gray-600 font-medium mq416:pl-11 mq416:pr-11 mq416:box-border">
      <div onClick={()=>{ 
        setComponentState(1)
      }} 
      className="cursor-pointer w-[550px] rounded-md bg-white shadow-[0px_16px_25px_-5px_rgba(0,_0,_0,_0.1),_0px_10px_10px_-5px_rgba(0,_0,_0,_0.04)] overflow-hidden flex flex-row items-start justify-start gap-[10.5px] min-w-[364px] max-w-full mq416:min-w-full">
        <img
          className="h-[] w-[126px] relative overflow-hidden shrink-0 object-cover"
          loading="lazy"
          alt=""
          src="ModuloEvento/evento1.jpg"
        />
        <div className="w-full flex flex-col items-start justify-start pt-[10.5px] px-0 pb-0 box-border min-w-[238.1999999999971px]">
          <div className="self-stretch flex flex-col items-start justify-start gap-[50.5px]">
            <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px]">
              <div className="self-stretch flex flex-row items-end justify-start gap-[6.6px]">
                <div className="flex flex-row items-start justify-start">
                  <div className="flex flex-col items-start justify-start py-0 pr-[10.5px] pl-0 text-white">
                    <div className="rounded-[5.25px] bg-rosa flex flex-col items-start justify-start py-[3.5px] px-[7px]">
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
                  <div className="flex flex-col items-start justify-start pt-[3.5px] pb-0 pr-[3px] pl-0">
                    <div className="w-auto h-[18px] relative tracking-[2.45px] leading-[18px] uppercase inline-block min-w-[47px] whitespace-nowrap">
                      00:00
                    </div>
                  </div>
                  <div className="w-auto flex flex-col items-start justify-start pt-[5.5px] px-0 pb-0 box-border font-www-fourvenues-com-es-christian-lanza1-events-playa-y-rumba-29-02-2024-81y9-tickets-clrusb7w7018g01aeancrb2z0sg4m98f-1358x573-default-font-awesome-5-free-regular-123-upper">
                    <div className="self-stretch h-[13px] relative tracking-[2.45px] leading-[12.25px] uppercase inline-block whitespace-nowrap">
                      <img className="text-gray-400" src="ModuloEvento/Symbol123.svg" alt="" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start justify-end pt-0 px-0 pb-[3px]">
                  <div className="w-auto h-[18px] relative tracking-[2.45px] leading-[18px] uppercase inline-block min-w-[46px] whitespace-nowrap">
                    07:30
                  </div>
                </div>
              </div>
              <h3 className="m-0 w-auto h-7 relative text-2xl leading-[28px] font-semibold font-inherit text-text-primary inline-block max-w-[528.6599731445312px] mq416:max-w-full">
                Concierto de los Iracundos
              </h3>
            </div>
            <button className="cursor-pointer [border:none] pt-[3.5px] pb-[3px] pr-1.5 pl-[7px] bg-rosa rounded-[5.25px] flex flex-row items-start justify-start gap-[3.5px] opacity-[0.4]">
              <div className="h-[15px] flex flex-col items-start justify-start pt-0.5 px-0 pb-0 box-border">
                <img
                  className="w-[9.2px] h-[13px] relative overflow-hidden shrink-0"
                  alt=""
                  src="ModuloEvento/ubi1.svg"
                />
              </div>
              <div className="h-[18px] w-auto relative text-smi-3 leading-[18px] font-medium text-white text-left inline-block min-w-[82px]">
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
  );
};

export default PrincipalDE;