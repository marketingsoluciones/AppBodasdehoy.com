import { FC } from "react";
interface propsHeaderComp {
  componentState: any;
  setComponentState: any;

}

const HeaderComp: FC<propsHeaderComp> = ({componentState, setComponentState}) => {
  return (
    <div className="w-[100%] h-[54px] max-w-full flex flex-row items-baseline justify-between py-[3.5px] px-[50px] box-border leading-[normal] tracking-[normal] text-left text-sm">
      <div onClick={()=>{ 
        setComponentState(0)
      }} 
      className="cursor-pointer flex w-18 h-8 text-base text-black"><img src="ModuloEvento/logo.png" alt="" /></div>
      <div className="w-auto flex flex-row items-center justify-end py-1 px-0 box-border">
        
        <div onClick={()=>{ 
        setComponentState(1)
      }} 
        className="cursor-pointer flex-1 flex flex-col items-start justify-start hover:bg-[#6096B9] rounded-md">
          <div className="flex flex-row items-start justify-start">
            <div className="rounded-[5.25px] flex flex-col items-start justify-start p-[7px]">
              <div className="relative leading-[18px] inline-block min-w-[52px] text-gray-600 hover:text-white">
                Entradas
              </div>
            </div>
          </div>
        </div>
        <button onClick={()=>{ 
        setComponentState(9)
      }} 
        className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] px-[7px] pb-[6.8px] flex-[0.791] rounded-[5.25px] flex flex-col items-end justify-center ">
          <div className="relative text-sm leading-[18px] text-gray-600 hover:text-white text-left inline-block min-w-[53px]">
            Compras
          </div>
        </button>

        <div onClick={()=>{ 
        setComponentState(1)
      }} 
        className="cursor-pointer flex flex-row items-start justify-start py-[3.5px] px-0 hover:bg-[#6096B9] rounded-md">
          <div className="rounded-[5.25px] flex flex-col items-start justify-start p-[7px]">
            <div className="relative leading-[18px] inline-block min-w-[42px] text-gray-600 hover:text-white">
              Cuenta
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderComp;