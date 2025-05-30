import { ComponentType, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener"
import { RiNotification2Fill } from "react-icons/ri";
import { MisEventosIcon, TarjetaIcon } from "./icons";
import { fetchApiBodas, queries } from "../utils/Fetching";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider } from "../context";
import { Notification, ResultNotifications } from "../utils/Interfaces";
import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Interweave, Node } from "interweave";
import { HashtagMatcher, Link, Url, UrlMatcher, UrlProps } from "interweave-autolink";
import { useTranslation } from "react-i18next";
import { ImageAvatar } from "./Utils/ImageAvatar";
import { useRouter } from "next/router";

export const Notifications = () => {
  const { t } = useTranslation()
  const { event } = EventContextProvider()
  const { eventsGroup } = EventsGroupContextProvider();
  const { user, config } = AuthContextProvider()
  const { notifications, setNotifications } = SocketContextProvider()
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMounted, setIsMounted] = useState(false)
  // const [notifications, setNotifications] = useState<ResultNotifications>();
  const [countScroll, setCountScroll] = useState({ count: 1 })
  const [showLoad, setShowLoad] = useState<boolean>(false);
  const router = useRouter()
  const detallesUsuarioIds = eventsGroup?.flatMap(event => [...event.detalles_compartidos_array, event.detalles_usuario_id])?.filter(id => id !== undefined);

  let skip = 0
  const handleScroll = (e) => {
    const zoomFactor = window.devicePixelRatio;
    const scrollHeight = e.target.scrollHeight / zoomFactor;
    const offsetHeight = e.target.offsetHeight / zoomFactor;
    const scrollTop = e.target.scrollTop / zoomFactor;
    if (scrollTop + offsetHeight >= scrollHeight - 5 && notifications.results.length < notifications.total && skip !== 8 * countScroll.count) {
      skip = (8 * countScroll.count)
      setShowLoad(true)
      fetchApiBodas({
        query: queries.getNotifications,
        variables: { args: { uid: user.uid }, sort: { createdAt: -1 }, skip: 8 * countScroll.count, limit: 8 },
        development: config?.development
      }).then((result: ResultNotifications) => {
        countScroll.count++
        setCountScroll({ ...countScroll })
        notifications.total = result.total
        notifications.results = [...notifications.results, ...result.results]
        setShowLoad(false)
        setNotifications({ ...notifications })
      })
    }
  };

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    if (showNotifications) {
      const d = document.getElementById("ul-notifications")
      d?.addEventListener("scroll", handleScroll, { passive: true });
    }
  }, [showNotifications]);

  useEffect(() => {
    if (user?.uid) {
      fetchApiBodas({
        query: queries.getNotifications,
        variables: { args: { uid: user?.uid }, sort: { createdAt: -1 }, skip: 0, limit: 8 },
        development: config?.development
      }).then((result: ResultNotifications) => {
        setNotifications(result)
      })
    }
  }, [isMounted])

  useEffect(() => {
    if (showNotifications && notifications?.results[0]?.state === "sent") {
      const notificationsReduce = notifications?.results.reduce((acc, item) => {
        if (item.state === "sent") {
          acc.ids.push(item._id)
          acc.results.push({ ...item, state: "received" })
          return acc
        }
        acc.results.push(item)
        return acc
      }, { results: [], ids: [] })
      if (notificationsReduce?.ids?.length) {
        fetchApiBodas({
          query: queries.updateNotifications,
          variables: { args: { _id: notificationsReduce.ids, state: "received" } },
          development: config?.development
        }).then((result: ResultNotifications) => {
          if (result) {
            notifications.results = notificationsReduce.results
            setNotifications({ ...notifications })
          }
        })
      }
    }
  }, [showNotifications])

  const handleFalseShowNotifications = () => {
    setShowNotifications(false)
    const notificationsReduce = notifications?.results.reduce((acc, item) => {
      if (item.state === "received") {
        acc.ids.push(item._id)
        acc.results.push({ ...item, state: "read" })
        return acc
      }
      acc.results.push(item)
      return acc
    }, { results: [], ids: [] })
    if (notificationsReduce?.ids?.length) {
      fetchApiBodas({
        query: queries.updateNotifications,
        variables: { args: { _id: notificationsReduce.ids, state: "read" } },
        development: config?.development
      }).then((result: ResultNotifications) => {
        if (result) {
          notifications.results = notificationsReduce.results
          setNotifications({ ...notifications })
        }
      })
    }
  }

  const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <Link href={props?.url}>
        <span className="text-xs break-all underline" >{props?.children}</span>
      </Link>
    )
  };


  return (
    <ClickAwayListener onClickAway={() => { handleFalseShowNotifications() }}>
      <div onClick={() => { !showNotifications ? setShowNotifications(true) : handleFalseShowNotifications() }} className="bg-white items-center flex relative cursor-default">
        <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200 cursor-pointer" >
          <RiNotification2Fill className="text-primary w-6 h-6 scale-x-90" />
          {notifications?.results[0]?.state === "sent" && <div className={`absolute w-2.5 h-2.5 rounded-full bg-green translate-x-2.5 translate-y-1.5`} />}
        </div>
        {showNotifications && (
          <div className="absolute bg-white rounded-lg w-80 h-max shadow-lg shadow-gray-400 top-0 right-10 translate-x-1/2 translate-y-[46px] overflow-hidden z-40 title-display">
            <div className="w-full pb-2 flex justify-center text-gray-600 border-[1px] border-b-2 rounded-lg rounded-b-none  border-gray-300 py-2 text-sm">
              {t("Mis notificaciones")}
            </div>
            <ul id="ul-notifications" className="bg-white flex flex-col text-xs place-items-left text-black max-h-[365px] overflow-y-scroll break-words">
              {notifications?.results?.map((item: Notification, idx: number) => {
                if (item.fromUid != null) {
                  const eventID = item?.focused?.split("event=")[1]?.split("&")[0]
                  const itineraryID = item?.focused?.split("itinerary=")[1]?.split("&")[0];
                  const taskID = item?.focused?.split("task=")[1]?.split("&")[0];
                  const eventExist = eventsGroup.find(event => event._id === eventID)
                  const itineraryExist = eventExist?.itinerarios_array?.find(itinerary => itinerary._id === itineraryID)
                  const taskExist = itineraryExist?.tasks?.find(task => task._id === taskID)
                  const path = item?.focused?.split("/").pop()?.split("?")[0].slice(0, -1);

                  return (
                    <li key={idx} onClick={() => {
                      if (item?.focused) {
                        if (eventExist) {
                          router.push(`${window.location.origin}${item.focused}`)
                        }
                      }
                    }} className={`flex w-full ${item?.focused && "cursor-pointer"}`}>
                      <div className="w-full hover:bg-base text-gray-700 flex py-2 ml-2">
                        <div className="bg-white text-gray-500 w-7 h-7 rounded-full border-gray-200 border-[1px] flex justify-center items-center -translate-y-1 mx-1">
                          {(!item?.type || item?.type === "event") && <MisEventosIcon className="w-5 h-5" />}
                          {(item?.type === "shop") && <TarjetaIcon className="w-5 h-5" />}
                          {(item?.type === "user") && <div className="w-5 h-5">
                            <ImageAvatar user={detallesUsuarioIds.find(elem => elem?.uid === item?.fromUid)} disabledTooltip />
                          </div>}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <Interweave
                            className="text-xs break-words w-[248px]"
                            content={
                              item?.type === "user"
                                ? `${detallesUsuarioIds.find(elem => elem?.uid === item?.fromUid)?.displayName} ${item?.message}`
                                : item?.message
                            }
                          />
                          {
                            !eventExist &&
                            <span className="capitalize bg-red w-max text-white rounded-md px-0.5 text-center">
                              evento eliminado
                            </span>
                          }{
                            eventExist && !itineraryExist &&
                            <span className="capitalize bg-red w-max text-white rounded-md px-0.5 text-center">
                              {path} eliminada
                            </span>
                          }{
                            eventExist && itineraryExist && !taskExist &&
                            <span className="capitalize bg-red w-max text-white rounded-md px-0.5 text-center">
                              Tarjeta eliminada
                            </span>
                          }
                          <span className="text-[10px] flex-1 text-right italic">
                            Hace {formatDistanceStrict(
                              new Date(item.createdAt),
                              new Date(),
                              { locale: es }
                            )}
                          </span>
                        </div>
                        <div className="w-4 flex items-center justify-center">
                          {item?.state !== "read" && <div className={`w-2.5 h-2.5 rounded-full bg-green`} />}
                        </div>
                      </div>
                    </li>
                  )
                }
              })}
              < li className="flex items-center justify-center">
                <span className="text-xs first-letter:capitalize">{
                  notifications?.results?.length === notifications?.total
                    ? notifications?.results?.length ? t("no hay más notificaciones") : t("no hay notificaciones")
                    : !showLoad ? t("burcar más") : t("cargando")
                }</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </ClickAwayListener>
  )
}