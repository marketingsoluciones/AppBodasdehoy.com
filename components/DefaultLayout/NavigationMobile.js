import { useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import Link from "next/link";
import { InvitacionesIcon, InvitadosIcon, MesasIcon, MisEventosIcon } from "../icons";
import ClickAwayListener from "react-click-away-listener";
import router from "next/router";


const NavigationMobile = () => {
  const { user } = AuthContextProvider();
  const [show, setShow] = useState(false)
  console.log(show)

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


        <li onClick={() => setShow(!show)} className="text-blue-primary hover:text-blue-secondary cursor-pointer transition" >
          <img  src={user?.photoURL ?? "/placeholder/user.png"} className="w-10 h-10 rounded-full" />
        </li>

      </ul>
      <ClickAwayListener onClickAway={() => show && setShow(true)}>
        <span className={`${show ? "  block absolute right-5 bottom-24 md:right-56" : "hidden"}`}>
          <ProfileMenu />
        </span>
      </ClickAwayListener>
    </>
  );
};

const ProfileMenu = () => {
  const { user } = AuthContextProvider();
  return (
    <>
      <div className={`w-40 h-16 rounded-md h-max  bg-white shadow-md  right-2 inset-y-full overflow-hidden z-100 `}>
        <ul className="w-full">

          {!user && <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
            <button onClick={async () => { router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? "") }}>Login</button>
          </li>}

          <Link href={process.env.NEXT_PUBLIC_DIRECTORY} passHref>
            <li
              className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm"
            > 
              <p>ir al directorio</p>
            </li>
          </Link>

          {user && <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
            <button onClick={async () => { router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/signout?end=true` ?? "") }}>Cerrar Sesión</button>
          </li>}

        </ul>
      </div>
    </>
  );
};

export default NavigationMobile;
