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
        father: router?.query?.father
      }))
    }
    if (!token && socket) {
      console.log("desconecta...")
      socket.disconnect();
    }
  }, [user])

  useEffect(() => {
    if (socket?.connect) {
      console.log(1004, socket?.connected)
      console.log(1005, socket?.id)
      socket?.emit(`app`, {
        emit: socket?.id,
        receiver: user?.uid,
        type: "",
        payload: {
          action: "",
          value: "nueva conexión"
        }
      });
    }
  }, [socket?.connected])

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
