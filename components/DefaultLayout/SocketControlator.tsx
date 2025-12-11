import { useEffect, useState } from "react"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider, } from "../../context"
import { useRouter } from "next/router";
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
  let senderPlanSpaceActive = false
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
          let eventNew: Event = received.msg?.payload?.value
          let itinerary = eventNew.itinerarios_array.find(elem => elem._id === event.itinerarios_array[0]._id)
          const task = itinerary?.tasks?.find(elem => elem._id === event.itinerarios_array[0].tasks[0]._id)

          // falta esto

          // const users = await fetchApiBodas({
          //   query: queries?.getUsers,
          //   variables: { uids: task.comments.filter(elem => !!elem.uid).map(elem => elem.uid) },
          //   development: getDevelopment(req.headers.host)
          // })
          // const usersMap = users.map(elem => {
          //   return {
          //     uid: elem.uid,
          //     displayName: elem?.displayName,
          //     photoURL: elem.photoURL
          //   }
          // })
          itinerary.tasks = [task]
          event.itinerarios_array = [itinerary]
          event.fecha_actualizacion = new Date().toLocaleString()

          // eventNew.detalles_compartidos_array = users
          setEvent({ ...event })
        }
      }
    }
    if (user?.displayName !== "anonymous") {
      if (received.channel === "app:message") {
        // console.log(100020, "RECEIVED event")
        if (received?.msg?.payload?.action === "setEvent") {
          const eventOld = {
            galerySvgs: event?.galerySvgs,
            updatedAt: new Date()
          }
          let eventNew: Event = received.msg?.payload?.value
          eventNew.fecha = new Date(eventNew.fecha).getTime().toString()
          if (eventNew?.compartido_array?.length) {
            const fMyUid = eventNew?.compartido_array?.findIndex(elem => elem === user?.uid)
            if (fMyUid > -1) {
              eventNew.permissions = [...eventNew.detalles_compartidos_array[fMyUid].permissions]
              eventNew.compartido_array.splice(fMyUid, 1)
              eventNew.detalles_compartidos_array?.splice(fMyUid, 1)
            }
            fetchApiBodas({
              query: queries?.getUsers,
              variables: { uids: user?.uid === eventNew?.usuario_id ? eventNew?.compartido_array : [...eventNew?.compartido_array, eventNew?.usuario_id] },
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
            setEvent({ ...eventNew, ...eventOld })
          }
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
        notifications.total = notifications.total + 1
        notifications.results.unshift(received.msg)
        setNotifications({ ...notifications })
      }
    }
  }, [received])

  useEffect(() => {

    socket?.on("connect", () => {
      setReconet(new Date())
    })
    socket?.on("app:message", async (msg) => {
      setReceived({ channel: "app:message", msg, d: new Date() })
    })
    socket?.on("notification", async (msg) => {
      setReceived({ channel: "notification", msg, d: new Date() })
    })
    socket?.io.on("reconnect_attempt", (attempt) => {
      setReconet(new Date())
    })
  }, [socket])

  useEffect(() => {
    socket?.emit(`app:message`, {
      event: null,
      emit: user?.uid,
      receiver: null,
      type: "joinRoom",
      payload: {
        action: "add",
        value: event?._id
      }
    })
    // }
  }, [event?._id, reconet])

  useEffect(() => {
    if (!valirRemotePlanSpaceActive) {
      // console.log(100010, "EMIT planSpaceActive")
      senderPlanSpaceActive = true
      socket?.emit(countPlanSpaceActive > 2 ? `app:message` : `undefined`, {
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
    if (!valirRemoteEvent && !valirRemotePlanSpaceActive && !senderPlanSpaceActive) {
      // console.log(100010, "EMIT event")
      socket?.emit(countEvent > 2 ? `app:message` : `undefined`, {
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
      if (senderPlanSpaceActive) {
        senderPlanSpaceActive = false
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