import { FC } from "react";
import { config } from "react-transition-group";
import { AuthContextProvider } from "../../../context";
import { CheckCondition } from "./CheckConition";

interface propsResumenComponents {
  data: any

}
export const ResumenComponents: FC<propsResumenComponents> = ({ data }) => {
  const { config } = AuthContextProvider()
  return (
    <>
      <div className="self-stretch w-auto flex flex-col items-start justify-start box-border ">
        <div className="self-stretch rounded-md bg-white shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] flex flex-col items-start justify-start p-[10.5px] gap-[10.5px]">
          {
            data != undefined || null ?
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
              :
              <div className="flex  items-center justify-center w-[409px] h-[210px]">
                < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
              </div>
          }
        </div>
        <div className=" pt-5 pl-2   max-w-[400px]">
          <CheckCondition />
          <p className="pt-10">Al hacer clic en
            <span className="font-semibold">Iniciar proceso de pago </span>
            aceptas los términos y condiciones de uso del sitio web. Más información.</p>
        </div>
      </div>
      <style jsx>
        {`
      .loader {
        border-top-color:  ${config?.theme?.primaryColor};
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

  )
}