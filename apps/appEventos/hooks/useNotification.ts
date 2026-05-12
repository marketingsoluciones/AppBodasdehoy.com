import { useTranslation } from "react-i18next";
import { AuthContextProvider, EventContextProvider } from "../context";
import { queries } from "../utils/Fetching";
import { useToast } from "./useToast";
import axios from "axios";
import Cookies from "js-cookie";

enum types {
  event, shop, guest, invitation, user
}

interface Notification {
  type: keyof typeof types
  message: string
  uids?: string[]
  focused?: string
}

/**
 * Hook para enviar notificaciones a otros usuarios.
 *
 * Usa una instancia de axios SIN el interceptor global de 401/403,
 * porque si el token Firebase expira justo al enviar la notificación,
 * el interceptor global dispara handleSessionExpired() y cierra la sesión
 * del usuario que acaba de comentar (logout silencioso).
 *
 * Las notificaciones son fire-and-forget: si fallan, no deben afectar
 * la sesión ni el flujo principal.
 */
const notifAxios = axios.create();

export const useNotification = () => {
  const { user, config } = AuthContextProvider()
  const { event } = EventContextProvider()
  const toast = useToast()
  const { t } = useTranslation()

  const notification = ({ message, uids, type, focused }: Notification) => {
    // El backend espera focused = evento_id (ObjectId de MongoDB).
    // Los callers pasan un path como "/servicios?event=XXX&task=YYY",
    // pero el resolver usa focused para buscar el evento en BD.
    // Usamos event._id del contexto; si no hay, intentamos extraer del path.
    const eventoId = event?._id || focused?.match(/event=([a-f0-9]{24})/)?.[1] || focused;

    const idToken = Cookies.get("idTokenV0.1.0");
    const development = config?.development || "bodasdehoy";
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const url = isLocalhost ? '/api/proxy-bodas/graphql' : (process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL || '/api/proxy-bodas/graphql');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Development: development,
    };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;

    notifAxios.post(url, {
      query: queries.createNotifications,
      variables: {
        args: {
          type,
          message,
          uids,
          ...(type === "user" && { fromUid: user?.uid }),
          focused: eventoId
        }
      }
    }, { headers }).then(res => {
      const result = res?.data?.data ? Object.values(res.data.data)[0] as any : null;
      if (!result || typeof result.total !== "number") {
        console.warn("[useNotification] respuesta inesperada de createNotifications:", result)
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
      // No disparar logout — las notificaciones no son críticas
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        console.warn("[useNotification] auth error en createNotifications (no logout):", status)
      } else {
        console.error("[useNotification] error createNotifications:", err)
      }
      toast("error", t(`No se pudo enviar la notificación`))
    })
  };

  return notification;
};
