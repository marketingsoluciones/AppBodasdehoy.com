import { FC, useEffect, useState } from "react"
import ClickAwayListener from "react-click-away-listener"
import { GoMultiSelect } from "react-icons/go"
import { LiaIdCardSolid } from "react-icons/lia";
import { HiOutlineViewList } from "react-icons/hi";
import { TbSchema } from "react-icons/tb";
import { ArrowDownBodasIcon } from "../icons";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from "react-i18next";

interface props {
  value: any
  setValue: any
}

export const SelectModeSort: FC<props> = ({ value, setValue }) => {
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(false)
  const [isAllowed, ht] = useAllowed()
  const [order, setOrder] = useState<string>("fecha")
  const [direction, setDirection] = useState<string>("asc")

  const orderOptions = [
    {
      value: "fecha",
      title: t("date")
    }, {
      value: "nombre",
      title: t("name")
    }, {
      value: "estado",
      title: t("state")
    }
  ]

  const directionOptions = [
    {
      value: "asc",
      title: t("asd")
    }, {
      value: "desc",
      title: t("desc")
    }
  ]

  useEffect(() => {
    // console.log(order, direction)
  }, [order, direction])


  return (
    <ClickAwayListener onClickAway={() => setShow(false)} >
      <div className="relative flex cursor-pointer -translate-y-10 md:translate-y-0">
        <div onClick={() => { setShow(!show) }} className="inline-flex text-sm gap-0.5 text-gray-700 items-center capitalize">
          {t("toOrder")}
          <ArrowDownBodasIcon className="w-4 h-4 rotate-90" />
        </div>
        {show && <div className={`absolute right-0 bg-white top-8 z-50 rounded-md shadow-md`}>
          {[...orderOptions.map(elem => { return { ...elem, type: "order" } }),
            null,
          ...directionOptions.map(elem => { return { ...elem, type: "direction" } })]?.map((item, idx) => {
            return item
              ? <div key={idx}
                onClick={() => {
                  item.type === "order" ? setOrder(item.value) : setDirection(item.value)
                  setShow(false)
                }}
                className={`p-2 text-gray-700 text-sm flex items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${item.value === value && "bg-gray-200"}`}
              >
                <div className={`w-2 h-2 rounded-full ${[order, direction].includes(item?.value) && "bg-gray-500"}`} />
                {item.title}
              </div>
              : <div key={idx} className="w-full border-t-[1px] border-gray-500" />
          }
          )
          }

        </div>}
      </div>
    </ClickAwayListener>
  )
}