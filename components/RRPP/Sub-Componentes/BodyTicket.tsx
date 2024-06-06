import { useRouter } from "next/router";
import { FC, useState } from "react";
import { AuthContextProvider } from "../../../context";


interface props {
  ticketsArray: any;
}

export const BodyTicket: FC<props> = ({ ticketsArray }) => {
  const router = useRouter()
  const [isChecked, setIsChecked] = useState(false)
  const { setSelectTicket } = AuthContextProvider()

  const onChangeCheckbox = (e) => {
    console.log(e.target.value)
    setIsChecked(e.target.checked);
    setSelectTicket(e.target.value);
  };

  return (
    <>
      <section className="self-stretch flex flex-row items-start justify-end py-0 px-[66px] box-border max-w-full text-center text-26xl text-black font-inter   ">
        <div className="md:flex-1 flex flex-col md:items-start justify-start gap-[20px] max-w-full">
          <div className="self-stretch flex flex-row items-start justify-center py-0 md:pr-[21px] md:pl-5 box-border max-w-full">
            <div className="w-[892px] flex flex-col items-start justify-start gap-[9px] max-w-full">
              <div className="self-stretch flex flex-row items-start justify-center">
                <h1 className="m-0 relative text-black text-xl font-semibold mq1025:text-17xl mq450:text-8xl">
                  Entradas, Servicios y Reservas
                </h1>
              </div>
              <div className="self-stretch relative text-lg leading-[150.52%]">
                Elija que tipo de entrada desea comprar o reservar en las
                diferentes opciones que tenemos
              </div>
            </div>
          </div>
          <div className="md:self-stretch flex md:flex-row flex-col md:sitems-start md:justify-center gap-[41px] max-w-full ">
            <div className="md:w-auto rounded-md box-border overflow-hidden shrink-0 flex flex-col items-start md:justify-start justify-center md:pt-[47px] md:pb-[143px] px-5 md:pr-[62px] md:pl-[63px] md:min-w-[422.5px] min-h-[544px] max-w-full border-[1.3px] border-solid border-[#8B1710]">
              <div className="self-stretch flex flex-row items-center justify-between gap-[20px] mq450:flex-wrap">
                <div className="flex flex-col items-start justify-center gap-[43.9px]">
                  <div className="relative font-medium inline-block min-w-[66px]">
                    Entrada
                  </div>
                  <div className="relative font-medium">
                    Acceso a zona general
                  </div>
                  <div className="relative font-medium">Barra de tragos</div>
                  <div className="relative font-medium inline-block min-w-[125px]">
                    Música en vivo
                  </div>
                  <div className="relative font-medium">Opciones de servicio</div>
                  <div className="relative font-medium">Atención personal</div>
                </div>
                <div className="flex flex-col items-start justify-start py-0 px-2.5 gap-[40.1px]">
                  <div className="flex flex-col items-start justify-start">
                    <img
                      className="w-[25px] h-[25px] relative overflow-hidden shrink-0"
                      loading="lazy"
                      alt=""
                      src="ModuloEvento/si.svg"
                    />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <img
                      className="w-[25px] h-[25px] relative overflow-hidden shrink-0"
                      alt=""
                      src="ModuloEvento/si.svg"
                    />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <img
                      className="w-[25px] h-[25px] relative overflow-hidden shrink-0"
                      alt=""
                      src="ModuloEvento/si.svg"
                    />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <img
                      className="w-[25px] h-[25px] relative overflow-hidden shrink-0"
                      alt=""
                      src="ModuloEvento/si.svg"
                    />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <img
                      className="w-[25px] h-[25px] relative overflow-hidden shrink-0"
                      alt=""
                      src="ModuloEvento/si.svg"
                    />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <img
                      className="w-[25px] h-[25px] relative overflow-hidden shrink-0"
                      loading="lazy"
                      alt=""
                      src="ModuloEvento/no.svg"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start justify-start pt-0 px-0 pb-[0.1px] box-border gap-[23px] md:min-w-[500px] max-w-full text-right text-xl text-gray-200 ">
              {
                ticketsArray === undefined ?
                  /* Spinner */
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                  </div> :
                  /* Renderiza los items */
                  ticketsArray?.map((item: any, idx: any) => {
                    return (
                      <div key={idx} className="md:self-stretch rounded-md hover:bg-[#D1A29E] box-border flex md:flex-row flex-col items-start justify-start py-[26px] px-5 md:pr-[46px] md:pl-[47px] md:max-w-full border-[1.3px] border-solid border-gray-400 hover:border-[#8B1710] text-gray-600 hover:text-gray-50 w-full">
                        <div className="md:flex-1 flex md:flex-row flex-col md:items-start items-center md:justify-between md:gap-[36.4px] md:max-w-full mq750:flex-wrap mq750:gap-[18px] w-full">
                          <div className="flex flex-row md:items-start items-center justify-center gap-3 pb-4 md:pb-0">
                            <div className="flex flex-col items-start justify-start pt-[16.1px] px-0 pb-0">
                              <input
                                className={` cursor-pointer m-0 w-[31.3px] h-[31.3px] rounded-[62.65px] text-[#8B1710] border-[#8B1710] overflow-hidden shrink-0 `}
                                type="radio"
                                onChange={onChangeCheckbox}
                                value={item.name}
                                name="tickets"
                                disabled={item.metadata.disponibilidad != "true" ? true : false}
                              />
                            </div>
                            <div className="w-auto flex flex-col md:items-start items-center justify-start md:gap-[8.1px] text-left text-[16px] ">
                              <div className=" font-semibold  ">
                                {item.name}
                              </div>
                              <div className={` ${item.metadata.disponibilidad != "false" ? "bg-green text-green" : " bg-red bg-opacity-30 text-red"} w-auto rounded-full  bg-opacity-30 flex flex-row items-start justify-start pt-[3.7px] px-2 pb-[3.8px] whitespace-nowrap text-center text-xs font-semibold `}>
                                {item?.metadata?.disponibilidad != "false" ? `Disponible hasta ${item?.metadata?.fechaDisponibilidad}` : "no disponible"}
                              </div>
                            </div>
                          </div>
                          <div className="md:w-auto flex md:flex-col md:items-end md:justify-start justify-between gap-[4.8px] w-full px-5 md:px-0 pb-2 md:pb-0 ">
                            <div className="self-stretch relative shrink-0 [debug_commit:bf4bc93] mq450:text-base">{`Total `}</div>
                            <div className="w-auto relative text-[18px] font-semibold inline-block shrink-0 [debug_commit:bf4bc93] whitespace-nowrap mq450:text-3xl">
                              {`${item?.prices[0]?.currency === "usd" ? "$" : item?.prices[0]?.currency} ${item?.prices[0]?.unit_amount / 100}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
            </div>
          </div>
          <div className="self-stretch flex flex-row items-start justify-center py-0 pr-[21px] pl-5 box-border max-w-full">
            <button onClick={() => {
              if (isChecked) {
                router.push("RelacionesPublicas/EntradasGratis")
              }
            }}
              className={`${isChecked ? "cursor-pointer bg-[#8B1710]" : "cursor-default bg-[#8b161060]"}  [border:none] p-5  w-[396px] shadow-[0px_6px_12px_rgba(249,_192,_106,_0.22)] rounded-3xl flex flex-row items-start justify-center box-border max-w-full hover:bg-brown `}>
              <b className="relative text-[18px] inline-block font-playfair text-white min-w-[110px] mq450:text-2xl">
                Comprar
              </b>
            </button>
          </div>
        </div>
      </section>
      <style jsx>
        {`
          .loader {
            border-top-color:  #8B1710;
            -webkit-animation: spinner 1.5s linear infinite;
            animation: spinner 1.5s linear infinite;
          }

          @-webkit-keyframes spinner {
            0% {
              -webkit-transform: rotate(0deg);
            }
            100% {
              -webkit-transform: rotate(360deg);
            }
          }

          @keyframes spinner {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>

  );
};

;
