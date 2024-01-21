import { useEffect, useState } from "react"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider, } from "../../context"

export const SocketControlator = () => {
  const { user } = AuthContextProvider()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive } = EventContextProvider()
  const { socket } = SocketContextProvider()
  const [isMounted, setIsMounted] = useState<any>(false)
  const { eventsGroup } = EventsGroupContextProvider()
  const [valirRemoteEvent, setValirRemoteEvent] = useState(false)
  const [valirRemotePlanSpaceActive, setValirRemotePlanSpaceActive] = useState(false)
  const [reconet, setReconet] = useState(null)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    console.log("valirRemoteEvent", valirRemoteEvent)
  }, [valirRemoteEvent])

  useEffect(() => {
    console.log("valirRemotePlanSpaceActive", valirRemotePlanSpaceActive)
  }, [valirRemotePlanSpaceActive])

  useEffect(() => {
    socket?.on("cms:message", async (msg) => {
      if (msg?.context === "event") {
        setEvent(eventsGroup.find(elem => elem._id === msg?.eventID))
      }
    })


    socket?.on("app:message", async (msg) => {
      if (msg?.payload?.action === "setEvent") {
        setValirRemoteEvent(true)
        setEvent(msg?.payload?.value)
      }
      if (msg?.payload?.action === "setPlanSpaceActive") {
        setValirRemotePlanSpaceActive(true)
        setPlanSpaceActive(msg?.payload?.value)
      }
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
      console.log("------------------------////*******----->")
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