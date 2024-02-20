import { useRouter } from "next/router"
import { EventContextProvider } from "../context"

export const useAllowed = () => {
  const { event } = EventContextProvider()

  const router = useRouter()
  const isAllowed = () => {
    console.log("aqui")
    let path = router.asPath.split("/")[1].split("-")[0]
    if (path !== "") {
      if (path === "lista") {
        path = "regalos"
      }
      const f1 = event?.permissions?.findIndex(elem => elem.title === path)
      if (f1 > -1) {
        return event?.permissions[f1].value === "edit"
      }
    }
    const asd = { ...event, permission: true }
    return true
  }

  return [isAllowed]
}