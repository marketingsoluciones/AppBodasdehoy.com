import { FC } from "react";

interface propsResumenComponents {
  data: any

}
export const ResumenComponents: FC<propsResumenComponents> = ({ data }) => {
  console.log(data)
  return (
    <div className="self-stretch w-auto flex flex-col items-start justify-start box-border ">
      <div className="self-stretch rounded-md bg-white shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] flex flex-col items-start justify-start p-[10.5px] gap-[10.5px]">
        <div className="self-stretch [filter:blur(0px)] flex flex-col items-start justify-start">
          <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px]">
            <div className="self-stretch flex flex-col items-start justify-start ">
              <div className="relative leading-[24.5px] font-semibold inline-block">
                Resumen
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px] text-sm text-text-secondary">
              <div className="self-stretch flex flex-row items-center justify-start">
                <div className="flex-1 flex flex-col items-start justify-start py-0 pr-[123.27999877929688px] pl-0">
                  <div className="relative leading-[21px] font-light inline-block max-w-[243.27999877929688px]">
                    {data?.quantity}  x {data?.name} ({data?.quantity * data?.amount / 100} $)
                  </div>
                </div>
                <div className="w-[42.1px] flex flex-col items-end justify-start text-right">
                  <div className="relative leading-[21px] font-light">
                    {data?.quantity * data?.amount / 100} $
                  </div>
                </div>
              </div>
              <div className="self-stretch flex flex-row items-center justify-start">
                <div className="flex-1 flex flex-col items-start justify-start py-0 pr-[124.27999877929688px] pl-0">
                  <div className="relative leading-[21px] font-light inline-block max-w-[243.27999877929688px]">
                    Gastos de gestión
                  </div>
                </div>
                <div className="w-[42.1px] flex flex-col items-end justify-start text-right">
                  <div className="relative leading-[21px] font-light">
                    8,25 $
                  </div>
                </div>
              </div>
              <div className="self-stretch relative bg-www-fourvenues-com-es-christian-lanza1-events-playa-y-rumba-29-02-2024-81y9-tickets-clrusb7w7018g01aeancrb2z0sg4m98f-1358x573-default-ship-gray h-px" />
            </div>
            <div className="self-stretch flex flex-row items-center justify-start">
              <div className="flex-1 flex flex-col items-start justify-start py-0 pr-[197.47000122070312px] pl-0">
                <div className="relative leading-[24.5px] font-semibold inline-block max-w-[235.47000122070312px] max-h-[24.5px]">
                  Total
                </div>
              </div>
              <div className="w-[49.9px] flex flex-col items-end justify-start text-right">
                <div className="relative leading-[24.5px] font-semibold inline-block max-h-[24.5px]">
                  {data?.quantity * data?.amount / 100 + 8.25} $
                </div>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => { }} className="cursor-pointer [border:none] pt-[9.5px] px-0 pb-[11px] bg-[#6096B9] self-stretch rounded-md flex flex-row items-center justify-center">
          <div className="relative text-mid-5 leading-[24.5px] font-medium text-white text-center inline-block max-w-[264.3399963378906px]">
            Descargar entrada
          </div>
        </button>
      </div>
      <div className="self-stretch flex flex-col items-start justify-start pt-[15.5px] pb-[12.5px] pr-[12.839996337890625px] pl-[10.5px] gap-[7px] text-2xs-5 text-www-fourvenues-com-es-christian-lanza1-events-playa-y-rumba-29-02-2024-81y9-tickets-clrusb7w7018g01aeancrb2z0sg4m98f-4-form-1358x573-default-santas-gray">
        <div className="relative leading-[14px] inline-block max-w-[306.3399963378906px]">
          <span>{`Al hacer clic en `}</span>
          <b>Iniciar proceso de pago</b>
          <span> aceptas los términos</span>
        </div>
        <div className="relative leading-[14px] inline-block max-w-[306.3399963378906px]">
          y condiciones de uso del sitio web. Más información.
        </div>
      </div>

    </div>
  )
}