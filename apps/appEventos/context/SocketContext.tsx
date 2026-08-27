import { createContext, FC, useState, useEffect, useContext, useRef, SetStateAction } from "react";
import type { Socket } from "socket.io-client";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from ".";
import { api } from '../api';
import { Dispatch } from 'react';
import { getCookie } from '../utils/Cookies';
import Cookies from "js-cookie";
import { setCrossAppIdToken, startSessionRefresh } from "@bodasdehoy/shared/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { parseJwt } from "../utils/Authentication"
import { Notification, ResultNotifications } from "../utils/Interfaces";
import { getAuth, onIdTokenChanged } from "firebase/auth";

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
  const lastTokenRef = useRef<string | null>(null)

  useEffect(() => {
    const token = Cookies.get("idTokenV0.1.0")
    const development = config?.development
    const father = searchParams?.get("father")
    if (!development) return
    // api.socketIO ahora es async (carga diferida de socket.io-client). El flag evita
    // montar un socket huérfano si el efecto se re-ejecuta antes de que resuelva.
    let cancelled = false
    if ((token && !socket?.connected) || (user?.displayName === "anonymous" && !socket?.connected)) {
      lastTokenRef.current = token ?? null
      api.socketIO({
        token,
        development,
        father,
        origin: window?.origin
      }).then((s) => {
        if (cancelled) { s?.disconnect(); return }
        setSocket(s ?? null)
      }).catch((err) => {
        // El import dinámico puede fallar (ChunkLoadError tras un deploy, red caída). Sin
        // esto sería un unhandled rejection y el realtime se quedaría muerto en silencio:
        // ni notificaciones ni refresco de evento, sin ningún rastro en consola.
        console.error("[SocketProvider] no se pudo cargar socket.io-client:", err)
      })
    }
    if (!token && socket) {
      socket.disconnect();
    }
    return () => { cancelled = true }
  }, [user, config?.development, searchParams])

  // Reconectar socket cuando Firebase rota el token (~1h)
  useEffect(() => {
    try {
      const auth = getAuth()
      const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (!firebaseUser || !config?.development) return
        const newToken = await firebaseUser.getIdToken()
        if (newToken && newToken !== lastTokenRef.current) {
          lastTokenRef.current = newToken
          setCrossAppIdToken(newToken)
          if (socket) {
            socket.disconnect()
            try {
              const reconnected = await api.socketIO({
                token: newToken,
                development: config.development,
                father: searchParams?.get("father"),
                origin: window?.origin
              })
              setSocket(reconnected ?? null)
            } catch (err) {
              // Si falla aquí el socket queda desconectado tras la rotación de token (~1h).
              // Dejar rastro: si no, el realtime muere a la hora de sesión sin explicación.
              console.error("[SocketProvider] reconexión tras rotar token falló:", err)
            }
          }
        }
      })
      return () => unsubscribe()
    } catch (e) {
      // Firebase no inicializado (SSR o anonymous)
    }
  }, [socket, config?.development])

  // Refresco CENTRAL y PROACTIVO del token (SessionManager compartido). El efecto de
  // arriba solo reacciona a la rotación natural del SDK (~1h) y reconecta el socket;
  // startSessionRefresh añade además un timer que fuerza getIdToken(true) ~10 min antes
  // de expirar → mantiene viva la cookie SSO cross-app aunque la pestaña esté en background
  // (raíz de la incidencia 17-19jul). Es el MISMO primitivo que usa chat-ia → un único
  // mecanismo de refresco en las 4 apps. No-op si no hay sesión.
  useEffect(() => {
    if (!config?.development) return
    try {
      const stop = startSessionRefresh(getAuth() as any)
      return () => stop()
    } catch (e) {
      // Firebase no inicializado (SSR/anonymous)
    }
  }, [config?.development])

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


  useEffect(() => {
    if (!socket) return
    if (!user?.uid) return

    const emitJoinUserRoom = () => {
      socket.emit(`app:message`, {
        event: null,
        emit: user.uid,
        receiver: null,
        type: "joinRoom",
        payload: {
          action: "add",
          value: `user:${user.uid}`
        }
      })
    }

    if (socket.connected) {
      emitJoinUserRoom()
    } else {
      socket.once("connect", emitJoinUserRoom)
      return () => { socket.off("connect", emitJoinUserRoom) }
    }
  }, [socket, user?.uid])


  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

const SocketContextProvider = () => useContext(SocketContext)

export { SocketProvider, SocketContextProvider };
