import { LoadingContextProvider } from "../../context"

const Event = () => {
  const { setLoading } = LoadingContextProvider()

  setLoading(true)

  window.location.href = "/"

  return

}

export default Event

