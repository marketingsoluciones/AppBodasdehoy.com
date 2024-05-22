import { FC } from "react";
import HeaderComp from "./Sub-Componentes/HeaderComp";

interface propsRecuperarCompra {
    componentState: any;
    setComponentState: any;
  
  }

const RecuperarCompra: FC<propsRecuperarCompra> = ({componentState, setComponentState}) => {
  return (
    <div className={`w-[100%] max-w-full flex flex-col items-start justify-start py-0 px-[21px] box-border gap-[42px] tracking-[normal] leading-[normal] mq450:gap-[21px] ${className}`}>
      <HeaderComp componentState={componentState} setComponentState={setComponentState}/>
      <section className="self-stretch flex flex-col items-start justify-start gap-[25.8px] text-left text-7xl-3 text-wwwfourvenuescom-athens-gray font-wwwfourvenuescom-inter-regular-123">
        <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px]">
          <b className="self-stretch relative leading-[32px] mq450:text-2xl mq450:leading-[25px]">
            Recuperar compra
          </b>
          <div className="self-stretch relative text-sm leading-[21px] text-wwwfourvenuescom-santas-gray">
            Solo puedes recuperar los tickets que hayas pagado con tarjeta.
          </div>
        </div>
        <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px] text-mid-5">
          <div className="self-stretch flex flex-col items-start justify-start pt-0 px-0 pb-[0.8px] shrink-0">
            <div className="self-stretch relative leading-[25px]">
              Instrucciones para tarjeta de crédito
            </div>
          </div>
          <div className="self-stretch flex flex-col items-start justify-start shrink-0 text-smi-3 text-wwwfourvenuescom-santas-gray">
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
      <section className="self-stretch flex flex-row items-start justify-start py-0 px-[21px] box-border max-w-full">
        <form className="m-0 flex-1 flex flex-col items-start justify-start gap-[10px] max-w-full">
          <div className="self-stretch flex flex-col items-start justify-start pt-0 px-0 pb-[10.5px] gap-[7px]">
            <div className="self-stretch relative text-sm leading-[21px] font-semibold font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-iron1 text-left">
              Ultimos 4 dígitos de la tarjeta de crédito
            </div>
            <div className="self-stretch flex flex-row flex-wrap items-start justify-start [row-gap:20px]">
              <div className="flex-1 flex flex-row items-start justify-center min-w-[151px]">
                <div className="flex-1 rounded-tl-[5.25px] rounded-tr-none rounded-br-none rounded-bl-[5.25px] bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-px pl-[11px] opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[11px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-[11px] pl-px opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[11px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-row items-start justify-center min-w-[151px]">
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5] z-[1]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="w-[44.6px] bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-[11px] pl-px box-border opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-row items-start justify-center min-w-[151px]">
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] px-px pb-2.5 opacity-[0.5] z-[1]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-[13px] pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
                <div className="w-[44.6px] bg-wwwfourvenuescom-ship-gray flex flex-col items-start justify-start pt-[9px] pb-2.5 pr-[11px] pl-px box-border opacity-[0.5]">
                  <div className="overflow-hidden flex flex-col items-center justify-start pt-[4.9px] px-3 pb-[1.5px]">
                    <div className="h-[10.6px] relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center flex items-center justify-center min-w-[8px]">
                      x
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-[42.6px] bg-wwwfourvenuescom-ship-gray flex flex-row items-start justify-end py-0 px-px box-border">
                <div className="flex-1 flex flex-row items-start justify-start pt-[9px] px-[11px] pb-2.5 z-[1]">
                  <div className="relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center inline-block min-w-[7px]">
                    -
                  </div>
                </div>
              </div>
              <div className="w-[34.4px] bg-wwwfourvenuescom-ship-gray flex flex-row items-start justify-start py-0 px-px box-border">
                <div className="flex-1 flex flex-row items-start justify-start pt-[9px] px-3 pb-2.5 z-[1]">
                  <div className="relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center inline-block min-w-[7px]">
                    -
                  </div>
                </div>
              </div>
              <div className="w-[34.4px] bg-wwwfourvenuescom-ship-gray flex flex-row items-start justify-start py-0 px-px box-border">
                <div className="flex-1 flex flex-row items-start justify-start pt-[9px] px-3 pb-2.5 z-[1]">
                  <div className="relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center inline-block min-w-[7px]">
                    -
                  </div>
                </div>
              </div>
              <div className="w-[42.6px] rounded-tl-none rounded-tr-[5.25px] rounded-br-[5.25px] rounded-bl-none bg-wwwfourvenuescom-ship-gray flex flex-row items-start justify-start py-0 px-px box-border">
                <div className="flex-1 flex flex-row items-start justify-start pt-[9px] px-[11px] pb-2.5 z-[1]">
                  <div className="relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-center inline-block min-w-[7px]">
                    -
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="self-stretch flex flex-row flex-wrap items-start justify-start pt-0 px-0 pb-[10.5px] gap-[10.5px]">
            <div className="flex-1 flex flex-col items-start justify-start gap-[7px] min-w-[148px]">
              <div className="relative text-sm leading-[21px] font-semibold font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-iron1 text-left">
                Caducidad tarjeta de crédito
              </div>
              <div className="self-stretch flex flex-row items-start justify-start gap-[7px]">
                <div className="w-[60px] rounded-[5.25px] bg-wwwfourvenuescom-ship-gray box-border flex flex-row items-start justify-start py-0 pr-2.5 pl-[11px] min-w-[60px] border-[1px] border-solid border-wwwfourvenuescom-ship-gray">
                  <div className="flex flex-row items-start justify-start pt-[9px] pb-2.5 pr-3 pl-0 z-[1]">
                    <div className="relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-left inline-block min-w-[25px]">
                      MM
                    </div>
                  </div>
                </div>
                <div className="flex-1 rounded-[5.25px] bg-wwwfourvenuescom-ship-gray box-border flex flex-row items-start justify-start py-0 pr-2.5 pl-[11px] min-w-[80px] border-[1px] border-solid border-wwwfourvenuescom-ship-gray">
                  <div className="flex-1 flex flex-row items-start justify-start pt-[9px] px-0 pb-2.5 z-[1]">
                    <div className="relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-left inline-block min-w-[38px]">
                      AAAA
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start justify-start min-w-[148px]">
              <div className="self-stretch flex flex-col items-start justify-start pt-0 px-0 pb-[7px]">
                <div className="self-stretch relative text-sm leading-[21px] font-semibold font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-iron1 text-left">
                  Fecha de la compra
                </div>
              </div>
              <div className="self-stretch flex flex-row items-center justify-center">
                <div className="flex-1 flex flex-col items-start justify-start">
                  <div className="self-stretch rounded-6xs bg-wwwfourvenuescom-ship-gray flex flex-row items-start justify-start py-[11px] px-2.5">
                    <div className="flex flex-row items-start justify-start">
                      <img
                        className="h-3.5 w-[12.3px] relative overflow-hidden shrink-0"
                        alt=""
                        src="/icon2.svg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start justify-start gap-[7px] min-w-[148px]">
              <div className="self-stretch relative text-sm leading-[21px] font-semibold font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-iron1 text-left">
                Cantidad compra
              </div>
              <div className="self-stretch rounded-[5.25px] bg-wwwfourvenuescom-ship-gray flex flex-row items-start justify-start py-0 pr-2.5 pl-[11px] border-[1px] border-solid border-wwwfourvenuescom-ship-gray">
                <div className="h-9 flex-1 flex flex-row items-start justify-start pt-[9px] px-0 pb-2.5 box-border min-w-[105px] z-[1]">
                  <div className="relative text-sm font-wwwfourvenuescom-inter-regular-123 text-wwwfourvenuescom-santas-gray text-left inline-block min-w-[96px]">
                    Ejemplo: 12.50
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="self-stretch rounded-2xs-5 bg-color-base flex flex-col items-start justify-start p-3.5 box-border gap-[10.5px] max-w-full">
            <div className="self-stretch flex flex-row flex-wrap items-start justify-start py-0 pr-[65px] pl-0 box-border max-w-full [row-gap:20px] mq600:pr-8 mq600:box-border">
              <div className="flex flex-col items-start justify-start py-0 pr-[7px] pl-0">
                <div className="flex flex-col items-center justify-center">
                  <img
                    className="w-[18px] h-[18px] relative object-cover"
                    loading="lazy"
                    alt=""
                    src="/svg@2x.png"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col items-start justify-start min-w-[324px] max-w-full">
                <div className="relative text-smi-3 leading-[18px] font-semibold font-wwwfourvenuescom-inter-regular-123 text-lightblue-900 text-left">
                  Revisa los movimientos de tu tarjeta para conocer el importe
                  total de la transacción.
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="relative text-smi-3 leading-[17.5px] font-wwwfourvenuescom-inter-regular-123 text-inherit-white-main text-left">
                <p className="m-0">
                  El importe total debe incluir los gastos de gestión y
                  cualquier otra compra que hayas adquirido en la
                </p>
                <p className="m-0">misma transacción.</p>
              </div>
            </div>
          </div>
          <button className="cursor-pointer [border:none] py-[21px] px-5 bg-color-base self-stretch rounded-6xs flex flex-row items-start justify-center opacity-[0.5] hover:bg-steelblue">
            <div className="relative text-mid-5 leading-[25px] font-medium font-wwwfourvenuescom-inter-regular-123 text-inherit-white-main text-center">
              Recuperar compra
            </div>
          </button>
        </form>
      </section>
      <section className="self-stretch rounded-2xs-5 flex flex-col items-center justify-start py-3.5 px-[21px] box-border gap-[6.3px] max-w-full text-center text-mid-5 text-wwwfourvenuescom-iron font-wwwfourvenuescom-inter-regular-123">
        <div className="relative leading-[29px] font-semibold shrink-0">
          ¿Has utilizado otro método de pago?
        </div>
        <div className="self-stretch flex flex-col items-center justify-start gap-[14px] shrink-0 max-w-full text-wwwfourvenuescom-jumbo">
          <div className="self-stretch flex flex-col items-center justify-start pt-0 px-5 pb-[0.8px] box-border shrink-0 max-w-full">
            <div className="relative leading-[25px] inline-block max-w-full">
              Ponte en contacto con nuestro equipo de soporte.
            </div>
          </div>
          <div className="rounded-6xs bg-wwwfourvenuescom-nero-10 flex flex-row items-center justify-center pt-[8.7px] pb-[8.8px] pr-[17px] pl-[15px] text-left text-smi-3 text-inherit-white-main">
            <div className="w-[29.8px] flex flex-col items-start justify-start py-0 pr-2 pl-0 box-border">
              <div className="flex flex-row items-center justify-center">
                <img
                  className="h-4 w-[21px] relative object-cover"
                  alt=""
                  src="/svg-1@2x.png"
                />
              </div>
            </div>
            <div className="flex flex-col items-start justify-start z-[1]">
              <div className="relative leading-[16px] font-semibold whitespace-nowrap">
                soporte@eventosorganizador.com
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RecuperarCompra;
