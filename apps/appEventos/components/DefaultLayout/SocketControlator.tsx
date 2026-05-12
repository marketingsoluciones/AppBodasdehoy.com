import { useEffect, useRef, useState } from "react"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider, } from "../../context"
import { useRouter } from "next/navigation";
import { handleClickCard } from "../Home/Card";
import { useTranslation } from 'react-i18next';
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { detalle_compartidos_array, Event } from "../../utils/Interfaces";

export const SocketControlator = () => {
  const { t } = useTranslation();
  const { user, setUser, config } = AuthContextProvider()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, planSpaceSelect } = EventContextProvider()
  const { socket, notifications, setNotifications } = SocketContextProvider()
  const [isMounted, setIsMounted] = useState<any>(false)
  const { eventsGroup } = EventsGroupContextProvider()
  const [valirRemoteEvent, setValirRemoteEvent] = useState(false)
  const [valirRemotePlanSpaceActive, setValirRemotePlanSpaceActive] = useState(false)
  const [reconet, setReconet] = useState(null)
  const [received, setReceived] = useState({ channel: "", msg: null, d: null })
  const router = useRouter()
  const senderPlanSpaceActiveRef = useRef(false)
  const [countEvent, setCountEvent] = useState(0)
  const [countPlanSpaceActive, setCountPlanSpaceActive] = useState(0)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    setValirRemoteEvent(true)
    setValirRemotePlanSpaceActive(true)
    if (user?.displayName === "anonymous") {
      if (received.channel === "app:message") {
        if (received?.msg?.payload?.action === "setEvent") {
          const rawAnon = received.msg?.payload?.value
          const applyAnonEvent = (eventNewInput: any) => {
            if (!eventNewInput || typeof eventNewInput !== 'object') return
            if (!event?.itinerarios_array?.length || !event?.itinerarios_array?.[0]?.tasks?.length) return
            let eventNew: Event = eventNewInput
            let itinerary = eventNew.itinerarios_array?.find((elem: any) => elem._id === event.itinerarios_array[0]._id)
            const task = itinerary?.tasks?.find((elem: any) => elem._id === event.itinerarios_array[0].tasks[0]._id)
            if (!itinerary || !task) return

            const commentUids = (task?.comments || [])
              .filter((c: any) => !!c.uid)
              .map((c: any) => c.uid)

            itinerary.tasks = [task]
            eventNew.itinerarios_array = [itinerary]
            eventNew.fecha_actualizacion = new Date().toLocaleString()

            if (commentUids.length > 0) {
              fetchApiBodas({
                query: queries?.getUsers,
                variables: { uids: commentUids },
                development: config?.development,
              }).then((results) => {
                if (results?.length) {
                  eventNew.detalles_compartidos_array = results.map((u: detalle_compartidos_array) => ({
                    uid: u.uid,
                    displayName: u.displayName,
                    photoURL: u.photoURL,
                  }))
                }
                setEvent({ ...eventNew })
              }).catch(() => {
                setEvent({ ...eventNew })
              })
            } else {
              setEvent({ ...eventNew })
            }
          }

          if (typeof rawAnon === 'string') {
            fetchApiBodas({
              query: queries?.getEventsByID,
              variables: { variable: "_id", valor: rawAnon, development: config?.development },
              development: config?.development,
            }).then((res) => {
              const eventFetched = Array.isArray(res) ? res?.[0] : res
              applyAnonEvent(eventFetched)
            })
            return
          }

          applyAnonEvent(rawAnon)
        }
      }
    }
    if (user?.displayName !== "anonymous") {
      if (received.channel === "app:message") {
        // console.log(100020, "RECEIVED event")
        if (received?.msg?.payload?.action === "setEvent") {
          const rawValue = received.msg?.payload?.value
          if (!rawValue) return
          const eventOld = {
            galerySvgs: event?.galerySvgs,
            updatedAt: new Date()
          }
          const applyEvent = (eventNewInput: any) => {
            if (!eventNewInput || typeof eventNewInput !== 'object') return
            let eventNew: Event = eventNewInput
            eventNew.fecha = new Date(eventNew.fecha).getTime().toString()
            if (user?.uid === eventNew?.usuario_id && user) {
              eventNew.detalles_usuario_id = {
                ...eventNew.detalles_usuario_id,
                uid: user.uid,
                displayName: user.displayName || eventNew.detalles_usuario_id?.displayName,
                photoURL: user.photoURL || eventNew.detalles_usuario_id?.photoURL,
                email: user.email || eventNew.detalles_usuario_id?.email,
              }
            }
            if (eventNew?.detalles_compartidos_array?.length > 0) {
              const myDetail = eventNew.detalles_compartidos_array.find((d: any) => d.uid === user?.uid)
              if (myDetail?.permissions) {
                eventNew.permissions = [...myDetail.permissions]
                eventNew.compartido_array = (eventNew.compartido_array || []).filter(uid => uid !== user?.uid)
                eventNew.detalles_compartidos_array = eventNew.detalles_compartidos_array?.filter(d => d.uid !== user?.uid) ?? []
              }
              const uidsToFetch = user?.uid === eventNew?.usuario_id
                ? eventNew?.compartido_array
                : [...eventNew?.compartido_array, eventNew?.usuario_id]
              fetchApiBodas({
                query: queries?.getUsers,
                variables: { uids: uidsToFetch },
                development: config?.development
              }).then((results) => {
                results?.map((result: detalle_compartidos_array) => {
                  const f1 = eventNew.detalles_compartidos_array?.findIndex(elem => elem.uid === result.uid);
                  if (f1 > -1) {
                    eventNew.detalles_compartidos_array?.splice(f1, 1, { ...eventNew.detalles_compartidos_array[f1], ...result });
                  }
                  if (result.uid === eventNew?.usuario_id) {
                    eventNew.detalles_usuario_id = result
                  }
                })
                setEvent({ ...eventNew, ...eventOld })
              })
            } else {
              if (user?.uid !== eventNew?.usuario_id && eventNew?.usuario_id) {
                fetchApiBodas({
                  query: queries?.getUsers,
                  variables: { uids: [eventNew.usuario_id] },
                  development: config?.development
                }).then((results) => {
                  if (results?.[0]) {
                    eventNew.detalles_usuario_id = results[0]
                  }
                  setEvent({ ...eventNew, ...eventOld })
                })
              } else {
                setEvent({ ...eventNew, ...eventOld })
              }
            }
          }

          if (typeof rawValue === 'string') {
            fetchApiBodas({
              query: queries?.getEventsByID,
              variables: { variable: "_id", valor: rawValue, development: config?.development },
              development: config?.development
            }).then((res) => {
              const eventFetched = Array.isArray(res) ? res?.[0] : res
              applyEvent(eventFetched)
            })
            return
          }

          applyEvent(rawValue)
        }
        if (received?.msg?.payload?.action === "setPlanSpaceActive") {
          // console.log(100020, "RECEIVED planSpaceActive", received?.msg?.payload?.value, event?.planSpace)
          if (received?.msg?.payload?.value?._id === planSpaceSelect) {
            setPlanSpaceActive(received?.msg?.payload?.value)
          }
          const f1 = event?.planSpace?.findIndex(elem => elem._id === received?.msg?.payload?.value?._id)
          event?.planSpace?.splice(f1, 1, received?.msg?.payload?.value)
          setEvent({ ...event })
          // setPlanSpaceActive(received?.msg?.payload?.value)
        }
        if (received?.msg?.payload?.action === "setStatusComunicacion") {
          const f1 = event?.invitados_array?.findIndex(elem => elem._id === received?.msg?.payload?.value?.invitado_id)
          const f2 = event?.invitados_array[f1]?.comunicaciones_array?.findIndex(elem => elem.message_id
            === received?.msg?.payload?.value?.message_id)
          
          if (f1 > -1 && f2 > -1) {
            const comunicacion = event?.invitados_array[f1]?.comunicaciones_array[f2]
            const newStatus = {
              name: received?.msg?.payload?.value?.status,
              timestamp: new Date(received?.msg?.payload?.value?.timestamp).toISOString()
            }
            
            // Verificar si el status ya existe con el mismo name y timestamp (duplicado exacto)
            const exactDuplicate = comunicacion?.statuses?.some(
              (status: any) => 
                status.name === newStatus.name && 
                status.timestamp === newStatus.timestamp
            )
            
            // Si es un duplicado exacto, no hacer nada
            if (exactDuplicate) {
              return;
            }
            
            // Agregar el nuevo status al array (si no es duplicado exacto ya lo verificamos arriba)
            comunicacion.statuses.push(newStatus)
            
            // Limpiar duplicados del array completo: mantener solo la versión más reciente de cada status por name
            const statusMap = new Map<string, { name: string; timestamp: string }>()
            
            comunicacion.statuses.forEach((status: any) => {
              const existing = statusMap.get(status.name)
              if (!existing || new Date(status.timestamp) > new Date(existing.timestamp)) {
                statusMap.set(status.name, status)
              }
            })
            
            // Reemplazar el array completo con los statuses únicos y actualizados
            comunicacion.statuses = Array.from(statusMap.values())
            
            setEvent({ ...event })
          }
        }
      }
      if (received.channel === "cms:message") {

        if (received?.msg?.payload?.action === "clickCard") {
          const data = eventsGroup.find(elem => elem._id === received?.msg?.payload?.value)
          handleClickCard({ t, final: true, config, data, setEvent, user, setUser, router })
        }
        if (received?.msg?.payload?.action === "setRoute") {
          router.push(`${received?.msg?.payload?.value}`)
        }
        if (received?.msg?.payload?.action === "setEventId") {
          setValirRemoteEvent(true)
        }
      }
      if (received.channel === "notification") {
        setNotifications({
          ...notifications,
          total: notifications.total + 1,
          results: [received.msg, ...notifications.results]
        })
      }
    }
  }, [received])

  useEffect(() => {
    if (!socket) return
    const onConnect = () => setReconet(new Date())
    const onAppMessage = async (msg) => setReceived({ channel: "app:message", msg, d: new Date() })
    const onNotification = async (msg) => setReceived({ channel: "notification", msg, d: new Date() })
    const onCmsMessage = async (msg) => setReceived({ channel: "cms:message", msg, d: new Date() })
    const onReconnectAttempt = () => setReconet(new Date())

    socket.on("connect", onConnect)
    socket.on("app:message", onAppMessage)
    socket.on("notification", onNotification)
    socket.on("cms:message", onCmsMessage)
    socket.io.on("reconnect_attempt", onReconnectAttempt)

    return () => {
      socket.off("connect", onConnect)
      socket.off("app:message", onAppMessage)
      socket.off("notification", onNotification)
      socket.off("cms:message", onCmsMessage)
      socket.io.off("reconnect_attempt", onReconnectAttempt)
    }
  }, [socket])

  useEffect(() => {
    if (!socket) return
    if (!event?._id) return
    const emitJoinRoom = () => {
      socket.emit(`app:message`, {
        event: null,
        emit: user?.uid,
        receiver: null,
        type: "joinRoom",
        payload: {
          action: "add",
          value: event?._id
        }
      })
    }
    if (socket.connected) {
      emitJoinRoom()
    } else {
      socket.once("connect", emitJoinRoom)
      return () => { socket.off("connect", emitJoinRoom) }
    }
  }, [event?._id, reconet])

  useEffect(() => {
    if (!valirRemotePlanSpaceActive) {
      // console.log(100010, "EMIT planSpaceActive")
      senderPlanSpaceActiveRef.current = true
      socket?.emit(`app:message`, {
        event: event?._id,
        emit: user?.uid,
        receiver: event?._id,
        type: "planSpaceActive",
        payload: {
          action: "setPlanSpaceActive",
          value: planSpaceActive
        }
      })
    } else {
      setValirRemoteEvent(false)
      setValirRemotePlanSpaceActive(false)
    }
    countPlanSpaceActive < 5 && setCountPlanSpaceActive(countPlanSpaceActive + 1)
  }, [planSpaceActive])

  useEffect(() => {
    if (!valirRemoteEvent && !valirRemotePlanSpaceActive && !senderPlanSpaceActiveRef.current) {
      // console.log(100010, "EMIT event")
      socket?.emit(`app:message`, {
        event: event?._id,
        emit: user?.uid,
        receiver: event?._id,
        type: "event",
        payload: {
          action: "setEvent",
          value: event?._id
        }
      })
    } else {
      if (senderPlanSpaceActiveRef.current) {
        senderPlanSpaceActiveRef.current = false
      }
      setValirRemoteEvent(false)
      setValirRemotePlanSpaceActive(false)
    }
    countEvent < 5 && setCountEvent(countEvent + 1)
  }, [event])




  return (
    <></>
  )
}
