import { FC } from "react";
import Checkbox from "../../components/RRPP/Sub-Componentes/Checkbox1";
import Card1 from "../../components/RRPP/Sub-Componentes/Card";
import HeaderComp from "../../components/RRPP/Sub-Componentes/HeaderComp";
import { useRouter } from "next/navigation";

interface propsComprasComp { }

const ComprasComp: FC<propsComprasComp> = ({ }) => {
  const router = useRouter()
  return (
    <div className="w-[100%] h-[100vh] bg-slate-100 pt[20px] [filter:blur(0px)] flex flex-col md:items-start items-center justify-start pt-[20px] gap-[21px] tracking-[normal] leading-[normal] mq450:max-w-full mq725:max-w-full mq975:max-w-full mq1000:max-w-full">
      <HeaderComp />
      <section className="self-stretch flex flex-col items-start justify-start gap-[10.5px] text-center px-3 text-gray-600 font-medium">
        <div className="self-stretch flex md:flex-row md:items-start items-center justify-between">
          <div className="self-stretch flex flex-col items-center justify-center py-0 px-5">
            <b className="relative leading-[32px] mq450:text-2xl mq450:leading-[25px]">
              Mis Compras
            </b>
          </div>
          <div className="self-stretch flex flex-col items-end justify-start">
            <button className="cursor-pointer [border:none] py-[3.5px] px-[7px] bg-gray-300 hover:bg-gray-500 rounded-[5.25px] flex flex-row items-center justify-end gap-[3.5px]">
              <div className="flex flex-row items-start justify-start">
                <Checkbox />
              </div>
              <div className="relative text-xs leading-[18px] text-white text-center">
                Mostrar todos los tickets
              </div>
            </button>
          </div>
        </div>
        <div className="self-stretch flex flex-col items-start justify-start py-0 pr-5 pl-0 text-left text-sm text-wwwfourvenuescom-santas-gray">
          <b className="relative tracking-[2.8px] leading-[21px] uppercase">
            diciembre,2024
          </b>
        </div>
        <div className="flex flex-wrap items-center justify-center">
          <Card1 />
        </div>
      </section>

      <section className="w-full flex flex-row items-start justify-center py-0 md:px-[262px] px-3 box-border text-center text-sm text-gray-600 mq450:pl-5">
        <div className="flex-1 rounded-md box-border flex flex-col items-start justify-start pt-5 px-[21px] pb-6 gap-[10.8px] md:max-w-[500px] border-[1px] border-solid border-gray-300">
          <div className="self-stretch flex flex-row items-start justify-center text-[16px] text-wwwfourvenuescom-santas-gray">
            <div className="relative leading-[25px]">
              ¿No encuentras tu ticket?
            </div>
          </div>
          <div className="self-stretch flex flex-row items-start justify-start py-0 md:px-12 box-border max-w-full mq450:pl-6 mq450:pr-6 mq450:box-border">
            <div className="md:flex-1 flex flex-col items-end justify-start gap-[3px] max-w-full">
              <div className="relative leading-[21px] text-gray-400 ">
                Intenta recuperarlo rellenando los datos de tu compra:
              </div>
              <div className="self-stretch flex flex-row items-start justify-center py-0 pr-5 pl-[22px]">
                <button onClick={() => {
                  router.push("RecuperarCompra")
                }}
                  className="cursor-pointer [border:none] py-0 px-2.5 bg-[#6096B9] hover:bg-[#3f85b4] rounded-md flex flex-row md:items-end items-center md:justify-start justify-center gap-[10.9px]">
                  <div className="flex md:flex-col items-start justify-end pt-0 px-0 md:pb-[10.5px]">
                    <img
                      className="w-3.5 h-3.5 relative overflow-hidden shrink-0"
                      alt=""
                      src="../ModuloEvento/Vectorlapis.svg"
                    />
                  </div>
                  <div className="relative text-sm leading-[36px] font-medium text-white text-center inline-block md:min-w-[111px]">
                    Recuperar ticket
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="self-stretch flex flex-col items-center justify-start">
            <div className="self-stretch flex flex-col items-center justify-start py-0 px-2.5">
              <div className="relative leading-[21px] text-gray-400">
                O ponte en contacto con nuestro equipo de atención al cliente
                en:
              </div>
            </div>
            <div className="rounded-md bg-[#6096B9] hover:bg-[#3f85b4] flex flex-row items-center justify-start py-0 px-2.5 gap-[10.9px] md:z-[1] mt-[-0.5px] text-profourvenuescom-nero">

              <img
                className="h-3.5 w-3.5 relative overflow-hidden shrink-0"
                alt=""
                src="../ModuloEvento/Containermensaje.svg"
              />
              <div className="relative leading-[36px] font-medium whitespace-nowrap text-white">
                soporte@fourvenues.com
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default ComprasComp;
