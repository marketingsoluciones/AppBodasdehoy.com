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
  const ListaDropdown = []
  if (config?.pathDirectory) {
    ListaDropdown.push({ title: "Ir al directorio", route: process.env.NEXT_PUBLIC_DIRECTORY })
  }
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
            className="items-center gap-2 profile hidden md:flex"
            onClick={() => setDropwdon(!dropdown)}
          >
            {dropdown && (
              <div className="bg-white rounded-lg w-48 h-max shadow-lg absolute bottom-0 transform translate-y-full overflow-hidden z-40 ">
                <ul className="w-full">
                  {user.displayName == "guest" &&
                    <>
                      <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
                        <button onClick={async () => { router.push(`${config?.pathDirectory ? config.pathDirectory : ""}/login?d=app` ?? "") }}>Inicio de sesión</button>
                      </li>
                      <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
                        <button onClick={async () => { router.push(`${config?.pathDirectory ? config.pathDirectory : ""}/login?d=app&a=registro` ?? "") }}>Registro</button>
                      </li>
                    </>
                  }
                  {ListaDropdown?.map((item, idx) => (
                    <Link href={item?.route ?? "/"} key={idx} passHref>
                      <li
                        className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm"
                        onClick={item?.function}
                      >
                        {item.title && capitalize(item.title)}
                      </li>

                    </Link>
                  ))}
                  {!user.displayName == "guest" && <li className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm">
                    <button onClick={async () => {
                      Cookies.remove("sessionBodas", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "" });
                      Cookies.remove("idToken", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "" });
                      await signOut(getAuth());
                      router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/signout?end=true` ?? "")
                    }}>Cerrar Sesión</button>
                  </li>}
                </ul>
              </div>
            )}

            <img
              src={user?.photoURL ?? "/placeholder/user.png"}
              className="object-cover w-11 h-11 rounded-full"
              alt={user?.displayName}
            />
            <p className="font-display text-sm text-gray-500 capitalize">
              {user?.displayName?.toLowerCase()}
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
