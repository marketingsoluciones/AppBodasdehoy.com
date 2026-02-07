import { cloneElement, FC, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { useAllowed } from "../../hooks/useAllowed";
import { EventContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useRouter } from "next/navigation";
import { table } from "../../utils/Interfaces";
import { useToast } from "../../hooks/useToast";
import { handleMoveGuest } from "./GrupoTablas";
import { useTranslation } from 'react-i18next';

interface props {
  initialValue: table
  planSpaceTitle: string
  guestID: string
}

export const RowObject: FC<props> = (props) => {
  const { t } = useTranslation();
  const toast = useToast()
  const router = useRouter()
  const { event, setEvent } = EventContextProvider()
  const { initialValue, planSpaceTitle, guestID } = props

  const [value, setValue] = useState(initialValue);
  const [show, setShow] = useState(false);
  const [isAllowed] = useAllowed()

  return (
    <ClickAwayListener onClickAway={() => setShow(false)}>
      <div className="relative w-full flex justify-center items-center">
        {/*value?.toLowerCase() == "no asignado"*/ false ? (
          <button
            onClick={() => router.push("/mesas")}
            className="bg-tertiary font-display text-sm font-medium hover:text-gray-500 *px-3 rounded-lg focus:outline-none"
          >
           {t("addtable")}
          </button>
        ) : (
          <button
            className="focus:outline-none font-display text-sm capitalize"
            onClick={() => !isAllowed() ? null : setShow(!show)}
          >
            {value?.title ?? "No Asignado"}
          </button>
        )}
        <ul
          className={`${show ? "block opacity-100" : "hidden opacity-0"
            } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 z-40 w-max`}
        >
          {[
            { _id: null, title: "No Asignado" },
            ...event?.planSpace.find(elem => elem?.title === planSpaceTitle)?.tables
          ]?.map((elem: any, index) => {
            if (elem?.guests?.length < elem?.numberChair || value?._id === elem?._id || !elem?._id) {
              return (
                <li
                  key={index}
                  className={`${(value?._id === elem._id || (!value?._id && !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                  onClick={() => {
                    const f1 = event?.planSpace.findIndex(elem => elem?.title === planSpaceTitle)
                    const table = event.planSpace[f1]?.tables.find(el => el._id === elem._id)
                    setShow(!show);
                    if (value?._id || elem?._id) {
                      if (value?._id !== elem?._id) {
                        setValue(elem.title);
                        handleMoveGuest({t, invitadoID: guestID, previousTable: value, lastTable: table, f1, event, setEvent, toast })
                      }
                    }
                  }}
                >
                  {elem?.title}
                </li>
              )
            }
          })}
          <li
            className="*bg-gray-300 cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
            onClick={() => router.push("/mesas")}
          >
            {t("addtable")}
          </li>
        </ul>
      </div>
    </ClickAwayListener>
  )
}