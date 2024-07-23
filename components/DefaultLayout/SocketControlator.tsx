import { useEffect, useState } from "react"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider, } from "../../context"
import { useRouter } from "next/router";
import { handleClickCard } from "../Home/Card";
import { useToast } from "../../hooks/useToast";

export const SocketControlator = () => {
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
  const toast = useToast()

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    //console.log("valirRemoteEvent", valirRemoteEvent)
  }, [valirRemoteEvent])

  useEffect(() => {
    //console.log("valirRemotePlanSpaceActive", valirRemotePlanSpaceActive)
  }, [valirRemotePlanSpaceActive])

  useEffect(() => {
    setValirRemoteEvent(true)
    setValirRemotePlanSpaceActive(true)
    if (received.channel === "app:message") {
      //console.log(8745000, received.msg)
      if (received?.msg?.payload?.action === "setEvent") {
        const eventOld = {
          compartido_array: event?.compartido_array,
          detalles_compartidos_array: event?.detalles_compartidos_array,
          detalles_usuario_id: event?.detalles_usuario_id,
          permissions: event?.permissions,
          planSpaceSelect: event?.planSpaceSelect,
          updatedAt: new Date()
        }
        const eventNew = { ...received.msg?.payload?.value, ...eventOld }
        setEvent({ ...eventNew })
      }
      if (received?.msg?.payload?.action === "setPlanSpaceActive") {
        setPlanSpaceActive(received?.msg?.payload?.value)
      }
    }
    if (received.channel === "cms:message") {

      if (received?.msg?.payload?.action === "clickCard") {
        const data = eventsGroup.find(elem => elem._id === received?.msg?.payload?.value)
        handleClickCard({ final: true, config, data, setEvent, user, setUser, router })
      }
      if (received?.msg?.payload?.action === "setRoute") {
        router.push(`${received?.msg?.payload?.value}`)
      }
      if (received?.msg?.payload?.action === "setEventId") {
        setValirRemoteEvent(true)
      }
    }
    if (received.channel === "notification") {
      //console.log(8745001, received.msg)
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
      //console.log("------------------------////*******----->")
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
      setValirRemotePlanSpaceActive(false)
    }
  }, [planSpaceActive])


  return (
    <></>
  )
}