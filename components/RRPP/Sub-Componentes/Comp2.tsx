import { FC } from "react";

interface propsComp2 {
  componentState: any;
  setComponentState: any;

}
const Comp2: FC<propsComp2> = ({ componentState, setComponentState }) => {
  return (
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
            {/* tarjeta 1 */}
            <div className="md:self-stretch rounded-md hover:bg-[#D1A29E] box-border flex md:flex-row flex-col items-start justify-start py-[26px] px-5 md:pr-[46px] md:pl-[47px] md:max-w-full border-[1.3px] border-solid border-gray-400 hover:border-[#8B1710] text-gray-600 hover:text-gray-50 w-full">
              <div className="md:flex-1 flex md:flex-row flex-col md:items-start items-center md:justify-between md:gap-[36.4px] md:max-w-full mq750:flex-wrap mq750:gap-[18px] w-full">
                <div className="flex flex-row md:items-start items-center justify-center gap-3 pb-4 md:pb-0">
                  <div className="flex flex-col items-start justify-start pt-[16.1px] px-0 pb-0">
                    <input
                      className="m-0 w-[31.3px] h-[31.3px] rounded-[62.65px] text-[#8B1710] border-[#8B1710] overflow-hidden shrink-0"
                      type="checkbox"
                    />
                  </div>

                  <div className="w-auto flex flex-col md:items-start items-center justify-start md:gap-[8.1px] text-left text-[16px] ">
                    <div className=" font-semibold  ">
                      Entrada General
                    </div>
                    <div className="w-auto rounded-full bg-green bg-opacity-30 flex flex-row items-start justify-start pt-[3.7px] px-2 pb-[3.8px] whitespace-nowrap text-center text-xs font-semibold text-green">
                      Disponible hasta 10 junio
                    </div>
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-end md:justify-start justify-between gap-[4.8px] w-full px-5 md:px-0 pb-2 md:pb-0 ">
                  <div className="self-stretch relative shrink-0 [debug_commit:bf4bc93] mq450:text-base">{`Total `}</div>
                  <div className="w-auto relative text-[18px] font-semibold inline-block shrink-0 [debug_commit:bf4bc93] whitespace-nowrap mq450:text-3xl">
                    $61.75
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-start md:justify-start justify-center pt-[1.2px] px-0 pb-0 box-border w-full ">
                  <div className="self-stretch flex  md:flex-col md:items-end md:justify-start justify-between gap-[4.2px] w-full px-5 md:px-0">
                    <div className="w-auto relative inline-block mq450:text-base">
                      Sub-Total
                    </div>
                    <div className="self-stretch relative text-8xl-6 font-semibold text-iracundosc1 whitespace-nowrap mq450:text-3xl">
                      $55.50
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* tarjeta 2 */}
            <div className="md:self-stretch rounded-md hover:bg-[#D1A29E] box-border flex md:flex-row flex-col items-start justify-start py-[26px] px-5 md:pr-[46px] md:pl-[47px] md:max-w-full border-[1.3px] border-solid border-gray-400 hover:border-[#8B1710] text-gray-600 hover:text-gray-50 w-full">
              <div className="md:flex-1 flex md:flex-row flex-col md:items-start items-center md:justify-between md:gap-[36.4px] md:max-w-full mq750:flex-wrap mq750:gap-[18px] w-full">
                <div className="flex flex-row md:items-start items-center justify-center gap-3 pb-4 md:pb-0">
                  <div className="flex flex-col items-start justify-start pt-[16.1px] px-0 pb-0">
                    <input
                      className="m-0 w-[31.3px] h-[31.3px] rounded-[62.65px] text-[#8B1710] border-[#8B1710] overflow-hidden shrink-0"
                      type="checkbox"
                    />
                  </div>

                  <div className="w-auto flex flex-col items-start justify-start gap-[8.1px] text-left text-[16px] ">
                    <div className="relative font-semibold inline-block mq450:text-lg ">
                      Entrada General
                    </div>
                    <div className="w-auto rounded-full bg-red bg-opacity-30 flex flex-row items-start justify-start pt-[3.7px] px-2 pb-[3.8px] whitespace-nowrap text-center text-xs font-semibold text-red">

                      Agotada

                    </div>
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-end md:justify-start justify-between gap-[4.8px] w-full px-5 md:px-0 pb-2 md:pb-0 ">
                  <div className="self-stretch relative shrink-0 [debug_commit:bf4bc93] mq450:text-base">{`Total `}</div>
                  <div className="w-auto relative text-[18px] font-semibold inline-block shrink-0 [debug_commit:bf4bc93] whitespace-nowrap mq450:text-3xl">
                    $31.75
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-start md:justify-start justify-center pt-[1.2px] px-0 pb-0 box-border w-full ">
                  <div className="self-stretch flex  md:flex-col md:items-end md:justify-start justify-between gap-[4.2px] w-full px-5 md:px-0">
                    <div className="w-auto relative inline-block mq450:text-base">
                      Sub-Total
                    </div>
                    <div className="self-stretch relative text-8xl-6 font-semibold  whitespace-nowrap mq450:text-3xl">
                      $25.50
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* tarjeta 3 */}
            <div className="md:self-stretch rounded-md hover:bg-[#D1A29E] box-border flex md:flex-row flex-col items-start justify-start py-[26px] px-5 md:pr-[46px] md:pl-[47px] md:max-w-full border-[1.3px] border-solid border-gray-400 hover:border-[#8B1710] text-gray-600 hover:text-gray-50 w-full">
              <div className="md:flex-1 flex md:flex-row flex-col md:items-start items-center md:justify-between md:gap-[36.4px] md:max-w-full mq750:flex-wrap mq750:gap-[18px] w-full">
                <div className="flex flex-row md:items-start items-center justify-center gap-3 pb-4 md:pb-0">
                  <div className="flex flex-col items-start justify-start pt-[16.1px] px-0 pb-0">
                    <input
                      className="m-0 w-[31.3px] h-[31.3px] rounded-[62.65px] text-[#8B1710] border-[#8B1710] overflow-hidden shrink-0"
                      type="checkbox"
                    />
                  </div>

                  <div className="w-auto flex flex-col items-start justify-start gap-[8.1px] text-left text-[16px] ">
                    <div className="relative font-semibold inline-block mq450:text-lg ">
                      Mesa VIP
                    </div>
                    <div className="w-auto rounded-full bg-green bg-opacity-30 flex flex-row items-start justify-start pt-[3.7px] px-2 pb-[3.8px] whitespace-nowrap text-center text-xs font-semibold text-green">

                      Disponible hasta 10 junio

                    </div>
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-end md:justify-start justify-between gap-[4.8px] w-full px-5 md:px-0 pb-2 md:pb-0">
                  <div className="self-stretch relative shrink-0 [debug_commit:bf4bc93] mq450:text-base">{`Total `}</div>
                  <div className="w-auto relative text-[18px] font-semibold inline-block shrink-0 [debug_commit:bf4bc93] whitespace-nowrap mq450:text-3xl">
                    $31.75
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-start md:justify-start justify-center pt-[1.2px] px-0 pb-0 box-border w-full ">
                  <div className="self-stretch flex  md:flex-col md:items-end md:justify-start justify-between gap-[4.2px] w-full px-5 md:px-0">
                    <div className="w-auto relative inline-block mq450:text-base">
                      Sub-Total
                    </div>
                    <div className="self-stretch relative text-8xl-6 font-semibold  whitespace-nowrap mq450:text-3xl">
                      $25.50
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* tarjeta 4 */}
            <div className="md:self-stretch rounded-md hover:bg-[#D1A29E] box-border flex md:flex-row flex-col items-start justify-start py-[26px] px-5 md:pr-[46px] md:pl-[47px] md:max-w-full border-[1.3px] border-solid border-gray-400 hover:border-[#8B1710] text-gray-600 hover:text-gray-50 w-full">
              <div className="md:flex-1 flex md:flex-row flex-col md:items-start items-center md:justify-between md:gap-[36.4px] md:max-w-full mq750:flex-wrap mq750:gap-[18px] w-full">
                <div className="flex flex-row md:items-start items-center justify-center gap-3 pb-4 md:pb-0">
                  <div className="flex flex-col items-start justify-start pt-[16.1px] px-0 pb-0">
                    <input
                      className="m-0 w-[31.3px] h-[31.3px] rounded-[62.65px] text-[#8B1710] border-[#8B1710] overflow-hidden shrink-0"
                      type="checkbox"
                    />
                  </div>

                  <div className="w-auto flex flex-col items-start justify-start gap-[8.1px] text-left text-[16px] ">
                    <div className="relative font-semibold inline-block mq450:text-lg ">
                      Reserva VIP + Whisky
                    </div>
                    <div className="w-auto rounded-full bg-green bg-opacity-30 flex flex-row items-start justify-start pt-[3.7px] px-2 pb-[3.8px] whitespace-nowrap text-center text-xs font-semibold text-green">

                      Disponible hasta 10 junio

                    </div>
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-end md:justify-start justify-between gap-[4.8px] w-full px-5 md:px-0 pb-2 md:pb-0">
                  <div className="self-stretch relative shrink-0 [debug_commit:bf4bc93] mq450:text-base">{`Total `}</div>
                  <div className="w-auto relative text-[18px] font-semibold inline-block shrink-0 [debug_commit:bf4bc93] whitespace-nowrap mq450:text-3xl">
                    $174.16
                  </div>
                </div>

                <div className="md:w-auto flex md:flex-col md:items-start md:justify-start justify-center pt-[1.2px] px-0 pb-0 box-border w-full">
                  <div className="self-stretch flex  md:flex-col md:items-end md:justify-start justify-between gap-[4.2px] w-full px-5 md:px-0">
                    <div className="w-auto relative inline-block mq450:text-base">
                      Sub-Total
                    </div>
                    <div className="self-stretch relative text-8xl-6 font-semibold whitespace-nowrap mq450:text-3xl">
                      $155.50
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        <div className="self-stretch flex flex-row items-start justify-center py-0 pr-[21px] pl-5 box-border max-w-full">
          <button onClick={() => {
            setComponentState(1)
          }}
            className="cursor-pointer [border:none] p-5 bg-[#8B1710] w-[396px] shadow-[0px_6px_12px_rgba(249,_192,_106,_0.22)] rounded-3xl flex flex-row items-start justify-center box-border max-w-full hover:bg-brown">
            <b className="relative text-[18px] inline-block font-playfair text-white min-w-[110px] mq450:text-2xl">
              Comprar
            </b>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Comp2;
