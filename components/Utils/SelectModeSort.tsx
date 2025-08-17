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
      // {
      //   value: "personalizada",
      //   title: t("custom")
      // },
      // {
      //   value: "ninguna",
      //   title: t("none")
      // }
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


  return (
    <ClickAwayListener onClickAway={() => setShow(false)} >
      <div className={`relative flex cursor-pointer -translate-y-10 md:translate-y-0 select-none ${show && "z-50"}`}>
        <div onClick={() => { setShow(!show) }} className="inline-flex text-sm gap-0.5 text-gray-700 items-center capitalize">
          {t("toOrder")}
          <ArrowDownBodasIcon className="w-4 h-4 rotate-90" />
        </div>
        {show && <div className={`absolute right-0 bg-white top-8 rounded-md shadow-md`}>
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
        </div>}
      </div>
    </ClickAwayListener>
  )
}