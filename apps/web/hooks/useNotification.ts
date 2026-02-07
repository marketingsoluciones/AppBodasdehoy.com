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
      result?.total === 1 && toast("success", t(`Notificación enviada`))
      result?.total > 1 && toast("success", t(`Notificaciones enviadas`))
    })
  };

  return notification;
};
