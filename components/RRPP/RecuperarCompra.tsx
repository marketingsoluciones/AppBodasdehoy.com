import { FC, useState } from "react";
import HeaderComp from "./Sub-Componentes/HeaderComp";

interface propsRecuperarCompra {
    componentState: any;
    setComponentState: any;
    className?:any
  }

const RecuperarCompra: FC<propsRecuperarCompra> = ({componentState, setComponentState}) => {
    const [inputValue, setInputValue] = useState("");
  return (
    <div className="w-[100%] max-w-full flex flex-col bg-slate-100 items-center justify-start py-0 px-[21px] box-border gap-[42px] tracking-[normal] leading-[normal] mq450:gap-[21px]">
      <HeaderComp componentState={componentState} setComponentState={setComponentState}/>
      <div className="w-[60%] flex flex-col items-center justify-center gap-4">
      <section className="self-stretch flex flex-col items-start justify-start gap-[25.8px] text-left text-7xl-3 text-wwwfourvenuescom-athens-gray font-wwwfourvenuescom-inter-regular-123">
        <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px]">
          <b className="self-stretch relative text-[16px] leading-[32px] mq450:text-2xl mq450:leading-[25px]">
            Recuperar compra
          </b>
          <div className="self-stretch relative text-xs leading-[21px] text-gray-400">
            Solo puedes recuperar los tickets que hayas pagado con tarjeta.
          </div>
        </div>
        <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px] text-mid-5">
          <div className="self-stretch flex flex-col items-start justify-start pt-0 px-0 pb-[0.8px] shrink-0">
            <div className="self-stretch relative leading-[25px]">
              Instrucciones para tarjeta de crédito
            </div>
          </div>
          <div className="self-stretch flex flex-col items-start justify-start shrink-0 text-xs text-gray-400">
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="self-stretch relative leading-[18px]">
                Busca la tarjeta con la que has realizado la compra
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="self-stretch relative leading-[18px]">
                Introduce los 4 últimos dígitos
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="self-stretch relative leading-[18px]">
                Indica la fecha de caducidad de la tarjeta
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="self-stretch relative leading-[18px]">
                Consulta e indica la fecha de la transacción
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="self-stretch relative leading-[18px]">
                Incluye la cantidad total pagada
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="self-stretch rounded-md bg-white py-4 flex flex-row items-start justify-start px-[21px] box-border max-w-full">
        <form className="m-0 flex-1 flex flex-col items-start justify-start gap-[10px] max-w-full">
          <div className="self-stretch flex flex-col items-start justify-start pt-0 px-0 pb-[10.5px] gap-[7px]">
            <div className="self-stretch relative text-sm leading-[21px] font-semibold font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-iron1 text-left">
              Ultimos 4 dígitos de la tarjeta de crédito
            </div>
            <div className="self-stretch flex flex-row flex-wrap items-start justify-start [row-gap:20px]">
              <div className="flex flex-row items-start justify-center min-w-[151px]">
                
                <div className="flex-1 rounded-tl-[5.25px] rounded-tr-none rounded-br-none rounded-bl-[5.25px] bg-gray-200 flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-px pl-[11px] opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[11px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

                <div className=" bg-gray-200 flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-[11px] pl-px opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[11px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

              </div>

              <div className=" flex flex-row items-start justify-center min-w-[151px]">
                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5] z-[1]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

                <div className="w-[44.6px] bg-gray-200 flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-[11px] pl-px box-border opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>

              </div>

              <div className=" flex flex-row items-start justify-center min-w-[151px]">
                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-gray-200 flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5] z-[1]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="w-[44.6px] bg-gray-200 flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-[11px] pl-px box-border opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
              </div>


              <input
            className="[outline:none] w-[34.4px] h-10 bg-gray-200 flex flex-row items-start justify-start py-0 px-px border-[1px] border-solid border-slate-200"
            placeholder="-"
            type="text"
          />
                        <input
            className="[outline:none] w-[34.4px] h-10 bg-gray-200 flex flex-row items-start justify-start py-0 px-px border-[1px] border-solid border-slate-200"
            placeholder="-"
            type="text"
          />

              <input
            className="[outline:none] w-[34.4px] h-10 bg-gray-200 flex flex-row items-start justify-start py-0 px-px border-[1px] border-solid border-slate-200"
            placeholder="-"
            type="text"
          />
              <input
            className="[outline:none] w-[42.6px] h-10 rounded-tl-none rounded-tr-[5.25px] rounded-br-[5.25px] rounded-bl-none bg-gray-200 flex flex-row items-start justify-start py-0 px-px border-[1px] border-solid border-slate-200"
            placeholder="-"
            type="text"
          />
            </div>
          </div>

          <form className="m-0 w-auto max-w-full flex flex-row flex-wrap items-start justify-start pt-0 px-0 pb-[10.5px] box-border gap-[10.6px] tracking-[normal] leading-[normal]">
      <div className="flex-1 flex flex-col items-start justify-start gap-[7px] min-w-[148px]">
        <div className="relative text-sm leading-[21px] font-semibold font-profourvenuescom-inter-bold-14 text-wwwfourvenuescom-iron1 text-left">
          Caducidad tarjeta de crédito
        </div>
        <div className="self-stretch flex flex-row items-start justify-start gap-[7px]">
          <input
            className="[outline:none] bg-gray-100 w-[60px] rounded-[5.25px] box-border flex flex-row items-start justify-start pt-[9px] px-[11px] pb-2.5 text-sm  min-w-[60px] shrink-0 [debug_commit:bf4bc93] border-[1px] border-solid border-slate-200"
            placeholder="MM"
            type="text"
          />
          <input
            className="[outline:none] bg-gray-100 flex-1 rounded-[5.25px] box-border flex flex-row items-start justify-start pt-[9px] pb-2.5 pr-2.5 pl-[11px] text-sm min-w-[80px] shrink-0 [debug_commit:bf4bc93] border-[1px] border-solid border-slate-200"
            placeholder="AAAA"
            type="text"
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-start justify-start min-w-[148px]">
        <div className="self-stretch flex flex-col items-start justify-start pt-0 px-0 pb-[7px]">
          <div className="self-stretch relative text-sm leading-[21px] font-semibold text-left">
            Fecha de la compra
          </div>
        </div>
              <input
                className="[outline:none] rounded-md px-2.5  w-full h-full bg-gray-100 border-slate-200"
                type="text"
              />         
      </div>
      <div className="flex-1 flex flex-col items-start justify-start gap-[7px] min-w-[148px]">
        <div className="self-stretch relative text-sm leading-[21px] font-semibold text-black text-left">
          Cantidad compra
        </div>
        <div className="self-stretch rounded-[5.25px] bg-gray-100 flex flex-row items-start justify-start py-0 pr-2.5 pl-[11px] border-[1px] border-solid border-gray-200">
          <input
            className="w-full [border:none] [outline:none] bg-[transparent] h-9 flex-1 flex flex-row items-start justify-start pt-[9px] px-0 pb-2.5 box-border font-profourvenuescom-inter-bold-14 text-sm text-wwwfourvenuescom-santas-gray min-w-[105px] z-[1]"
            placeholder="Ejemplo: 12.50"
            type="text"
          />
        </div>
      </div>
    </form>


          <div className="self-stretch rounded-md bg-[#6096B9] flex flex-col items-start justify-start p-3.5 box-border gap-[10.5px] max-w-full">
            <div className="self-stretch flex flex-row flex-wrap items-start justify-start py-0 pr-[65px] pl-0 box-border max-w-full [row-gap:20px] mq600:pr-8 mq600:box-border">
              <div className="flex flex-col items-start justify-start py-0 pr-[7px] pl-0">
                <div className="flex flex-col items-center justify-center">
                  <img
                    className="w-[18px] h-[18px] relative object-cover"
                    loading="lazy"
                    alt=""
                    src="ModuloEvento/Containerexclamacion.svg"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col items-start justify-start min-w-[324px] max-w-full">
                <div className="relative text-sm leading-[18px] font-semibold text-blue-900 text-left">
                  Revisa los movimientos de tu tarjeta para conocer el importe
                  total de la transacción.
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="relative text-sm leading-[17.5px] font-wwwfourvenuescom-inter-regular-123 text-white text-left">
                <p className="m-0">
                  El importe total debe incluir los gastos de gestión y
                  cualquier otra compra que hayas adquirido en la
                </p>
                <p className="m-0">misma transacción.</p>
              </div>
            </div>
          </div>

          <button className="cursor-pointer [border:none] py-[21px] px-5 bg-[#6096B9] self-stretch rounded-md flex flex-row items-start justify-center opacity-[0.5] hover:bg-blue-900">
            <div className="relative text-sm leading-[25px] font-medium text-white text-center">
              Recuperar compra
            </div>
          </button>

        </form>
      </section>
      <section className="self-stretch rounded-md bg-white flex flex-col items-center justify-start py-3.5 px-[21px] box-border gap-[6.3px] max-w-full text-center text-sm">
        <div className="relative leading-[29px] font-semibold shrink-0">
          ¿Has utilizado otro método de pago?
        </div>
        <div className="self-stretch flex flex-col items-center justify-start gap-[14px] shrink-0 max-w-full text-wwwfourvenuescom-jumbo">
          <div className="self-stretch flex flex-col items-center justify-start pt-0 px-5 pb-[0.8px] box-border shrink-0 max-w-full">
            <div className="relative leading-[25px] inline-block max-w-full">
              Ponte en contacto con nuestro equipo de soporte.
            </div>
          </div>
          <div className="rounded-md bg-gray-500 hover:bg-gray-400 flex flex-row items-center justify-center pt-[8.7px] pb-[8.8px] pr-[17px] pl-[15px] text-left text-smi-3 text-inherit-white-main">
            <div className="w-[29.8px] flex flex-col items-start justify-start py-0 pr-2 pl-0 box-border">
              <div className="flex flex-row items-center justify-center">
                <img
                  className="h-4 w-[21px] relative object-cover"
                  alt=""
                  src="ModuloEvento/Vectormensaje.svg"
                />
              </div>
            </div>
            <div className="flex flex-col items-start justify-start z-[1]">
              <div className="relative leading-[16px] font-semibold whitespace-nowrap text-white">
                soporte@eventosorganizador.com
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default RecuperarCompra;
