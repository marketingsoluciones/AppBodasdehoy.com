import { ComponentType, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener"
import { RiNotification2Fill } from "react-icons/ri";
import { MisEventosIcon, TarjetaIcon } from "./icons";
import { fetchApiBodas, queries } from "../utils/Fetching";
import { AuthContextProvider, EventContextProvider, SocketContextProvider } from "../context";
import { Notification, ResultNotifications } from "../utils/Interfaces";
import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Interweave, Node } from "interweave";
import { HashtagMatcher, Link, Url, UrlMatcher, UrlProps } from "interweave-autolink";
import { useTranslation } from "react-i18next";
import { ImageAvatar } from "./Utils/ImageAvatar";

export const Notifications = () => {
  const { t } = useTranslation()
  const { event } = EventContextProvider()
  const { user, config } = AuthContextProvider()
  const { notifications, setNotifications } = SocketContextProvider()
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMounted, setIsMounted] = useState(false)
  // const [notifications, setNotifications] = useState<ResultNotifications>();
  const [countScroll, setCountScroll] = useState({ count: 1 })
  const [showLoad, setShowLoad] = useState<boolean>(false);

  const handleScroll = (e) => {
    if (e.target.scrollTop + e.target.offsetHeight === e.target.scrollHeight && notifications.results.length < notifications.total) {
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
              {notifications?.results?.map((item: Notification, idx: number) => (
                <li key={idx} className="flex w-full">
                  <div className="w-full hover:bg-base text-gray-700 flex py-2 ml-2">
                    <div className="bg-white text-gray-500 w-7 h-7 rounded-full border-gray-200 border-[1px] flex justify-center items-center -translate-y-1 mx-1">
                      {(!item?.type || item?.type === "event") && <MisEventosIcon className="w-5 h-5" />}
                      {(item?.type === "shop") && <TarjetaIcon className="w-5 h-5" />}
                      {(item?.type === "user") && <div className="w-5 h-5">
                        <ImageAvatar user={[...event?.detalles_compartidos_array, event?.detalles_usuario_id, user]?.find(elem => elem?.uid === item?.uid)} disabledTooltip />
                      </div>}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <Interweave
                        className="text-xs break-words"
                        content={
                          item?.type === "user"
                            ? `${[...event?.detalles_compartidos_array, event?.detalles_usuario_id, user]?.find(elem => elem?.uid === item?.uid).displayName} ${item?.message}`
                            : item?.message
                        }
                        matchers={[
                          new UrlMatcher('url', {}, replacesLink),
                          new HashtagMatcher('hashtag')
                        ]}
                      />
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
              ))}
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