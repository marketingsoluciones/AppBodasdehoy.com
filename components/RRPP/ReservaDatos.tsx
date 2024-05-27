import { FC } from "react";
import Checkbox from "../RRPP/Checkbox1";
import HeaderComp from "./Sub-Componentes/HeaderComp";
interface propsReservaDatos {
    componentState: any;
    setComponentState: any;
  
  }

const ReservaDatos: FC <propsReservaDatos> = ({componentState, setComponentState}) => {
  return (
    <div className="w-[100%] md:h-[100vh] h-[100%] max-w-full flex flex-col items-center justify-center px-[12px] pt-[20px] box-border tracking-[normal] text-center text-sm text-[#6096B9] ">
      <HeaderComp componentState={componentState} setComponentState={setComponentState}/>
      <div className="rounded-md bg-white shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] box-border overflow-hidden flex flex-col items-start justify-start pt-px px-0 pb-[22.5px] gap-[61px] max-w-full border-[1px] border-solid border-divider mq450:gap-[30px_61px]">
        
      <div className="w-full bg-gray-100 flex flex-row items-center justify-between pt-[10.5px] px-[21px] pb-[13.5px] box-border max-w-full gap-[20px] mq450:flex-wrap">
          <div className="flex flex-row items-start justify-start md:gap-[154.90000000000146px] max-w-full mq450:flex-wrap mq450:gap-[154.9px_77px]">
            
            <button onClick={()=>{ 
        setComponentState(6)
      }} 
             className="cursor-pointer [border:none] py-0 pr-[10.5px] pl-0 bg-[transparent] flex flex-col items-start justify-start">
              <div className="rounded-md bg-[#6096B9] flex flex-row items-center justify-center py-[10.5px] px-[11px]">
                <div className="w-[13px] flex flex-col items-start justify-start">
                  <div className="h-3.5 flex flex-row items-start justify-start">
                    <img
                      className="h-3.5 w-[12.3px] relative overflow-hidden shrink-0"
                      alt=""
                      src="ModuloEvento/FlechaIzquerda2.svg"
                    />
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div className="flex flex-row items-end justify-start gap-[5.899999999997817px]">
              <div className="h-[13px] flex flex-col items-start justify-end pt-0 px-0 pb-[3px] box-border">
                <img
                  className="w-[9.2px] h-2.5 relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/calendar1.svg"
                />
              </div>
              <div className="flex flex-col items-start justify-center">
                <div className="flex flex-row items-start justify-center ">
                  <b className="w-auto relative leading-[21px] flex items-center justify-center max-w-[465px] mq450:max-w-full">
                    Concierto de los Iracundos
                  </b>
                </div>
                <div className="relative text-2xs-5 leading-[14px] text-gray-600 whitespace-nowrap">
                  <b>Sabado</b>
                  <span>, 29 de Junio 2024</span>
                </div>
              </div>
            </div>
          <div className="flex flex-col items-start justify-start">
            <div className="rounded-md bg-[#6096B9] flex flex-row items-center justify-center py-[10.5px] px-[13px]">
              <div className="w-[9px] flex flex-col items-end justify-start">
                <div className="h-3.5 flex flex-row items-start justify-start">
                  <img
                    className="h-3.5 w-[8.8px] relative overflow-hidden shrink-0"
                    loading="lazy"
                    alt=""
                    src="ModuloEvento/equis2.svg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="self-stretch flex flex-row items-start justify-start py-0 px-5 box-border max-w-full text-xs text-black">
          <div className="flex-1 flex flex-col items-end justify-start gap-[21px] max-w-full">
            
          <div className="self-stretch rounded-md bg-gray-100 flex flex-col items-start justify-start p-[10.5px]">
              
              <div className="self-stretch flex flex-row items-start md:justify-start justify-between [row-gap:20px]">
                
                <div className="md:flex-1 flex flex-col items-start justify-start md:min-w-[262px]">
                  
                  <div className="self-stretch flex flex-col items-start justify-start">
                    
                    <div className="self-stretch flex flex-col items-center justify-start py-0 md:px-5 opacity-[0.5]">
                      <b className="md:w-full w-auto relative leading-[14px] uppercase md:inline-block md:min-w-[31px] md:max-w-[267.5px]">
                        Zona
                      </b>
                    </div>

                    <div className="self-stretch flex flex-col items-center justify-start py-0 px-5">
                      <div className="md:w-full w-auto relative leading-[14px] md:inline-block md:min-w-[18px] md:max-w-[267.5px]">
                        VIP
                      </div>
                    </div>

                  </div>

                </div>

                <div className="md:flex-1 flex flex-col items-start justify-start md:min-w-[262px]">
                  <div className="self-stretch flex flex-col items-start justify-start">
                    
                    <div className="self-stretch flex flex-col items-center justify-start py-0 px-5 opacity-[0.5]">
                      <b className="w-full relative leading-[14px] uppercase inline-block min-w-[22px] max-w-[267.5px]">
                        Pax
                      </b>
                    </div>

                    <div className="self-stretch flex flex-col items-center justify-start py-0 px-5">
                      <b className="w-full relative leading-[14px] inline-block min-w-[5px] max-w-[267.5px]">
                        -
                      </b>
                    </div>

                  </div>
                </div>
              </div>
            </div>



            <div className="self-stretch flex flex-col items-start justify-start pt-0 px-0 pb-[9.5px] box-border gap-[1px] max-w-full text-left text-sm">
              <div className="flex flex-row items-start justify-start pt-0 px-0 pb-[7px]">
                <div className="relative leading-[21px] font-semibold inline-block max-w-[556px] mq650:max-w-full">
                  Nombre y apellidos
                </div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start pt-0 px-0 pb-[7px] box-border max-w-full">
                <input
                  className="[outline:none] bg-divider h-9 flex-1 rounded-md bg-gray-100 box-border flex flex-row items-start justify-start py-0 px-[11.5px] text-sm text-gray-600 min-w-[250px] max-w-full border-[1px] border-solid border-slate-200"
                  placeholder="christian lanza"
                  type="text"
                />
              </div>
              <div className="flex flex-row items-start justify-start pt-0 px-0 pb-[7px]">
                <div className="relative leading-[21px] font-semibold inline-block min-w-[127px] max-w-[556px] mq650:max-w-full">
                  Correo electrónico
                </div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start pt-0 px-0 pb-[7px] box-border max-w-full">
                <input
                  className="[outline:none] bg-divider h-9 flex-1 rounded-md bg-gray-100  box-border flex flex-row items-start justify-start py-0 px-[11.5px] font-www-fourvenues-com-es-christian-lanza1-success-hlruskh2900003j8e5u90hawff1v50hb-1358x573-default-inter-semi-bold-175 text-sm text-gray-600 min-w-[250px] max-w-full border-[1px] border-solid border-divider"
                  placeholder="christian.lanza95@gmail.com"
                  type="text"
                />
              </div>
              <div className="flex flex-row items-start justify-start pt-0 px-0 pb-[7px]">
                <div className="relative leading-[21px] font-semibold inline-block max-w-[556px] mq650:max-w-full">
                  Repetir correo electrónico
                </div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start pt-0 px-0 pb-[7px] box-border max-w-full">
                <input
                  className="[outline:none] bg-divider h-9 flex-1 relative rounded-md bg-gray-100  box-border min-w-[250px] max-w-full border-[1px] border-solid border-divider"
                  type="text"
                />
              </div>
              <div className="flex flex-row items-start justify-start pt-0 px-0 pb-[7px]">
                <div className="relative leading-[21px] font-semibold inline-block min-w-[59px] max-w-[556px] mq650:max-w-full">
                  Teléfono
                </div>
              </div>
              <input
                className="w-full [outline:none] bg-divider self-stretch h-9 rounded-md bg-gray-100  box-border flex flex-row items-start justify-start py-0 px-[11.5px] font-www-fourvenues-com-es-christian-lanza1-success-hlruskh2900003j8e5u90hawff1v50hb-1358x573-default-inter-semi-bold-175 text-sm text-gray-600 min-w-[250px] border-[1px] border-solid border-divider"
                placeholder="+ 58 412-7894772"
                type="text"
              />
              <div className="flex flex-row items-start justify-start pt-0 px-0 pb-[7px] text-2xs-5 text-www-fourvenues-com-es-christian-lanza1-events-playa-y-rumba-29-02-2024-81y9-bookings-zlrusb8e4018t01ae84j56355yjdc6j7-2-1358x573-default-cinnabar">
                <div className="relative leading-[14px] inline-block max-w-[556px] mq650:max-w-full">
                  Introducir un teléfono válido.
                </div>
              </div>
              <div className="flex flex-row items-start justify-start pt-0 px-0 pb-[7px]">
                <div className="relative leading-[21px] font-semibold inline-block min-w-[103px] max-w-[556px] mq650:max-w-full">
                  Observaciones
                </div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start pt-0 px-0 pb-5 box-border max-w-full">
                <input
                  className="[outline:none] bg-gray-100 h-[58px] flex-1 relative rounded-[5.25px] box-border overflow-hidden min-w-[250px] max-w-full border-[1px] border-solid border-www-fourvenues-com-es-christian-lanza1-events-playa-y-rumba-29-02-2024-81y9-bookings-zlrusb8e4018t01ae84j56355yjdc6j7-2-1358x573-default-ship-gray"
                  type="text"
                />
              </div>
              <div className="flex flex-row items-end justify-start pt-0 px-0 pb-5 box-border gap-[3.4px] max-w-full text-text-disabled">

                <div className="self-stretch flex flex-row items-center justify-start py-[3.5px] px-0 box-border">             
        <Checkbox/>
                  <div className="text-sm text-gray-400">
                  Quiero recibir información sobre eventos o promociones de <b>EventosOrganizador</b>
                  </div>                
                  <span>.</span>
                </div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start pt-0 px-0 pb-5 box-border max-w-full text-xs text-gray-600">
                <div className="flex-1 rounded-md bg-gray-100 flex flex-row flex-wrap items-end justify-start p-[10.5px] box-border gap-[11.299999999999272px] max-w-full">
                  <div className="flex-1 flex flex-col items-start justify-end pt-0 px-0 pb-0.5 box-border min-w-[281px] max-w-full">
                    <div className="relative leading-[14px]">
                      <span>{`Al hacer clic en `}</span>
                      <b>Hacer reserva</b>
                      <span>{` aceptas los términos y condiciones de uso del sitio web. `}</span>
                    </div>
                  </div>
                  <div className="flex flex-row items-end justify-start">
                    <div className="flex flex-col items-start justify-end pt-0 px-0 pb-0.5">
                      <div className="relative leading-[14px] inline-block min-w-[82px] shrink-0 [debug_commit:f6aba90]">
                        Más información
                      </div>
                    </div>
                    <div className="relative text-sm leading-[21px] inline-block min-w-[4px] shrink-0 [debug_commit:f6aba90]">
                      .
                    </div>
                  </div>
                </div>
              </div>
              <div onClick={()=>{ 
        setComponentState(8)
      }} 
              className=" cursor-pointer self-stretch rounded-md bg-[#6096B9] flex flex-row items-start justify-center py-0 pr-5 pl-[21px] opacity-[0.5] hover:bg-[#6096B9] hover:opacity-100 text-center text-white">
                <div className="w-auto relative leading-[36px] font-medium flex items-center justify-center min-w-[94px] max-w-[535px] mq650:max-w-full">
                  Hacer reserva
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-row items-start justify-center py-0 px-5 ">
              <div className="w-[32.1px] flex flex-row items-end justify-start gap-[1.3000000000010914px]">
                <div className="h-3 flex flex-col items-start justify-end pt-0 px-0 pb-0.5 box-border">
                  <img
                    className="w-[10.5px] h-2.5 relative overflow-hidden shrink-0"
                    alt=""
                    src="ModuloEvento/cb1.svg"
                  />
                </div>
                <div className="w-2 relative leading-[14px] inline-block min-w-[8px]">{` - `}</div>
                <div className="flex-1 flex flex-col items-start justify-end pt-0 px-0 pb-px font-www-fourvenues-com-es-christian-lanza1-my-tickets-booking-pls4z3fgj1gu901dw7c075ptv4hejjwd-cancel-b-81y931x9l-0c02b57039897024944853aa75818e88cd46dccdfaa53215199820ece72e9159-18106666259765625x764-default-font-awesome-5-free-regular-123">
                  <div className="self-stretch relative leading-[11px] inline-block min-w-[11px]">
                  <img
                    className="w-[10.5px] h-2.5 relative overflow-hidden shrink-0"
                    alt=""
                    src="ModuloEvento/cb2.svg"
                  />
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

export default ReservaDatos;
