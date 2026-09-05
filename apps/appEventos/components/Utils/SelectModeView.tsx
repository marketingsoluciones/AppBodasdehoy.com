
import { FC, useEffect, useState } from "react"
import ClickAwayListener from "react-click-away-listener"
import { LiaIdCardSolid } from "react-icons/lia";
import { HiOutlineViewList } from "react-icons/hi";
import { TbSchema, TbLayoutKanban } from "react-icons/tb";
import { ArrowDownBodasIcon } from "../icons";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from "react-i18next";

interface props {
  value: any
  setValue: any
}

export const SelectModeView: FC<props> = ({ value, setValue }) => {
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(false)
  const [isAllowed, ht] = useAllowed()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const pathname = window?.location?.pathname;

  let options = [
    {
      value: "cards",
      icon: <LiaIdCardSolid className="w-5 h-5" />,
      title: t("card")
    },
    ...(!isMobile ? [{
      value: "newTable",
      icon: <HiOutlineViewList className="w-5 h-5" />,
      title: t("board")
    }] : []),
    ...(!isMobile ? [{
      value: "boardView",
      icon: <TbLayoutKanban className="w-5 h-5" />,
      title: t("kanban")
    }] : []),
  ];

  if (pathname === "/itinerario") {
    options = [
      {
        value: "cards",
        icon: <LiaIdCardSolid className="w-5 h-5" />,
        title: t("card")
      },
      ...(!isMobile ? [{
        value: "table",
        icon: <HiOutlineViewList className="w-5 h-5" />,
        title: t("board")
      }] : []),
      {
        value: "schema",
        icon: <TbSchema className="w-5 h-5" />,
        title: t("schema")
      }
    ];
  }

  return (
    <ClickAwayListener onClickAway={() => setShow(false)} >
      <div className={`relative flex translate-y-[9px] md:translate-y-0 ${show && "z-10"}`}>
        <div onClick={() => { setShow(!show) }} className="inline-flex cursor-pointer text-[10px] gap-0.5 text-gray-700 items-center capitalize">
          {options.find(item => item.value === value)?.icon}
          {t("view")}
          <ArrowDownBodasIcon className="w-4 h-4 rotate-90" />
        </div>
        {show && <div className={`absolute right-0 bg-white top-8 rounded-md shadow-md`}>
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
          )}
        </div>}
      </div>
    </ClickAwayListener>
  )
}