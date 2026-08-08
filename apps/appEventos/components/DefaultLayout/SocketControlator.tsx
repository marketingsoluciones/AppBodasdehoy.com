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
  const setEventEmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
                variables: { ids: commentUids, development: config?.development || 'bodasdehoy' },
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
                variables: { ids: uidsToFetch, development: config?.development || 'bodasdehoy' },
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
                  variables: { ids: [eventNew.usuario_id], development: config?.development || 'bodasdehoy' },
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
          // Inmutable: reemplazo el planSpace concreto sin mutar el array original.
          // El socket llega en cualquier momento → usar updater functional evita
          // race conditions con otros setEvent en paralelo.
          const newPlanSpace = received?.msg?.payload?.value
          setEvent((prev: any) => {
            if (!Array.isArray(prev?.planSpace)) return prev
            const idx = prev.planSpace.findIndex((elem: any) => elem._id === newPlanSpace?._id)
            if (idx < 0) return prev
            const next = [...prev.planSpace]
            next[idx] = newPlanSpace
            return { ...prev, planSpace: next }
          })
        }
        if (received?.msg?.payload?.action === "setStatusComunicacion") {
          // Inmutable: reconstruyo invitados_array → comunicaciones_array → statuses
          // sin mutar el original. El socket llega async y otros setEvent corren en
          // paralelo; mutar directamente provoca race conditions con realtime.
          const newStatus = {
            name: received?.msg?.payload?.value?.status,
            timestamp: new Date(received?.msg?.payload?.value?.timestamp).toISOString()
          }
          const invitadoId = received?.msg?.payload?.value?.invitado_id
          const messageId = received?.msg?.payload?.value?.message_id

          setEvent((prev: any) => {
            const invArr = prev?.invitados_array
            if (!Array.isArray(invArr)) return prev
            const f1 = invArr.findIndex((elem: any) => elem._id === invitadoId)
            if (f1 < 0) return prev
            const comArr = invArr[f1]?.comunicaciones_array
            if (!Array.isArray(comArr)) return prev
            const f2 = comArr.findIndex((elem: any) => elem.message_id === messageId)
            if (f2 < 0) return prev

            const comunicacion = comArr[f2]
            const exactDuplicate = comunicacion?.statuses?.some(
              (s: any) => s.name === newStatus.name && s.timestamp === newStatus.timestamp
            )
            if (exactDuplicate) return prev

            // Limpiar duplicados: mantener solo el más reciente por name.
            const statusMap = new Map<string, { name: string; timestamp: string }>()
            const allStatuses = [...(comunicacion.statuses ?? []), newStatus]
            allStatuses.forEach((s: any) => {
              const existing = statusMap.get(s.name)
              if (!existing || new Date(s.timestamp) > new Date(existing.timestamp)) {
                statusMap.set(s.name, s)
              }
            })

            const nextStatuses = Array.from(statusMap.values())
            const nextCom = [...comArr]
            nextCom[f2] = { ...comunicacion, statuses: nextStatuses }
            const nextInv = [...invArr]
            nextInv[f1] = { ...invArr[f1], comunicaciones_array: nextCom }
            return { ...prev, invitados_array: nextInv }
          })
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
      const eventId = event?._id
      if (!eventId || !socket) {
        countEvent < 5 && setCountEvent(countEvent + 1)
        return
      }
      // Debounce: ráfagas de setEvent (p. ej. init itinerario) colapsan a 1 emit.
      if (setEventEmitTimerRef.current) clearTimeout(setEventEmitTimerRef.current)
      setEventEmitTimerRef.current = setTimeout(() => {
        socket.emit(`app:message`, {
          event: eventId,
          emit: user?.uid,
          receiver: eventId,
          type: "event",
          payload: {
            action: "setEvent",
            value: eventId
          }
        })
      }, 400)
    } else {
      if (senderPlanSpaceActiveRef.current) {
        senderPlanSpaceActiveRef.current = false
      }
      setValirRemoteEvent(false)
      setValirRemotePlanSpaceActive(false)
    }
    countEvent < 5 && setCountEvent(countEvent + 1)
    return () => {
      if (setEventEmitTimerRef.current) {
        clearTimeout(setEventEmitTimerRef.current)
        setEventEmitTimerRef.current = null
      }
    }
  }, [event])




  return (
    <></>
  )
}
