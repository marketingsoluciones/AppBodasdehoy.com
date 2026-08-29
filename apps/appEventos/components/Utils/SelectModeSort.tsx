import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import ClickAwayListener from "react-click-away-listener"
import { GoMultiSelect } from "react-icons/go"
import { LiaIdCardSolid } from "react-icons/lia";
import { HiOutlineViewList } from "react-icons/hi";
import { TbSchema } from "react-icons/tb";
import { ArrowDownBodasIcon } from "../icons";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from "react-i18next";
import { Direction, Order, SelectModeSortType } from "../../utils/Interfaces";
import { isStudioPathname } from "../../utils/studioPaths";



interface props {
  value: SelectModeSortType
  setValue: Dispatch<SetStateAction<SelectModeSortType>>
}

interface orderOptions {
  value: Order,
  title: string
}

export const SelectModeSort: FC<props> = ({ value, setValue }) => {
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(false)
  const [isAllowed, ht] = useAllowed()
  const [order, setOrder] = useState<Order>(value ? value.order : "fecha")
  const [direction, setDirection] = useState<Direction>(value ? value.direction : "asc")
  // Rediseño studio (gate ?studio, default ON): solo /itinerario. Fiel a
  // dropdownordenar.html (.ord-btn / .ord-menu, 2 grupos, no cierra al elegir).
  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy"

  let orderOptions: orderOptions[] = [
    {
      value: "fecha",
      title: t("date")
    }, {
      value: "descripcion",
      title: t("name")
    },
  ]
  if (window?.location?.pathname === "/servicios") {
    orderOptions = [...orderOptions,
    {
      value: "estado",
      title: t("state")
    },
    {
      value: "prioridad",
      title: t("priority")
    },
    ]
  }

  const directionOptions: { value: Direction, title: string }[] = [
    {
      value: "asc",
      title: t("asc")
    }, {
      value: "desc",
      title: t("desc")
    }
  ]

  useEffect(() => {
    setValue({ order, direction })
  }, [order, direction])


  if (isStudio) {
    const ordItem = (on: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 11, padding: "9px 14px", borderRadius: 8, cursor: "pointer", font: on ? "600 13px Poppins" : "400 13px Poppins", color: on ? "#3A3A42" : "#6b6b72", textTransform: "capitalize" })
    const ordDot = (on: boolean): React.CSSProperties => ({ width: 9, height: 9, borderRadius: "50%", background: on ? "#2FB37E" : "#ececef", flex: "none", display: "inline-block" })
    return (
      <ClickAwayListener onClickAway={() => setShow(false)}>
        <div className={`relative select-none ${show ? "z-50" : ""}`}>
          <button onClick={() => setShow(!show)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer", textTransform: "capitalize" }}>
            {t("toOrder", { defaultValue: "Ordenar" })}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {show && <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, width: 180, background: "#fff", borderRadius: 14, boxShadow: "0 14px 40px rgba(0,0,0,.14)", border: "1px solid #f0f0f2", zIndex: 40, padding: "10px 6px" }}>
            {orderOptions.map(item => {
              const on = order === item.value
              return <div key={item.value} className="ord-item-studio" onClick={() => setOrder(item.value as Order)} style={ordItem(on)}>
                <span style={ordDot(on)} />{item.title}
              </div>
            })}
            <div style={{ height: 1, background: "#f0f0f2", margin: "8px 10px" }} />
            {directionOptions.map(item => {
              const on = direction === item.value
              return <div key={item.value} className="ord-item-studio" onClick={() => setDirection(item.value as Direction)} style={ordItem(on)}>
                <span style={ordDot(on)} />{item.title}
              </div>
            })}
          </div>}
          <style jsx>{`.ord-item-studio:hover{background:#fdf7fa;}`}</style>
        </div>
      </ClickAwayListener>
    )
  }

  return (
    <ClickAwayListener onClickAway={() => setShow(false)} >
      <div className={`relative flex cursor-pointer  md:translate-y-0 select-none ${show && "z-50"}`}>
        <div onClick={() => { setShow(!show) }} className="inline-flex  gap-0.5 text-gray-700 items-center capitalize text-[10px]">
          <span className="">{t("toOrder")}</span>
          <ArrowDownBodasIcon className="w-4 h-4 rotate-90" />
        </div>

        {show &&
          <div className={`absolute right-0 bg-white top-8 rounded-md shadow-md`}>
            {[...orderOptions.map(elem => { return { ...elem, type: "order" } }),
              null,
            ...directionOptions.map(elem => { return { ...elem, type: "direction" } })]?.map((item, idx) => {
              return item
                ? <div key={idx}
                  onClick={() => {
                    item.type === "order" ? setOrder(item.value as Order) : setDirection(item.value as Direction)
                    // setShow(false)
                  }}
                  className={`py-1 pl-2 pr-8 text-gray-700 text-xs flex items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${[order, direction].includes(item?.value) && "bg-gray-200"}`}
                >
                  <div className={`w-2 h-2 rounded-full ${[order, direction].includes(item?.value) && "bg-green"}`} />
                  {item.title}
                </div>
                : <div key={idx} className="w-full border-t-[1px] border-gray-500" />
            })}
          </div>
        }
      </div>
    </ClickAwayListener>
  )
}