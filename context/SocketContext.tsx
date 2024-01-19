import {
  createContext,
  FC,
  useState,
  useEffect,
  useContext,
  SetStateAction,
} from "react";
import { Socket } from "socket.io-client";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from ".";
import { api } from '../api';
import { Dispatch } from 'react';
import { getCookie } from '../utils/Cookies';
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { parseJwt } from "../utils/Authentication"

type Context = {
  socket: Socket | null;
  //setSocket : Dispatch<SetStateAction<Socket | null>>
};

const initialContext: Context = {
  socket: null,
  //setSocket : () => {}
};

const SocketContext = createContext<Context>(initialContext);

const SocketProvider: FC<any> = ({ children }): JSX.Element => {
  const router = useRouter()
  const { user, config } = AuthContextProvider()
  const [socket, setSocket] = useState<Socket | null>(initialContext.socket);

  useEffect(() => {
    const token = Cookies.get("idToken")
    // console.log(10008, parseJwt(token), Math.trunc(new Date().getTime() / 1000))
    if (token && !socket?.connected) {
      console.log("=======> Conecta...")
      setSocket(api.socketIO({
        token,
        development: config?.development,
        father: router?.query?.father,
        origin: window?.origin
      }))
    }
    if (!token && socket) {
      console.log(1445411155, "socket.disconnect")
      socket.disconnect();
    }
  }, [user])

  useEffect(() => {
    socket?.on("connect", () => {
      console.log(1445411144, socket)
      console.log(1.00003, "Conectado", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }))

      socket?.emit(`app`, {
        emit: socket?.id,
        receiver: user?.uid,
        type: "",
        payload: {
          action: "",
          value: "nueva conexión"
        }
      })

    })
    socket?.on("disconnect", (reason) => {
      console.log(1.00003, "Desconectado", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        reason)
    })
    socket?.on("connect_error", (error) => {
      console.log(1.00003, "Connect_error", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        error)
    })
    socket?.io.on("ping", () => { console.log(1.00003, "ping", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' })) })
    socket?.io.on("reconnect", (attempt) => {
      console.log(1.00003, "ping", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        attempt)
    })
    socket?.io.on("reconnect_attempt", (attempt) => {
      console.log(1.00003, "ping", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        attempt)
    })
    socket?.io.on("reconnect_error", (error) => {
      console.log(1.00003, "ping", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        error)
    })
    socket?.io.on("reconnect_failed", () => {
      console.log(1.00003, "ping", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }))
    })

  }, [socket])

  socket?.on("app", async (msg) => {
    console.log(10006, msg)

  })


  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

const SocketContextProvider = () => useContext(SocketContext)

export { SocketProvider, SocketContextProvider };
