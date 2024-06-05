import { useRouter } from "next/router";
import { FC, useState } from "react";

const Header: FC = () => {
  const router = useRouter()
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="self-stretch flex flex-row items-center justify-between py-4 px-4 overflow-hidden text-white font-Clicker z-50 ">
      <a href="#">
        <img className="flex w-24 h-14 " src="ModuloEvento/LOGOMACHALA 1.png" alt="logo" />
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
                    router?.push("RelacionesPublicas/")
                  }} className="cursor-pointer">Inicio</a>
                </li>
                <li className="border-b border-gray-400 my-4 uppercase">
                  <a onClick={() => {
                    router?.push("RelacionesPublicas/PrincipalDE")
                  }} className="cursor-pointer">Eventos</a>
                </li>
                <li className="border-b border-gray-400 my-4 uppercase">
                  <a onClick={() => {
                    router?.push("RelacionesPublicas/")
                  }} className="cursor-pointer">Contactanos</a>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <ul className="DESKTOP-MENU hidden space-x-8 lg:flex">
          <li>
            <a onClick={() => {
              router?.push("RelacionesPublicas/")
            }} className="cursor-pointer" >Inicio</a>
          </li>
          <li>
            <a onClick={() => {
              router?.push("RelacionesPublicas/PrincipalDE")
            }} className="cursor-pointer">Eventos</a>
          </li>
          <li>
            <a onClick={() => {
              router?.push("RelacionesPublicas/")
            }} className="cursor-pointer">Contactanos</a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Header;

