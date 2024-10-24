import { FC, useEffect, useState } from "react"
import ClickAwayListener from "react-click-away-listener"
import { GoMultiSelect } from "react-icons/go"
import { LiaIdCardSolid } from "react-icons/lia";
import { HiOutlineViewList } from "react-icons/hi";
import { TbSchema } from "react-icons/tb";
import { ArrowDownBodasIcon } from "../icons";

interface props {
  value: any
  setValue: any
}

export const SelectModeView: FC<props> = ({ value, setValue }) => {
  const [show, setShow] = useState<boolean>(false)

  const options = [
    {
      value: "table",
      icon: <HiOutlineViewList className="w-5 h-5" />,
      title: "tabla"
    },
    {
      value: "cards",
      icon: <LiaIdCardSolid className="w-5 h-5" />,
      title: "targetas"
    }
  ]

  if (["/itinerario"].includes(window?.location?.pathname)) {
    options.push({
      value: "schema",
      icon: <TbSchema className="w-5 h-5" />,
      title: "esquema"
    })
  }

  return (
    <ClickAwayListener onClickAway={() => setShow(false)} >
      <div className="relative flex cursor-pointer">
        <div onClick={() => { setShow(!show) }} className="inline-flex text-sm gap-0.5 text-gray-700 items-center capitalize">
          {options.find(item => item.value === value)?.icon}
          ver
          <ArrowDownBodasIcon className="w-4 h-4 rotate-90" />
        </div>
        {show && <div className={`absolute right-0 bg-white top-8 z-50 rounded-md shadow-md`}>
          {options?.map((item, idx) =>
            <div key={idx}
              onClick={() => {
                setValue(item.value)
                setShow(false)
              }}
              className={`p-2 text-gray-700 text-sm flex items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${item.value === value && "bg-gray-200"}`}
            >
              {item.icon}
              {item.title}
            </div>
          )
          }
        </div>}
      </div>
    </ClickAwayListener>
  )
}