import { FC, useState } from "react";
interface propsHeaderComp {
  componentState: any;
  setComponentState: any;

}

const HeaderComp: FC<propsHeaderComp> = ({componentState, setComponentState}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  return (
    <div className="self-stretch flex flex-row items-center justify-between py-4 px-4 overflow-hidden text-white font-Clicker z-50 ">
    <a onClick={()=>{ 
        setComponentState(0)
      }} >
      <img className="cursor-pointer flex w-24 h-8 " src="ModuloEvento/logo.png" alt="logo" />
    </a>
    <nav>

      <section className="MOBILE-MENU flex-col lg:hidden gap-2 ">
        <div
          className="HAMBURGER-ICON space-y-2 cursor-pointer"
          onClick={() => setIsNavOpen((prev) => !prev)}
        >
          <span className="block h-0.5 w-8 bg-white"></span>
          <span className="block h-0.5 w-8 bg-white"></span>
          <span className="block h-0.5 w-8 bg-white"></span>
        </div>

        <div className={isNavOpen ? "block " : "hidden "}>

          <div className="mobile-menu-container absolute left-40 right-4 top-32 bg-white rounded-md shadow-md text-black">
              
            <ul className="MENU-LINK-MOBILE-OPEN flex flex-col items-center justify-between min-h-[250px]">
              <li className="border-b border-gray-400 my-4 uppercase ">
                <a onClick={() => {
              setComponentState(1)
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] px-[7px] pb-[6.8px]  rounded-[5.25px] justify-center text-sm text-gray-600 hover:text-white text-left min-w-[53px]">Eventos</a>
              </li>
              <li className="border-b border-gray-400 my-4 uppercase">
                <a onClick={() => {
              setComponentState(9)
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] px-[7px] pb-[6.8px]  rounded-[5.25px] justify-center text-sm text-gray-600 hover:text-white text-left min-w-[53px]">Compras</a>
              </li>
              <li className="border-b border-gray-400 my-4 uppercase">
                <a onClick={() => {
              setComponentState(1)
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] px-[7px] pb-[6.8px]  rounded-[5.25px] justify-center text-sm text-gray-600 hover:text-white text-left min-w-[53px]">Cuentas</a>
              </li>
            </ul>
          </div>

        </div>
      </section>

      <ul className="DESKTOP-MENU hidden space-x-8 lg:flex">
        <li>
          <a onClick={() => {
              setComponentState(1)
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] text-gray-600 hover:text-white text-left min-w-[53px]" >Eventos</a>
        </li>
        <li>
          <a onClick={() => {
              setComponentState(9)
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] text-gray-600 hover:text-white text-left min-w-[53px]">Compras</a>
        </li>
        <li>
          <a onClick={() => {
              setComponentState(1)
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] text-gray-600 hover:text-white text-left min-w-[53px]">Cuenta</a>
        </li>
      </ul>
    </nav>
  </div>
/*     <div className="w-[100%] h-[54px] max-w-full flex flex-row items-baseline justify-between py-[3.5px] px-[50px] box-border leading-[normal] tracking-[normal] text-left text-sm">
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
    </div> */
  );
};

export default HeaderComp;