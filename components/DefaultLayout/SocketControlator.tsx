import { useEffect, useState } from "react"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider, } from "../../context"
import { useRouter } from "next/router";
import { handleClickCard } from "../Home/Card";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { detalle_compartidos_array, Event } from "../../utils/Interfaces";

export const SocketControlator = () => {
  const { t } = useTranslation();
  const { user, setUser, config } = AuthContextProvider()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive } = EventContextProvider()
  const { socket, notifications, setNotifications } = SocketContextProvider()
  const [isMounted, setIsMounted] = useState<any>(false)
  const { eventsGroup } = EventsGroupContextProvider()
  const [valirRemoteEvent, setValirRemoteEvent] = useState(false)
  const [valirRemotePlanSpaceActive, setValirRemotePlanSpaceActive] = useState(false)
  const [reconet, setReconet] = useState(null)
  const [received, setReceived] = useState({ channel: "", msg: null, d: null })
  const router = useRouter()

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
    if (received.channel === "app:message") {
      if (received?.msg?.payload?.action === "setEvent") {
        const eventOld = {
          planSpaceSelect: event?.planSpaceSelect,
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
        setPlanSpaceActive(received?.msg?.payload?.value)
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
  }, [received])

  useEffect(() => {
    socket?.on("cms:message", async (msg) => {
      setReceived({ channel: "cms:message", msg, d: new Date() })
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
    if (!valirRemoteEvent && !valirRemotePlanSpaceActive) {
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
      setValirRemoteEvent(false)
      setValirRemotePlanSpaceActive(false)
    }
  }, [event])

  useEffect(() => {
    if (!valirRemotePlanSpaceActive) {
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
  }, [planSpaceActive])


  return (
    <></>
  )
}