import Link from "next/link";
import { useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { capitalize } from "../../utils/Capitalize";
import { CorazonIcono, MensajeIcon } from "../icons";

const Profile = ({ user, state, set, ...rest }) => {
  const [dropdown, setDropwdon] = useState(false);
  const ListaDropdown = [
    { title: "Ir al directorio", route: process.env.NEXT_PUBLIC_DIRECTORY },
    { title: "perfil", route: "/perfil" },
    { title: "prueba", route: "/prueba" },
  ];
  return (
    <>
      <div
        className="text-gray-100 flex gap-6 cursor-pointer hover:text-gray-300 relative"
        {...rest}
      >
        <span className="flex items-center gap-2 relative">
          <CorazonIcono
            className="cursor-pointer hover:opacity-80 transition"
            onClick={() => set(!state)}
          />
          <Link href="https://devchat.bodasdehoy.com/"> {/* href anterior: /chat */}
            <a>
              <MensajeIcon className="cursor-pointer hover:opacity-80 transition" />
            </a>            
          </Link>
        </span>

        <ClickAwayListener onClickAway={() => dropdown && setDropwdon(false)}>
          <div
            className="items-center gap-2 profile hidden md:flex"
            onClick={() => setDropwdon(!dropdown)}
          >
            {dropdown && (
              <div className="bg-white rounded-lg w-48 h-max shadow-lg absolute bottom-0 transform translate-y-full overflow-hidden z-40 ">
                <ul className="w-full">
                  {ListaDropdown?.map((item, idx) => (
                    <Link href={item?.route ?? ""} key={idx} passHref>
                      <li
                        className="w-full pl-5 py-1 text-gray-500 transition  hover:bg-primary hover:text-white font-display text-sm"
                        onClick={item?.function}
                      >
                        {item.title && capitalize(item.title)}
                      </li>
                    </Link>
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
