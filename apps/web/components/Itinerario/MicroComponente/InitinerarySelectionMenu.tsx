import { FC, useEffect, useState } from "react"
import { DotsOpcionesIcon, PencilEdit } from "../../icons"
import ClickAwayListener from "react-click-away-listener"
import { useToast } from "../../../hooks/useToast"
import { PiCheckFatBold } from "react-icons/pi"
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useAllowed } from "../../../hooks/useAllowed"
import { useTranslation } from "react-i18next"
import { Itinerary, OptionsSelect } from "../../../utils/Interfaces"
import { EditTastk } from "./ItineraryPanel"

interface props {
  data: any
  itinerario: Itinerary
  optionsItineraryButtonBox: OptionsSelect[]
  setShowEditTask: any
  showEditTask: EditTastk
}

export const IniterarySelectionMenu: FC<props> = ({ data, itinerario, optionsItineraryButtonBox, setShowEditTask, showEditTask }) => {
  const [show, setShow] = useState(false)
  const [value, setValue] = useState("")
  const [copied, setCopied] = useState(false)
  const toast = useToast()
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();



  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 3000);
    }
  }, [copied])

  return (
    <div key={data?.cell?.row?.id} className="w-full h-full flex justify-center items-center">
      {/* <div onClick={() => { !isAllowed() ? ht() : setShowEditTask({ state: !showEditTask.state, values: data?.cell?.row?.original }) }} className={`hidden md:flex ${isAllowed() ? "text-gray-700" : "text-gray-300"} cursor-pointer w-4 h-6 items-center justify-center *bg-blue-400`}>
        <PencilEdit className="w-5 h-5" />
      </div> */}
      <ClickAwayListener onClickAway={() => show && setShow(false)} >
        <div onClick={() => !isAllowed() ? ht() : setShow(!show)} className="w-6 h-6 flex justify-center" >
          <div className="cursor-pointer w-4 h-6 flex items-center justify-center *bg-blue-400">
            <DotsOpcionesIcon className={`${!show ? !isAllowed() ? "text-gray-300" : "text-gray-700" : "text-gray-900"} w-4 h-4`} />
          </div>
          {show && <div className={`absolute left-full top-1/2 bg-white z-50 rounded-md shadow-md translate-x-4 ${((data?.data?.length > 10 && data?.cell?.row?.id > data?.data?.length - 6) || (data?.data?.length > 6 && data?.data?.length < 11 && data?.cell?.row?.id > 5)) && "-translate-y-full"}`}>
            {optionsItineraryButtonBox?.map((item, idx) =>
              <div key={idx}
                onClick={() => {
                  if (item.value === "share") {
                    setCopied(true)
                    toast("success", t(`copiedlink`))
                    return
                  }
                  setValue(item.value)
                  setShow(false)
                  item?.onClick(data?.cell?.row?.original, itinerario)
                }}
                className={`${/*item.value === "edit" ? "flex md:hidden" : "flex"*/"flex"}  ${["/itinerario"].includes(window?.location?.pathname) && item.vew != "all" ? "hidden" : ""} p-2 pr-8 text-gray-700 text-xs items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${item.value === value && "bg-gray-200"}`}
              >
                {item.value === "share"
                  ? copied
                    ? <div>
                      <PiCheckFatBold className="w-5 h-5" />
                    </div>
                    : <CopyToClipboard text={"link"}>
                      <div className="flex gap-2">
                        {item.icon}
                        <span className="flex-1 leading-[1]">
                          {item.title}
                        </span>
                      </div>
                    </CopyToClipboard>
                  : <>
                    {item.icon}
                    <span className="flex-1 leading-[1]">
                      {item.title}
                    </span>
                  </>
                }
              </div>
            )}
          </div>}
        </div>
      </ClickAwayListener>
    </div>
  )
}
