import { useRouter } from "next/navigation";
import { FC, useState } from "react";

interface propsHeaderComp {
  logo?: any;
  PageIndex?: boolean;
}

const HeaderComp: FC<propsHeaderComp> = ({ logo = "../ModuloEvento/logo.png", PageIndex = false }) => {
  const router = useRouter()
  const [isNavOpen, setIsNavOpen] = useState(false);
  return (
    <div className="self-stretch flex flex-row items-center justify-between py-4 px-4 overflow-hidden text-white font-Clicker z-50 ">
      <img className="w-24 h-auto " src={logo} alt="logo" />
      <nav>
        {/* Menu Hamburguesa */}
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
                    if (!PageIndex) { router.push("/RelacionesPublicas") }
                    if (PageIndex) { router.push("/RelacionesPublicas") }
                  }} className={`cursor-pointer ${PageIndex ? "" : "hover:bg-[#6096B9]  text-gray-600 "} [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] hover:text-white text-left min-w-[53px]`} >
                    {PageIndex ? "Inicio" : "Eventos"}
                  </a>
                </li>
                <li className="border-b border-gray-400 my-4 uppercase">
                  <a onClick={() => {
                    if (!PageIndex) { router.push("ComprasComp") }
                    if (PageIndex) { router.push("RelacionesPublicas/PrincipalDE") }
                  }} className={`cursor-pointer ${PageIndex ? "" : "hover:bg-[#6096B9]  text-gray-600 "} [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] hover:text-white text-left min-w-[53px]`}>
                    {PageIndex ? "Eventos" : "Compras"}
                  </a>
                </li>
                <li className="border-b border-gray-400 my-4 uppercase">
                  <a onClick={() => {
                    if (!PageIndex) { router.push("#") }
                    if (PageIndex) { router.push("RelacionesPublicas") }
                  }} className={`cursor-pointer ${PageIndex ? "" : "hover:bg-[#6096B9]  text-gray-600 "} [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] hover:text-white text-left min-w-[53px]`}>
                    {PageIndex ? "Contactanos" : "Cuenta"}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Menu Principal */}
        <ul className="hidden space-x-8 lg:flex">
          <li>
            <a onClick={() => {
              if (!PageIndex) { router.push("/RelacionesPublicas") }
              if (PageIndex) { router.push("/RelacionesPublicas") }
            }} className={`cursor-pointer ${PageIndex ? "" : "hover:bg-[#6096B9]  text-gray-600 "} [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] hover:text-white text-left min-w-[53px]`} >
              {PageIndex ? "Inicio" : "Eventos"}
            </a>
          </li>
          <li>
            <a onClick={() => {
              if (!PageIndex) { router.push("ComprasComp") }
              if (PageIndex) { router.push("RelacionesPublicas/PrincipalDE") }
            }} className={`cursor-pointer ${PageIndex ? "" : "hover:bg-[#6096B9]  text-gray-600 "} [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] hover:text-white text-left min-w-[53px]`}>
              {PageIndex ? "Eventos" : "Compras"}
            </a>
          </li>
          <li>
            <a onClick={() => {
              if (!PageIndex) { router.push("#") }
              if (PageIndex) { router.push("RelacionesPublicas") }
            }} className={`cursor-pointer ${PageIndex ? "" : "hover:bg-[#6096B9]  text-gray-600 "} [border:none] pt-[6.7px] pb-[6.8px] px-2 rounded-[5.25px]  text-sm leading-[18px] hover:text-white text-left min-w-[53px]`}>
              {PageIndex ? "Contactanos" : "Cuenta"}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HeaderComp;