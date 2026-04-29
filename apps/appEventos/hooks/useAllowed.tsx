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

    const isAllowed = (pathM?: keyof typeof types) => {
      if (event?.usuario_id === user?.uid) {
        return true
      }
      let path = pathM ? pathM : pathname.split("/")[1].split("-")[0]
      // La home "/" no es un módulo restringido — siempre permitida
      if (path === "") return true
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

    const isAllowedRouter = (pathM?: any) => {
      if (event?.usuario_id === user?.uid) {
        return true
      }
      let path = pathM ? pathM.split("/")[1].split("-")[0] : pathname.split("/")[1].split("-")[0]
      // La home "/" no es un módulo restringido — siempre permitida
      if (path === "") return true
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

