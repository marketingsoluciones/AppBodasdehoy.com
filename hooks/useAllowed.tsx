import { useRouter } from "next/router"
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
      servicios
    }
    const { t } = useTranslation()
    const { event } = EventContextProvider()
    const toast = useToast();
    const router = useRouter()
    const { user } = AuthContextProvider()

    const isAllowed = (pathM?: keyof typeof types) => {
      if (event?.usuario_id === user?.uid) {
        return true
      }
      let path = pathM ? pathM : router.asPath.split("/")[1].split("-")[0]
      if (path !== "") {
        if (path === "lista") {
          path = "regalos"
        }
        const f1 = event?.permissions?.findIndex(elem => elem.title === path)
        if (f1 > -1) {
          return event?.permissions[f1].value === "edit"
        }
      }
      return true
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
    const { t } = useTranslation()
    const { user } = AuthContextProvider()

    const isAllowedRouter = (pathM?: any) => {
      if (event?.usuario_id === user?.uid) {
        return true
      }
      let path = pathM ? pathM.split("/")[1].split("-")[0] : router.asPath.split("/")[1].split("-")[0]
      if (path !== "") {
        if (path === "lista") {
          path = "regalos"
        }
        const f1 = event?.permissions?.findIndex(elem => elem.title === path)
        if (f1 > -1) {
          return event?.permissions[f1].value !== "none"
        }
        else {
          return true
        }
      }
      return true
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

    const isAllowedViewer = (viewers: string[] = []) => {
      let path = router.asPath.split("/")[1].split("-")[0]
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

