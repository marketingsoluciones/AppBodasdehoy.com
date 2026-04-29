import { useTranslation } from "react-i18next";
import { AuthContextProvider, EventContextProvider } from "../context";
import { fetchApiBodas, queries } from "../utils/Fetching";
import { useToast } from "./useToast";

enum types {
  event, shop, guest, invitation, user
}

interface Notification {
  type: keyof typeof types
  message: string
  uids?: string[]
  focused?: string
}

export const useNotification = () => {
  const { user, config } = AuthContextProvider()
  const { event } = EventContextProvider()
  const toast = useToast()
  const { t } = useTranslation()


  const notification = ({ message, uids, type, focused }: Notification) => {
    fetchApiBodas({
      query: queries.createNotifications,
      variables: {
        args: {
          type,
          message,
          uids,
          ...(type === "user" && { fromUid: user?.uid }),
          focused
        }
      },
      development: config.development,
      type: "json"
    }).then(result => {
      if (!result || typeof result.total !== "number") {
        console.error("[useNotification] respuesta inválida de createNotifications:", result)
        toast("error", t(`No se pudo enviar la notificación`))
        return
      }
      if (result.total === 0) {
        toast("error", t(`No se pudo enviar la notificación`))
        return
      }
      if (result.total === 1) toast("success", t(`Notificación enviada`))
      else toast("success", t(`Notificaciones enviadas`))
    }).catch(err => {
      console.error("[useNotification] error createNotifications:", err)
      toast("error", t(`No se pudo enviar la notificación`))
    })
  };

  return notification;
};
