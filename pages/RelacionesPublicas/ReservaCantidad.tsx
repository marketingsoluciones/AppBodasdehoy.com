import { FC, useState } from "react";
import NumericCounter from "../../components/RRPP/Sub-Componentes/ContadorNumerico";
import HeaderComp from "../../components/RRPP/Sub-Componentes/HeaderComp";
import { useRouter } from "next/router";
interface propsReservaCantidad {
  componentState: any;
  setComponentState: any;

}

const ReservaCantidad: FC<propsReservaCantidad> = ({ componentState, setComponentState }) => {
  const [count, setCount] = useState<number>(1)
  const router = useRouter()
  return (
    <div className="w-[100%] md:h-[100vh] h-[100%] max-w-full flex flex-col bg-slate-100 gap-4 items-center box-border tracking-[normal] pt-[20px] px-3 text-center text-sm text-[#6096B9] ">
      <HeaderComp />
      <div className="md:w-[60%] w-[100%] rounded-md bg-white shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] overflow-hidden flex flex-col items-start justify-center box-border max-w-full">

        <div className="w-full bg-gray-100 flex flex-row items-center justify-between pt-[10.5px] px-[21px] pb-[13.5px] box-border max-w-full gap-[20px] mq450:flex-wrap">
          <div className="flex flex-row items-start justify-start md:gap-[154.90000000000146px] max-w-full mq450:flex-wrap mq450:gap-[154.9px_77px]">

            <button onClick={() => { window.history.back() }}
              className="cursor-pointer [border:none] py-0 pr-[10.5px] pl-0 bg-[transparent] flex flex-col items-start justify-start">
              <div className="rounded-md bg-[#6096B9] flex flex-row items-center justify-center py-[10.5px] px-[11px]">
                <div className="w-[13px] flex flex-col items-start justify-start">
                  <div className="h-3.5 flex flex-row items-start justify-start">
                    <img
                      className="h-3.5 w-[12.3px] relative overflow-hidden shrink-0"
                      alt=""
                      src="../ModuloEvento/FlechaIzquerda2.svg"
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
                src="../ModuloEvento/calendar1.svg"
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
                    src="../ModuloEvento/equis2.svg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="self-stretch flex flex-row items-start justify-start py-0 px-5 box-border max-w-full mt-[-2px] text-2xs-5 text-text-primary">
          <div className="md:flex-1 flex flex-col items-start justify-start pt-[31.5px] px-0 pb-[11.5px] box-border gap-[10.166666666666666px] md:max-w-[1024px] ">

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


            <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px] max-w-full text-left md:text-sm text-xs text-gray-600">
              <div className="self-stretch rounded-md box-border flex flex-col items-start justify-start py-[11.5px] px-2.5 max-w-full border-[1px] border-solid border-blue-600">

                <div className="self-stretch flex flex-row items-start justify-start py-0 md:pr-[85px] pl-0 box-border max-w-full [row-gap:20px] mq450:pr-5 mq450:box-border mq650:pr-[42px] mq650:box-border">
                  <div className="flex flex-col items-start justify-start pt-1 pb-[3px] pr-[10.5px] pl-0">
                    <div className="h-3.5 flex flex-row items-start justify-start">
                      <img
                        className="h-3.5 w-3.5 relative overflow-hidden shrink-0"
                        alt=""
                        src="../ModuloEvento/info4.svg"
                      />
                    </div>
                  </div>
                  <div className="md:flex-1 flex flex-row items-start justify-start gap-[3.6099853515625px] md:min-w-[276px] max-w-full mq650:flex-wrap">
                    <div className="relative leading-[21px] inline-block max-w-full text-gray-600">
                      Descarga tu código QR una vez confirmada la reserva.
                    </div>
                    <i className="relative [text-decoration:underline] leading-[21px] inline-block text-gray-400 min-w-[61px]">
                      Más info.
                    </i>
                  </div>
                </div>

              </div>
              <div className="self-stretch rounded-md shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] flex flex-col items-start justify-start py-[31.5px] px-[9px] text-center text-xl text-[#6096B9] border-[1px] border-solid border-gray-100">
                <div className="self-stretch flex flex-col items-center justify-center py-0 px-5">
                  <div className="w-auto flex flex-col items-start justify-start pt-0 pb-[10.5px] px-0 box-border">
                    <div className="w-auto flex flex-col items-center justify-start">
                      <h3 className="m-0 self-stretch relative text-inherit leading-[28px] font-bold font-inherit mq450:text-mid mq450:leading-[22px]">
                        ¿Cuántas personas sois?
                      </h3>
                    </div>
                  </div>

                  <NumericCounter count={count} setCount={setCount} />
                </div>
              </div>
            </div>
            <button onClick={() => {
              router.push("ReservaDatos")
            }}
              className="cursor-pointer [border:none] py-0 pr-5 pl-[21px] bg-[#6096B9] self-stretch rounded-md flex flex-row items-start justify-center hover:bg-steelblue-100">
              <div className="w-[66px] relative text-sm leading-[36px] font-medium text-white text-center flex items-center justify-center min-w-[66px] max-w-[535px] mq650:max-w-full">
                Continuar
              </div>
            </button>

            <div className="self-stretch flex flex-row items-start justify-center py-0 px-5 text-www-fourvenues-com-es-christian-lanza1-my-tickets-booking-pls4z3fgj1gu901dw7c075ptv4hejjwd-cancel-b-81y931x9l-0c02b57039897024944853aa75818e88cd46dccdfaa53215199820ece72e9159-18106666259765625x764-default-santas-gray font-www-fourvenues-com-es-christian-lanza1-my-tickets-booking-pls4z3fgj1gu901dw7c075ptv4hejjwd-cancel-b-81y931x9l-0c02b57039897024944853aa75818e88cd46dccdfaa53215199820ece72e9159-18106666259765625x764-default-font-awesome-5-free-regular-123">
              <div className="w-[31.9px] flex flex-row items-start justify-start gap-[1.2000000000007276px]">
                <div className="flex-1 flex flex-row items-end justify-start gap-[1.2000000000007276px]">
                  <div className="flex-1 flex flex-col items-center justify-center pt-0 px-0 pb-px">
                    <div className="self-stretch relative leading-[11px] inline-block min-w-[11px]">
                      <img
                        className="w-[10.5px] h-2.5 relative overflow-hidden shrink-0"
                        loading="lazy"
                        alt=""
                        src="../ModuloEvento/cb1.svg"
                      />
                    </div>
                  </div>
                  <div className="w-2 relative leading-[14px] font-semibold text-gray-400 inline-block min-w-[8px]">{` - `}</div>
                </div>
                <div className="h-3 flex flex-col items-center justify-center pt-0.5 px-0 pb-0 box-border">
                  <img
                    className="w-[10.5px] h-2.5 relative overflow-hidden shrink-0"
                    loading="lazy"
                    alt=""
                    src="../ModuloEvento/cb2.svg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReservaCantidad;
