import { FunctionComponent, memo, useMemo, type CSSProperties, FC } from "react";

type CompVentas1Type = {
  lolo?: string;
  icon?: string;
  link?: string;
  componentState: any;
  setComponentState: any;

  /** Style props */
  propMinWidth?: CSSProperties["minWidth"];
};

const CompVentas1: FC <CompVentas1Type> = 
  ({ lolo, icon, propMinWidth, link, componentState, setComponentState}) => {
    const loloStyle: CSSProperties = useMemo(() => {
      return {
        minWidth: propMinWidth,
      };
    }, [propMinWidth]);

    return (
      <div className="self-stretch rounded-md bg-white shadow-[0px_1px_14px_rgba(0,_0,_0,_0.12),_0px_5px_8px_rgba(0,_0,_0,_0.14),_0px_3px_5px_-1px_rgba(0,_0,_0,_0.2)] overflow-hidden flex flex-col items-start justify-start p-px box-border max-w-full text-left text-base text-black font-medium">
          <div className="self-stretch flex flex-row items-center justify-start p-[10.5px] box-border max-w-full [row-gap:20px]">
            <div className="flex flex-col items-start justify-start pr-[10.5px] pl-0 box-border min-w-[316px] max-w-full">
              <div className="self-stretch overflow-hidden flex flex-col items-start justify-start">
                <div
                  className="w-auto h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[28px] max-w-[537.3599853515625px] max-h-[24.5px]"
                  style={loloStyle}
                >
                  {lolo}
                </div>
              </div>
            </div>
            <div className="w-auto flex flex-col items-start justify-start py-[10.5px] pr-[10.5px] pl-0 box-border z-[1] text-center">
              <div className="self-stretch flex flex-row items-center justify-start gap-[5px]">
                <div className="flex flex-col items-center justify-start">
                  <div className="self-stretch rounded-md bg-green-200 flex flex-row items-start justify-start p-[10.5px]">
                    <div className="flex flex-col items-center justify-start py-0 px-[10.5px]">
                      <div className="self-stretch h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[11px] max-h-[24.5px]">
                        0
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={()=>{ 
        setComponentState(link)
      }}   className="cursor-pointer [border:none] p-0 bg-[transparent] flex-1 flex flex-col items-start justify-start">
                  <div className="self-stretch rounded-md bg-rosa flex flex-row items-start justify-start pt-[13.5px] px-[21px] pb-[15px]">
                    <div className="h-[17px] flex flex-row items-start justify-start">
                      <img
                        className="h-[17px] w-[15.3px] relative overflow-hidden shrink-0"
                        alt=""
                        src={icon}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

      </div>
    );
  };

export default CompVentas1;