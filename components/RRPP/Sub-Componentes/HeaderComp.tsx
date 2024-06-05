import { useRouter } from "next/router";
import { FC, useState } from "react";


const HeaderComp: FC = () => {
  const router = useRouter()
  const [isNavOpen, setIsNavOpen] = useState(false);
  return (
    <div className="self-stretch flex flex-row items-center justify-between py-4 px-4 overflow-hidden text-white font-Clicker z-50 ">
      {/* <a onClick={() => { window.history.back() }} > */}
      <img className="cursor-pointer flex w-24 h-8 " src="../ModuloEvento/logo.png" alt="logo" />
      {/* </a> */}
      <nav>

        <section className="flex-col lg:hidden gap-2 ">
          <div
            className="space-y-2 cursor-pointer"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            <span className="block h-0.5 w-8 bg-gray-600"></span>
            <span className="block h-0.5 w-8 bg-gray-600"></span>
            <span className="block h-0.5 w-8 bg-gray-600"></span>
          </div>

          <div className={isNavOpen ? "block " : "hidden "}>

            <div className="mobile-menu-container absolute left-40 right-4 top-32 bg-white rounded-md shadow-md text-black">

              <ul className="flex flex-col items-center justify-between min-h-[250px]">
                <li className="border-b border-gray-400 my-4 uppercase ">
                  <a onClick={() => {
                    router.push("/RelacionesPublicas")
                  }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] px-[7px] pb-[6.8px]  rounded-[5.25px] justify-center text-sm text-gray-600 hover:text-white text-left min-w-[53px]">Eventos</a>
                </li>
                <li className="border-b border-gray-400 my-4 uppercase">
                  <a onClick={() => {
                    router.push("ComprasComp")
                  }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] px-[7px] pb-[6.8px]  rounded-[5.25px] justify-center text-sm text-gray-600 hover:text-white text-left min-w-[53px]">Compras</a>
                </li>
                <li className="border-b border-gray-400 my-4 uppercase">
                  <a onClick={() => {
                    router.push("#")
                  }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] px-[7px] pb-[6.8px]  rounded-[5.25px] justify-center text-sm text-gray-600 hover:text-white text-left min-w-[53px]">Cuentas</a>
                </li>
              </ul>
            </div>

          </div>
        </section>

        <ul className="hidden space-x-8 lg:flex">
          <li>
            <a onClick={() => {
              router.push("/RelacionesPublicas")
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] text-gray-600 hover:text-white text-left min-w-[53px]" >Eventos</a>
          </li>
          <li>
            <a onClick={() => {
              router.push("ComprasComp")
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] text-gray-600 hover:text-white text-left min-w-[53px]">Compras</a>
          </li>
          <li>
            <a onClick={() => {
              router.push("#")
            }} className="cursor-pointer hover:bg-[#6096B9] [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] text-gray-600 hover:text-white text-left min-w-[53px]">Cuenta</a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HeaderComp;