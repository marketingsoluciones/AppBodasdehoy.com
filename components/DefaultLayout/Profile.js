import Link from "next/link";
import { useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { capitalize } from "../../utils/Capitalize";
import { MensajeIcon } from "../icons";
import router from "next/router";
import { getAuth, signOut } from "firebase/auth";
import { AuthContextProvider } from "../../context";
import Cookies from "js-cookie";

const Profile = ({ user, state, set, ...rest }) => {
  const { config } = AuthContextProvider()
  const [dropdown, setDropwdon] = useState(false);
  const ListaDropdown = [
    {
      title: "Iniciar sesión",
      onClick: async () => { router.push(`${config?.pathDirectory}/login?d=app`) },
      user: "guest"
    },
    {
      title: "Registro",
      onClick: async () => { router.push(`${config?.pathDirectory}/login?d=app&q=register`) },
      user: "guest"
    },
    {
      title: "Ir al directorio",
      onClick: async () => { router.push(process.env.NEXT_PUBLIC_DIRECTORY) },
      user: "all"
    },
    {
      title: "Perfil",
      onClick: async () => { router.push(process.env.NEXT_PUBLIC_DIRECTORY) },
      user: "loged"
    },
    {
      title: "Cerrar sesión",
      onClick: async () => {
        Cookies.remove("sessionBodas", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "" });
        Cookies.remove("idToken", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "" });
        await signOut(getAuth());
        router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/signout?end=true` ?? "")
      },
      user: "loged"
    }
  ]
  const valirUser = user?.displayName == "guest" ? "guest" : "loged"
  const ListaDropdownFilter = ListaDropdown.filter(elem => elem?.user === valirUser || elem?.user === "all")

  return (
    <>
      <div
        className="text-gray-100 flex gap-6 cursor-pointer hover:text-gray-300 relative"
        {...rest}
      >
        <span className="flex items-center gap-2 relative">
          {/* <CorazonIcono
            className="cursor-pointer hover:opacity-80 transition"
            onClick={() => set(!state)}
          /> */}

          {/* <a href={process.env.NEXT_PUBLIC_CHAT ?? "/"} >
            <MensajeIcon className="cursor-pointer hover:opacity-80 transition" />
          </a> */}
        </span>

        <ClickAwayListener onClickAway={() => dropdown && setDropwdon(false)}>
          <div
            className="items-center gap-2 profile hidden md:flex relative"
            onClick={() => setDropwdon(!dropdown)}
          >
            {dropdown && (
              <div className="bg-white rounded-lg w-48 h-max shadow-lg absolute bottom-0 transform translate-y-[110%] overflow-hidden z-40 ">
                <ul className="w-full">
                  {ListaDropdownFilter?.map((item, idx) => (
                    <li key={idx} className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
                      <button onClick={item?.onClick}>{item.title && capitalize(item.title)}</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <img
              src={user?.photoURL ?? "/placeholder/user.png"}
              className="object-cover w-11 h-11 rounded-full"
              alt={user?.displayName}
            />
            <p className="font-display text-sm text-gray-500 capitalize">
              {user?.displayName !== "guest" && user?.displayName?.toLowerCase()}
            </p>
          </div>
        </ClickAwayListener>
      </div>
      <style jsx>
        {`
          .profile {
            min-width: 200px;
          }
        `}
      </style>
    </>
  );
};

export default Profile;
