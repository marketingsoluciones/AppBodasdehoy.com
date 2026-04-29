import { createContext, FC, useState, useEffect, useContext, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from ".";
import { api } from '../api';
import { Dispatch } from 'react';
import { getCookie } from '../utils/Cookies';
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { parseJwt } from "../utils/Authentication"
import { Notification, ResultNotifications } from "../utils/Interfaces";

type Context = {
  socket: Socket | null;
  notifications: ResultNotifications
  setNotifications: Dispatch<SetStateAction<ResultNotifications>>
  //setSocket : Dispatch<SetStateAction<Socket | null>>
};

const initialContext: Context = {
  socket: null,
  notifications: null,
  setNotifications: () => { }
  //setSocket : () => {}
};

const SocketContext = createContext<Context>(initialContext);

const SocketProvider: FC<any> = ({ children }): React.ReactElement => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, config } = AuthContextProvider()
  const [socket, setSocket] = useState<Socket | null>(initialContext.socket);
  const [notifications, setNotifications] = useState<ResultNotifications>({ total: 0, results: [] });

  useEffect(() => {
    console.log("=======> User", user)
    const token = Cookies.get("idTokenV0.1.0")
    console.log("=======> parseJwt", parseJwt(token))
    console.log("=======> development", config?.development)
    const development = config?.development
    const father = searchParams?.get("father")
    if (!development) return
    if ((token && !socket?.connected) || (user?.displayName === "anonymous" && !socket?.connected)) {
      console.log("=======> Conecta...")
      setSocket(api.socketIO({
        token,
        development,
        father,
        origin: window?.origin
      }))
    }
    if (!token && socket) {
      console.log("=======> desconecta...")
      socket.disconnect();
    }

  }, [user, config?.development, searchParams])

  useEffect(() => {
    if (!socket) return
    const onConnect = () => {
      console.log(1445411144, socket)
      console.log(1.0000391, "Conectado", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }))
    }
    const onDisconnect = (reason) => {
      console.log(1.0000301, "Desconectado", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        reason)
    }
    const onConnectError = (error) => {
      console.log(1.0000302, "Connect_error", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        error)
    }
    const onManagerError = () => {
      console.log(1.0000392, "error", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }))
    }
    const onPing = () => {
      console.log(1.0000393, "ping", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }))
    }
    const onReconnect = (attempt) => {
      console.log(1.0000303, "reconnect", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        attempt)
    }
    const onReconnectAttempt = (attempt) => {
      console.log(1.0000304, "reconnect_attempt", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        attempt)
    }
    const onReconnectError = (error) => {
      console.log(1.0000305, "reconnect_attempt", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }),
        error)
    }
    const onReconnectFailed = () => {
      console.log(1.0000306, "reconnect_failed", new Date().toLocaleString('es-VE', { timeZone: 'america/Caracas' }))
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onConnectError)
    socket.io.on("error", onManagerError)
    socket.io.on("ping", onPing)
    socket.io.on("reconnect", onReconnect)
    socket.io.on("reconnect_attempt", onReconnectAttempt)
    socket.io.on("reconnect_error", onReconnectError)
    socket.io.on("reconnect_failed", onReconnectFailed)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("connect_error", onConnectError)
      socket.io.off("error", onManagerError)
      socket.io.off("ping", onPing)
      socket.io.off("reconnect", onReconnect)
      socket.io.off("reconnect_attempt", onReconnectAttempt)
      socket.io.off("reconnect_error", onReconnectError)
      socket.io.off("reconnect_failed", onReconnectFailed)
    }

  }, [socket])



  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

const SocketContextProvider = () => useContext(SocketContext)

export { SocketProvider, SocketContextProvider };
