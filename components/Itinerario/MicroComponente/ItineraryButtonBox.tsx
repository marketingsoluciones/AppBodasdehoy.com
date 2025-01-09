import { FC, useEffect, useState } from "react"
import { Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces"
import { useAllowed } from "../../../hooks/useAllowed"
import { PiCheckFatBold } from "react-icons/pi"
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider, EventContextProvider } from "../../../context";


interface props {
  optionsItineraryButtonBox: OptionsSelect[]
  values: Task
  itinerario: Itinerary
}

export const ItineraryButtonBox: FC<props> = ({ optionsItineraryButtonBox, values, itinerario }) => {
  const { event } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation();
  const { user } = AuthContextProvider()


  const link = `${window.location.pathname}?event=${event._id}&itinerary=${itinerario._id}&task=${values._id}`

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 3000);
    }
  }, [copied])

  return (
    <div className=" flex justify-end flex-1">
      <div className=" inline-flex gap-1 items-end text-gray-500">
        {optionsItineraryButtonBox?.map((elem, idx) =>
          <div
            key={idx}
            onClick={() => {
              if (elem.value === "share") {
                setCopied(true)
                return
              }
              elem.onClick(values, itinerario)
            }}
            className={` 
              ${["/itinerario"].includes(window?.location?.pathname) && elem.vew === "tasks" ? "hidden" : ["/servicios"].includes(window?.location?.pathname) && elem.value === "estatus" ? "hidden" : ""} 
              ${!isAllowed() ? "hidden" : user.uid === event.usuario_id ? "hover:bg-gray-300 text-gray-600 hover:text-gray-700 cursor-pointer" : ""}
              ${elem.value === "estatus" ? "bg-gray-200" : values.estatus === true ? "bg-gray-200 opacity-50" : "bg-gray-200 cursor-pointer"}  
              w-10 h-10 rounded-full flex justify-center items-center  
              `

            }>
            {
              elem.getIcon
                ? elem.value === "status" && elem.getIcon(!values.spectatorView) || elem.value === "estatus" && elem.getIcon(values.estatus)
                : elem.value === "share"
                  ? copied
                    ? <div>
                      <div className="bg-black absolute rounded-full justify-center flex w-28 py-0.5 -translate-x-full -translate-y-full text-white">{t("copiedlink")}</div>
                      <PiCheckFatBold className="w-5 h-5" />
                    </div>
                    : <CopyToClipboard text={`${window.location.origin}${link}`}>
                      {elem.icon}
                    </CopyToClipboard>
                  : elem.icon
            }
          </div>
        )}
      </div>
    </div >
  )
}