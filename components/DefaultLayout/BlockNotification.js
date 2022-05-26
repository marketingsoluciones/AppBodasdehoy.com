import { useContext, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import Link from 'next/link'
import EventoContext from '../../context/EventContext'

const BlockNotification = ({ state, set, evento }) => {
  const [initial, setInitial] = useState("translate-x-full");
  const [notificaciones, setNotificaciones] = useState(evento.notificaciones_array)

  useEffect(() => {
    let timeout = setTimeout(() => {
      setInitial("translate-x-0");
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, []);


  return (
      <ClickAwayListener onClickAway={() => state && set(!state)}>
    <div
      className={`w-96 z-50 bg-white fixed top-0 right-0 h-screen flex flex-col items-center font-display py-12 transform transition duration-200  rounded-l-2xl shadow-lg  ${
        state ? initial : "translate-x-full"
      } `}
    >
      {/* Cabecera */}
      <h2 className="text-2xl font-light text-center text-gray-500 pb-6">
        Notificaciones
      </h2>
      <div className="grid gap-2 min-w-full	px-6 ">
        {notificaciones?.length <= 0 
        ? <h3 className="text-sm text-gray-500 py-4">No hay notificaciones</h3>
        : (
          notificaciones?.map((item, idx) => (
            <Notification data={item} key={idx} />
            ))
        )
      }
           
      </div>
      <Link href="/bandeja-de-mensajes">
      <button className="bg-primary w-full h-10 absolute bottom-0 grid place-items-center focus:outline-none"  onClick={() => set(!state)}>
        <p className="font-display text-white text-sm hover:scale-105 transform transition">
          Ver todas las notificaciones
        </p>
      </button>
      </Link>
    </div>
    </ClickAwayListener>
  );
};

export default BlockNotification;

const Notification = ({data}) => {
  const {mensaje} = data
  console.log("data", data)
  return (
    <div className="flex gap-3 w-full min-w-full justify-start items-center border-b border-base py-3 px-3 relative rounded-lg overflow-hidden hover:bg-base transition">
      <div className="w-1 h-full bg-tertiary absolute left-0 rounded-lg " />
      <img src="/profile_woman.png" className="w-8 h-8 object-cover" />
      <p className="text-gray-300 text-sm font-medium ">
      
        <span className="font-normal text-gray-500">
          {mensaje}
        </span>
      </p>
    </div>
  );
};
