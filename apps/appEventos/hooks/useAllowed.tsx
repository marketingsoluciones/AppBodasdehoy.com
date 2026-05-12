import { useRouter, usePathname } from "next/navigation"
import { AuthContextProvider, EventContextProvider, LoadingContextProvider } from "../context"
import { useToast } from "./useToast";
import { useTranslation } from "react-i18next";

export const useAllowed = () => {
  try {
    enum types {
      resumen,
      invitados,
      mesas,
      lista,
      presupuesto,
      invitaciones,
      itinerario,
      servicios,
      memories
    }
    const { t } = useTranslation()
    const { event } = EventContextProvider()
    const toast = useToast();
    const router = useRouter()
    const pathname = usePathname()
    const { user } = AuthContextProvider()

    const VALID_MODULES = ['resumen','invitados','mesas','regalos','presupuesto','invitaciones','itinerario','servicios','memories']
    // Rutas no-modulares (no dependen de evento activo): se permiten siempre
    const NON_MODULE_ROUTES = ['','login','login-rapido','registro','register','configuracion','facturacion','eventos','perfil','diseno','mi-web-creador','asistente','chat','momentos-publicos','public-card','public-itinerary','confirmar-asistencia','info-app','bandeja-de-mensajes','InvitationEmailEditor','aiEmail','api-debug','debug-error','debug-front','prueba','app']

    const isAllowed = (pathM?: keyof typeof types) => {
      if (event?.usuario_id === user?.uid) {
        return true
      }
      let path = pathM ? pathM : pathname.split("/")[1].split("-")[0]
      // Rutas no-modulares siempre permitidas
      if (NON_MODULE_ROUTES.includes(path as string)) return true
      if (path === "lista") {
        path = "regalos"
      }
      if (path === "momentos") {
        path = "memories"
      }
      if (!VALID_MODULES.includes(path)) return false
      const f1 = event?.permissions?.findIndex(elem => elem.title === path)
      if (f1 > -1) {
        return event?.permissions[f1].value === "edit"
      }
      return false
    }

    const ht = () => {
      toast("warning", t("No tienes permiso para editar"))
      return true
    }
    return [isAllowed, ht]
  } catch (error) {
    console.log(error)
  }
}

export const useAllowedRouter = () => {
  try {
    const { event } = EventContextProvider()
    const toast = useToast();
    const router = useRouter()
    const pathname = usePathname()
    const { t } = useTranslation()
    const { user } = AuthContextProvider()

    const VALID_MODULES_ROUTER = ['resumen','invitados','mesas','regalos','presupuesto','invitaciones','itinerario','servicios','memories']
    // Rutas no-modulares (no dependen de un evento activo): nunca se bloquean por permissions
    const NON_MODULE_ROUTES = ['','login','login-rapido','registro','register','configuracion','facturacion','eventos','perfil','diseno','mi-web-creador','asistente','chat','momentos-publicos','public-card','public-itinerary','confirmar-asistencia','info-app','bandeja-de-mensajes','InvitationEmailEditor','aiEmail','api-debug','debug-error','debug-front','prueba','app']

    const isAllowedRouter = (pathM?: any) => {
      if (event?.usuario_id === user?.uid) {
        return true
      }
      let path = pathM ? pathM.split("/")[1].split("-")[0] : pathname.split("/")[1].split("-")[0]
      // Rutas no-modulares (home, login, perfil, configuracion, etc.) siempre permitidas
      if (NON_MODULE_ROUTES.includes(path)) return true
      if (path === "lista") {
        path = "regalos"
      }
      if (path === "momentos") {
        path = "memories"
      }
      if (!VALID_MODULES_ROUTER.includes(path)) return false
      const f1 = event?.permissions?.findIndex(elem => elem.title === path)
      if (f1 > -1) {
        return event?.permissions[f1].value !== "none"
      }
      return false
    }
    const ht = () => {
      toast("warning", t("No tienes permiso para este módulo"))
      return true
    }
    const hRoute = () => {
      router.push("/")
      return true
    }
    return [isAllowedRouter, ht, hRoute]
  } catch (error) {
    console.log(error)
  }
}

export const useAllowedViewer = () => {
  try {
    const { t } = useTranslation()
    const { event } = EventContextProvider()
    const toast = useToast();
    const { user } = AuthContextProvider()
    const router = useRouter()
    const pathname = usePathname()

    const isAllowedViewer = (viewers: string[] = []) => {
      let path = pathname.split("/")[1].split("-")[0]
      if (path !== "") {
        if (path === "lista") {
          path = "regalos"
        }
        const f1 = event?.permissions?.findIndex(elem => elem.title === path)
        if (f1 > -1) {
          if (event?.permissions[f1].value === "edit") {
            return true
          }
        }
      }
      if (event?.usuario_id === user?.uid) {
        return true
      }
      if (viewers?.includes(user.uid)) {
        return true
      }
      return false
    }
    return [isAllowedViewer]
  } catch (error) {
    console.log(error)
  }
}

