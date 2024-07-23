import { FC } from "react";
import DatosUsurariosR from "../../components/RRPP/Sub-Componentes/DataUsuarios";
import HeaderComp from "../../components/RRPP/Sub-Componentes/HeaderComp";
import { useRouter } from "next/router";
import { AuthContextProvider } from "../../context";
import { id } from "date-fns/locale";
interface propsReciboEntradas { }

const ReciboEntradas: FC<propsReciboEntradas> = ({ }) => {
  const { usuariosTickets } = AuthContextProvider()
  const router = useRouter()

  return (
    <div className="w-[100%] h-[100vh] flex flex-col bg-slate-100 items-center justify-start py-[20px] px-0 box-border gap-[56px] tracking-[normal] text-center text-xl mq450:gap-[28px_56px] mq450:max-w-full mq625:max-w-full mq675:max-w-full">
      <HeaderComp />
      <div className="self-stretch h-[172.5px] flex flex-col items-start justify-start gap-[28px]">
        <div className="self-stretch flex-1 flex flex-col items-center justify-start pt-0 px-5 pb-px">
          <div className="flex-1 flex flex-row items-start justify-start">
            <img
              className="h-28 w-28 relative overflow-hidden shrink-0"
              alt=""
              src="../ModuloEvento/checkgrande.svg"
            />
          </div>
        </div>
        <div className="self-stretch flex flex-col items-center justify-start py-0 pr-5 pl-[21px] font-medium">
          <div className="w-full relative leading-[31.5px] inline-block max-h-[31.5px] mq450:text-2xl mq450:leading-[25px] mq450:max-w-full mq625:max-w-full mq675:max-w-full">
            Proceso completado
          </div>
        </div>
      </div>
      <div className="w-[550px] rounded-md bg-white flex flex-col items-center justify-center pt-3.5 px-3.5 pb-7 box-border gap-[14px] md:max-w-full text-left md:text-sm">
        <div className="md:w-[100%] w-auto md:overflow-x-auto flex flex-col items-start justify-start md:max-w-full">
          {usuariosTickets.map((item, idx) => {
            return (
              <div className="w-full" key={idx}>
                <DatosUsurariosR
                  nombre={item.name}
                  correo={item.email}
                />
              </div>
            )
          })}
        </div>
        <div className="self-stretch flex flex-row flex-wrap items-center justify-end pr-[11px]  max-w-full">

          <button onClick={() => {
            router.push("VentasEntradas")
          }}
            className="cursor-pointer [border:none] p-0 bg-[transparent] w-[130px] flex flex-col items-start justify-start">
            <div className="self-stretch rounded-md bg-[#6096B9] flex flex-row items-center justify-start py-0 pr-[21px] pl-[22.5px] gap-[8.107246398925781px]">
              <div className="flex-1 relative text-sm leading-[36px] font-medium text-white text-center inline-block min-w-[66px] max-w-[109px]">{`Continuar `}</div>
              <div className="h-3.5 flex flex-row items-start justify-start">
                <img
                  className="h-3.5 w-[12.3px] relative overflow-hidden shrink-0"
                  alt=""
                  src="../ModuloEvento/flechade.svg"
                />
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className="flex flex-col items-start justify-start max-w-full text-xs">
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="w-full relative leading-[21px] flex items-center text-gray-400 box-border pr-5">
                <p className="max-w-[350px]">
                  Siempre puedes descargar los PDFs en My tickets o en tu
                  bandeja de entrada.
                </p>
              </div>
            </div>
          </div>
    </div>
  );
};

export default ReciboEntradas;
