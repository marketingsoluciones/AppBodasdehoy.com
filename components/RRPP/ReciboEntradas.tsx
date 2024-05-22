import { FC } from "react";
import DatosUsurariosR from "./Sub-Componentes/DataUsuarios";
import HeaderComp from "./Sub-Componentes/HeaderComp";
interface propsReciboEntradas {
    componentState: any;
    setComponentState: any;
  
  }

const ReciboEntradas: FC <propsReciboEntradas> = ({componentState, setComponentState}) => {
  return (
    <div className="w-[100%] h-[100%] flex flex-col bg-slate-100 items-center justify-start py-[20px] px-0 box-border gap-[56px] tracking-[normal] text-center text-xl mq450:gap-[28px_56px] mq450:max-w-full mq625:max-w-full mq675:max-w-full">
      <HeaderComp componentState={componentState} setComponentState={setComponentState}/>
      <div className="self-stretch h-[172.5px] flex flex-col items-start justify-start gap-[28px]">
        <div className="self-stretch flex-1 flex flex-col items-center justify-start pt-0 px-5 pb-px">
          <div className="flex-1 flex flex-row items-start justify-start">
            <img
              className="h-28 w-28 relative overflow-hidden shrink-0"
              alt=""
              src="ModuloEvento/checkgrande.svg"
            />
          </div>
        </div>
        <div className="self-stretch flex flex-col items-center justify-start py-0 pr-5 pl-[21px] font-medium">
          <div className="w-full relative leading-[31.5px] inline-block max-h-[31.5px] mq450:text-2xl mq450:leading-[25px] mq450:max-w-full mq625:max-w-full mq675:max-w-full">
            Proceso completado
          </div>
        </div>
      </div>
      <div className="rounded-md bg-white flex flex-col items-center justify-center pt-3.5 px-3.5 pb-7 box-border gap-[14px] max-w-full text-left text-sm  mq450:pt-5 mq450:pb-5 mq450:box-border">
        <div className="w-[100%] overflow-x-auto flex flex-col items-start justify-start max-w-full">
          <DatosUsurariosR
            nombre="yoe stener"
            correo="azulprofile@gmail.com"
            icon="ModuloEvento/descarga.svg"
          />
          <DatosUsurariosR
            nombre="juan carlos carrillo"
            correo="carlos.carrillo@recargaexpress.com"
            icon="ModuloEvento/descarga.svg"
            propMinWidth="unset"
            propBackgroundColor="#e4e4e7"
            propColor="#18181b"
          />
          <DatosUsurariosR
            nombre="christian lanza"
            correo="christian.lanza95@gmail.com"
            icon="ModuloEvento/descarga.svg"
            propMinWidth="124px"
            propBackgroundColor="#e4e4e7"
            propColor="#18181b"
          />
          <DatosUsurariosR
            nombre="jhuliana delgado"
            correo="crisyelit@gmail.com"
            icon="ModuloEvento/descarga.svg"
            propMinWidth="unset"
            propBackgroundColor="#e4e4e7"
            propColor="#18181b"
          />
        </div>
        <div className="self-stretch flex flex-row flex-wrap items-center justify-start gap-[10.5px] max-w-full">
          <div className="flex-1 flex flex-col items-start justify-start min-w-[327px] max-w-full">
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="w-auto relative leading-[21px] flex items-center text-gray-400 box-border pr-5 mq625:max-w-full">
                <span className="w-full">
                  <p className="m-0">
                    Siempre puedes descargar los PDFs en My tickets o en tu
                    bandeja de
                  </p>
                  <p className="m-0">entrada.</p>
                </span>
              </div>
            </div>
          </div>
          <button onClick={()=>{ 
        setComponentState(1)
      }}
           className="cursor-pointer [border:none] p-0 bg-[transparent] w-[130px] flex flex-col items-start justify-start">
            <div className="self-stretch rounded-md bg-[#6096B9] flex flex-row items-center justify-start py-0 pr-[21px] pl-[22.5px] gap-[8.107246398925781px]">
              <div className="flex-1 relative text-sm leading-[36px] font-medium text-white text-center inline-block min-w-[66px] max-w-[109px]">{`Continuar `}</div>
              <div className="h-3.5 flex flex-row items-start justify-start">
                <img
                  className="h-3.5 w-[12.3px] relative overflow-hidden shrink-0"
                  alt=""
                  src="ModuloEvento/flechade.svg"
                />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReciboEntradas;
