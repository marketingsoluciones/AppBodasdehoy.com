import { useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import Link from "next/link";
import { InvitacionesIcon, InvitadosIcon, MesasIcon, MisEventosIcon } from "../icons";

const NavigationMobile = () => {
  const { user } = AuthContextProvider();

  const Navbar = [
    { title: "Mis eventos", icon: <MisEventosIcon className="text-primary w-7 h-7" />, route: "/" },
    { title: "Invitados", icon: <InvitadosIcon className="text-primary w-7 h-7" />, route: "/invitados" },
    { title: "Invitaciones", icon: <InvitacionesIcon className="text-primary w-7 h-7" />, route: "/invitaciones" },
    { title: "Mesas", icon: <MesasIcon className="text-primary w-7 h-7" />, route: "/mesas" },
  ]

  return (
    <>
      <ul className="f-bottom md:hidden bg-white z-50 rounded-t-2xl h-max py-5 shadow-lg w-full fixed bottom-0 grid grid-cols-5 place-items-center">
        {Navbar.map((item, idx) => (

          <Link key={idx} href={item.route}>
            <li className="cursor-pointer transition text-primary">
              {item.icon}
            </li>
          </Link>
        ))}


        <li className="text-blue-primary hover:text-blue-secondary cursor-pointer transition">
          <img src={user?.photoURL ?? "/placeholder/user.png"} className="w-10 h-10 rounded-full" />
        </li>
      </ul>
    </>
  );
};

export default NavigationMobile;
