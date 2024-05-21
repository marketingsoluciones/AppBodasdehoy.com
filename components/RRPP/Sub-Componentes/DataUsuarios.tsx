import { memo, useMemo, type CSSProperties, FC } from "react";

export type DataUsuarioRType = {
  nombre?: string;
  correo?: string;
  icon?: string;

  /** Style props */
  propMinWidth?: CSSProperties["minWidth"];
  propBackgroundColor?: CSSProperties["backgroundColor"];
  propColor?: CSSProperties["color"];
};

const DataUsuarioR: FC <DataUsuarioRType> = memo(
  ({
    nombre,
    correo,
    icon,
    propMinWidth,
    propBackgroundColor,
    propColor,
  }) => {
    const DataUsuarioRStyle: CSSProperties = useMemo(() => {
      return {
        minWidth: propMinWidth,
      };
    }, [propMinWidth]);

    const buttonStyle: CSSProperties = useMemo(() => {
      return {
        backgroundColor: propBackgroundColor,
      };
    }, [propBackgroundColor]);

    const descargarStyle: CSSProperties = useMemo(() => {
      return {
        color: propColor,
      };
    }, [propColor]);

    return (
      <div className="w-[100%] box-border flex flex-col items-start justify-start pt-3.5 px-3.5 pb-[15px] text-left text-mid-5 text-black font-semibold border-b-[1px] border-solid border-gray-200">
        <div className="self-stretch flex flex-row items-center justify-start max-w-full">
          <div className="flex-1 flex flex-col items-start justify-start min-w-[316px] max-w-full">
            <div className="self-stretch flex flex-col items-start justify-start">
              <div
                className="relative leading-[24.5px] font-semibold inline-block min-w-[90px] max-h-[24.5px] mq625:max-w-full"
                style={DataUsuarioRStyle}
              >
                {nombre}
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start text-sm font-normal text-gray-400">
              <div className="relative leading-[21px] inline-block max-w-[486px] mq625:max-w-full">
                {correo}
              </div>
            </div>
          </div>
          <button className="cursor-pointer [border:none] p-0 bg-[transparent] w-[130px] flex flex-col items-start justify-start">
            <div
              className="self-stretch rounded-md bg-gray-200 flex flex-row items-center justify-start py-0 pr-[18px] pl-[19.299999999999272px] gap-[8.244684219360352px]"
              style={buttonStyle}
            >
              <div
                className="flex-1 relative text-sm leading-[36px] font-medium text-black text-center inline-block min-w-[69px] max-w-[109px]"
                style={descargarStyle}
              >{`Descargar `}</div>
              <div className="h-3.5 flex flex-row items-start justify-start">
                <img
                  className="h-3.5 w-[15.8px] relative overflow-hidden shrink-0"
                  alt=""
                  src={icon}
                />
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  },
);

export default DataUsuarioR;