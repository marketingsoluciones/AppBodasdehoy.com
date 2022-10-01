import { useEffect, useRef, useState } from "react";
import { AuthContextProvider } from "../../context";
import Link from "next/link";
import { InvitacionesIcon, InvitadosIcon, MesasIcon, MisEventosIcon } from "../icons";
import router from "next/router";

const useOutsideSetShow = (ref, setShow) => {
  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setTimeout(() => {
        setShow(false)
      }, 50);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });
};

const NavigationMobile = () => {
  const wrapperRef = useRef(null);
  const { user } = AuthContextProvider();
  const [show, setShow] = useState(false)
  useEffect(() => {
    console.log(show)
  }, [show])

  const Navbar = [
    { title: "Mis eventos", icon: <MisEventosIcon className="text-primary w-7 h-7" />, route: "/" },
    { title: "Invitados", icon: <InvitadosIcon className="text-primary w-7 h-7" />, route: "/invitados" },
    { title: "Invitaciones", icon: <InvitacionesIcon className="text-primary w-7 h-7" />, route: "/invitaciones" },
    { title: "Mesas", icon: <MesasIcon className="text-primary w-7 h-7" />, route: "/mesas" },
  ]
  useOutsideSetShow(wrapperRef, setShow);
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

        <div className="w-10 h-10 truncate">
          <li onClick={() => {
            setShow(!show)
          }} className="text-blue-primary hover:text-blue-secondary cursor-pointer transition" >
            <img src={user?.photoURL ?? "/placeholder/user.png"} className="w-10 h-10 rounded-full" />
          </li>
          {show &&
            <div ref={wrapperRef} >
              <ProfileMenu />
            </div>
          }
        </div>

      </ul>
    </>
  );
};

const ProfileMenu = () => {
  const { user } = AuthContextProvider();
  return (
    <>
      <div className={`bg-white w-40 h-16 rounded-md shadow-md overflow-hidden absolute transform translate-x-[calc(-122px)] translate-y-[calc(-110px)]`}>
        <ul className="w-full">

          {!user && <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
            <button onClick={async () => { router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? "") }}>Login</button>
          </li>}

          <Link href={process.env.NEXT_PUBLIC_DIRECTORY} passHref>
            <li
              className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm"
            >
              <p>Ir al directorio</p>
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
