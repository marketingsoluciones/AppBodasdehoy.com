import { useRouter } from "next/router"
import { EventContextProvider, ToastContextProvider } from "../context"
import { useToast } from "./useToast";

export const useAllowed = () => {
  try {
    enum types {
      resumen,
      invitados,
      mesas,
      lista,
      presupuesto,
      invitaciones,
    }

    const { event } = EventContextProvider()
    const toast = useToast();
    const router = useRouter()

    const isAllowed = (pathM?: keyof typeof types) => {
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
      toast("warning", "No tienes permiso para editar")
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

    const isAllowedRouter = (pathM?: any) => {
      let path = pathM ? pathM.split("/")[1].split("-")[0] : router.asPath.split("/")[1].split("-")[0]
      if (path !== "") {
        if (path === "lista") {
          path = "regalos"
        }
        const f1 = event?.permissions?.findIndex(elem => elem.title === path)
        if (f1 > -1) {
          return event?.permissions[f1].value !== "none"
        }
      }
      return true
    }
    const ht = () => {
      toast("warning", "No tienes permiso para este módulo")
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