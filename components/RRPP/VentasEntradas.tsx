import { FC, FunctionComponent, memo } from "react";
import CompVentas1 from "./CompVentas1";
import HeaderComp from "./Sub-Componentes/HeaderComp";
interface propsVentasEntradas {
  componentState: any;
  setComponentState: any;

}


const VentasEntradas: FC<propsVentasEntradas> = ({ componentState, setComponentState }) => {
  return (
    <div className="w-full h-[100%] bg-slate-100 flex flex-col py-[20px] gap-[40px] overflow-auto">
      <HeaderComp componentState={componentState} setComponentState={setComponentState} />
      <div className="flex md:flex-row flex-col items-center justify-center gap-8">
<div className="flex flex-col items-start gap-4">
  <img
    className="w-60 h-auto rounded-md object-cover"
    loading="lazy"
    alt=""
    src="ModuloEvento/evento1.jpg"
  />

  <div className="flex flex-col items-start gap-2">
    <div className="font-semibold text-lg">Ubicación</div>
    <div className="text-sm">
      <div className="font-semibold">Oro Verde</div>
      <div>Banaoro / Rocafuerte y 25 de junio</div>
    </div>
    <button className="bg-red text-white rounded-md py-2 px-4 flex items-center gap-2">
      <img
        class="w-4 h-4"
        alt=""
        src="ModuloEvento/ubi1.svg"
      />
      <span className="font-medium">Ver mapa</span>
    </button>
  </div>
</div>



        <div className="w-auto flex flex-col items-start justify-start gap-[30px] max-w-full text-base-8 text-gray-300">
          <div className="self-stretch flex flex-col items-center justify-center gap-[40.5px] max-w-full">
            <div className="flex flex-col items-start justify-start gap-[10.5px] max-w-full">
              <div className="flex flex-row items-center justify-start gap-[11px] max-w-full">

                <div onClick={() => {
                  setComponentState(1)
                }}
                  className="cursor-pointer rounded-md bg-[#6096B9] flex flex-row items-center justify-center py-[10.5px] pr-[11.30000000000291px] pl-[11.39999999999418px]">
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

                <div className="flex flex-row items-center justify-center py-0 px-0 box-border gap-[1px] max-w-full">
                  <div className="h-[25px] w-auto relative md:tracking-[3.15px] md:leading-[24.5px] uppercase text-black inline-block">
                    Sab. 29 Junio 2024 /
                  </div>
                  <div className="h-auto w-auto relative tracking-[3.15px] leading-[25px] uppercase inline-block min-w-[60px] whitespace-nowrap">{`00:00 `}</div>
                  
                  <div className="h-4 flex flex-row items-start justify-start opacity-[0.5]">
                    <img
                      className="h-4 w-[16.9px] relative overflow-hidden shrink-0"
                      loading="lazy"
                      alt=""
                      src="ModuloEvento/dereflecha.svg"
                    />
                  </div>
                  <div className="h-[25px] w-full] relative tracking-[3.15px] leading-[25px] uppercase inline-block min-w-[63px] whitespace-nowrap">
                    {" "}
                    07:30
                  </div>
                </div>

              </div>
              <div className="flex flex-col items-start justify-start gap-[14px] max-w-full md:text-[32.5px] text-[20px] text-[#6096B9]">
                <b className="w-full h-14 relative leading-[56px] inline-block ">
                  Concierto de los Iracunddos
                </b>
                <div className="flex flex-row items-start justify-start gap-[7px] text-smi-3 text-primary-contrast">

                  <div className="rounded-md bg-red opacity-50 text-white flex flex-row items-start justify-start pt-[3.5px] pb-[3px] pr-[6.700000000004366px] pl-[7px] gap-[3.5px]">
                    <div className="h-[15px] flex flex-col items-start justify-start pt-0.5 px-0 pb-0 box-border">
                      <img
                        className="w-[9.2px] h-[13px] relative overflow-hidden shrink-0"
                        alt=""
                        src="ModuloEvento/mas.svg"
                      />
                    </div>
                    <b className="h-[18px] w-full relative text-xs leading-[18px] inline-block min-w-[17px]">
                      {" "}
                      18
                    </b>
                  </div>
                  <div className="rounded-md bg-blue-400 text-white flex flex-row items-start justify-start pt-[3.5px] pb-[3px] pr-[4.599999999998545px] pl-[7px] gap-[3.5px]">
                    <div className="h-[15px] flex flex-col items-start justify-start pt-0.5 px-0 pb-0 box-border">
                      <img
                        className="w-[15.3px] h-[13px] relative overflow-hidden shrink-0"
                        alt=""
                        src="ModuloEvento/camisa.svg"
                      />
                    </div>
                    <b className="h-[18px] w-full text-xs relative leading-[18px] inline-block min-w-[45px]">
                      {" "}
                      Casual
                    </b>
                  </div>
                </div>
              </div>
            </div>

            <div className="self-stretch rounded-md flex flex-col items-start justify-start pt-5 pb-[10.5px] pr-2.5 pl-[10.5px] box-border gap-[11px] max-w-full text-black">
              <div className="flex flex-row items-start justify-start text-lg">
                <div className="flex flex-col items-start justify-start pt-[4.5px] px-0 pb-0">
                  <div className="w-[3.5px] h-[17.5px] relative rounded-md bg-green" />
                </div>
                <b className="h-7 w-full relative pl-1 tracking-[4.2px] leading-[28px] uppercase inline-block mq416:text-mid mq416:leading-[22px]">
                  {" "}
                  Entradas
                </b>
              </div>

              <div className="self-stretch rounded-md bg-white hover:bg-green hover:bg-opacity-50 shadow-[0px_1px_14px_rgba(0,_0,_0,_0.12),_0px_5px_8px_rgba(0,_0,_0,_0.14),_0px_3px_5px_-1px_rgba(0,_0,_0,_0.2)] overflow-hidden flex flex-col items-start justify-start max-w-full hover:border-[2px] hover:border-green ">
                <div className="self-stretch rounded-md shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] box-border flex flex-col items-start justify-start py-px px-0 max-w-full border-[1px] border-solid border-green-400">
                  <div className="self-stretch flex flex-row items-center justify-between max-w-full [row-gap:20px]">
                    <div className="flex flex-col items-start justify-start py-[10.5px] pr-[21px] pl-[10.5px] box-border max-w-full">
                      <div className="flex flex-col items-start justify-start">
                        <div className="w-auto h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[46px] max-w-[497.1600036621094px] max-h-[24.5px]">
                          Entrada General
                        </div>
                      </div>
                    </div>
                    <div className="w-auto flex flex-col items-start justify-start py-[10.5px] pr-[10.5px] pl-0 box-border ml-[-0.01px] text-center mq416:ml-0">
                      <div className="self-stretch flex flex-row items-center justify-start gap-[0.01px]">
                        <div className="flex-1 flex flex-col items-start justify-start py-0 pr-[7px] pl-0">
                          <div className="self-stretch flex flex-col items-center justify-start">
                            <div className="self-stretch rounded-md bg-green-200 flex flex-row items-start justify-start p-[10.5px]">
                              <div className="flex flex-col items-center justify-start py-0 pr-2.5 pl-[10.19999999999709px]">
                                <div className="self-stretch h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[22px] max-h-[24.5px] whitespace-nowrap">
                                  55.50$
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => {
                          setComponentState(3)
                        }}
                          className="cursor-pointer [border:none] p-0 bg-[transparent] flex flex-col items-start justify-start">
                          <div className="rounded-md bg-[#6096B9] flex flex-row items-start justify-start pt-[13.5px] px-[21px] pb-[15px]">
                            <div className="h-[17px] flex flex-row items-start justify-start">
                              <img
                                className="h-[17px] w-[15.3px] relative overflow-hidden shrink-0"
                                alt=""
                                src="ModuloEvento/flesh.svg"
                              />
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch rounded-md bg-white hover:bg-green hover:bg-opacity-50 shadow-[0px_1px_14px_rgba(0,_0,_0,_0.12),_0px_5px_8px_rgba(0,_0,_0,_0.14),_0px_3px_5px_-1px_rgba(0,_0,_0,_0.2)] overflow-hidden flex flex-col items-start justify-start max-w-full hover:border-[2px] hover:border-green ">
                <div className="self-stretch rounded-md shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] box-border flex flex-col items-start justify-start py-px px-0 max-w-full border-[1px] border-solid border-green-400">
                  <div className="self-stretch flex flex-row items-center justify-between max-w-full [row-gap:20px]">
                    <div className="flex flex-col items-start justify-start py-[10.5px] pr-[21px] pl-[10.5px] box-border max-w-full">
                      <div className="flex flex-col items-start justify-start">
                        <div className="w-auto h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[46px] max-w-[497.1600036621094px] max-h-[24.5px]">
                        Entrada + Servicio
                        </div>
                      </div>
                    </div>
                    <div className="w-auto flex flex-col items-start justify-start py-[10.5px] pr-[10.5px] pl-0 box-border ml-[-0.01px] text-center mq416:ml-0">
                      <div className="self-stretch flex flex-row items-center justify-start gap-[0.01px]">
                        <div className="flex-1 flex flex-col items-start justify-start py-0 pr-[7px] pl-0">
                          <div className="self-stretch flex flex-col items-center justify-start">
                            <div className="self-stretch rounded-md bg-green-200 flex flex-row items-start justify-start p-[10.5px]">
                              <div className="flex flex-col items-center justify-start py-0 pr-2.5 pl-[10.19999999999709px]">
                                <div className="self-stretch h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[22px] max-h-[24.5px] whitespace-nowrap">
                                55.50$
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => {
                          setComponentState(3)
                        }}
                          className="cursor-pointer [border:none] p-0 bg-[transparent] flex flex-col items-start justify-start">
                          <div className="rounded-md bg-[#6096B9] flex flex-row items-start justify-start pt-[13.5px] px-[21px] pb-[15px]">
                            <div className="h-[17px] flex flex-row items-start justify-start">
                              <img
                                className="h-[17px] w-[15.3px] relative overflow-hidden shrink-0"
                                alt=""
                                src="ModuloEvento/flesh.svg"
                              />
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch rounded-md bg-white hover:bg-green hover:bg-opacity-50 shadow-[0px_1px_14px_rgba(0,_0,_0,_0.12),_0px_5px_8px_rgba(0,_0,_0,_0.14),_0px_3px_5px_-1px_rgba(0,_0,_0,_0.2)] overflow-hidden flex flex-col items-start justify-start max-w-full hover:border-[2px] hover:border-green ">
                <div className="self-stretch rounded-md shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] box-border flex flex-col items-start justify-start py-px px-0 max-w-full border-[1px] border-solid border-green-400">
                  <div className="self-stretch flex flex-row items-center justify-between max-w-full [row-gap:20px]">
                    <div className="flex flex-col items-start justify-start py-[10.5px] pr-[14px] pl-[10.5px] box-border max-w-full">
                      <div className="flex flex-col items-start justify-start">
                        <div className="w-auto h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[46px] max-w-[497.1600036621094px] max-h-[24.5px]">
                        Entrada Vip + Whisky
                        </div>
                      </div>
                    </div>
                    <div className="w-auto flex flex-col items-start justify-start py-[10.5px] pr-[10.5px] pl-0 box-border ml-[-0.01px] text-center mq416:ml-0">
                      <div className="self-stretch flex flex-row items-center justify-start gap-[0.01px]">
                        <div className="flex-1 flex flex-col items-start justify-start py-0 pr-[7px] pl-0">
                          <div className="self-stretch flex flex-col items-center justify-start">
                            <div className="self-stretch rounded-md bg-green-200 flex flex-row items-start justify-start p-[10.5px]">
                              <div className="flex flex-col items-center justify-start py-0 pr-2.5 pl-[10.19999999999709px]">
                                <div className="self-stretch h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[22px] max-h-[24.5px] whitespace-nowrap">
                                150.50$
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => {
                          setComponentState(3)
                        }}
                          className="cursor-pointer [border:none] p-0 bg-[transparent] flex flex-col items-start justify-start">
                          <div className="rounded-md bg-[#6096B9] flex flex-row items-start justify-start pt-[13.5px] px-[21px] pb-[15px]">
                            <div className="h-[17px] flex flex-row items-start justify-start">
                              <img
                                className="h-[17px] w-[15.3px] relative overflow-hidden shrink-0"
                                alt=""
                                src="ModuloEvento/flesh.svg"
                              />
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <div className="self-stretch rounded-md flex flex-col items-start justify-start pt-5 pb-[10.5px] pr-2.5 pl-[10.5px] box-border gap-[1px] max-w-full text-black">
            <div className="flex flex-row items-start justify-start gap-1">
              <div className="flex flex-col items-start justify-start pt-[4.5px] px-0 pb-0">
                <div className="w-[3.5px] h-[17.5px] relative rounded-[5.25px] bg-blue-800" />
              </div>
              <b className="h-7 w-full relative tracking-[4.2px] leading-[28px] uppercase inline-block min-w-[101px] mq416:text-mid mq416:leading-[22px]">
                {" "}
                Zonas de Reserva
              </b>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px] max-w-full">
              <CompVentas1
                lolo="Zona Vip"
                icon="ModuloEvento/flesh.svg"
                propMinWidth="28px"
                link="6"
                componentState={componentState} setComponentState={setComponentState}
              />
              <CompVentas1
                lolo="invitados generales"
                icon="ModuloEvento/flesh.svg"
                propMinWidth="unset"
                link="1"
                componentState={componentState} setComponentState={setComponentState}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentasEntradas;