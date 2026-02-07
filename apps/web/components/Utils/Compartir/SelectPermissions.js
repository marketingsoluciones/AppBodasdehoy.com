import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { IoEyeOutline } from "react-icons/io5"
import { MdOutlineCancel, MdOutlineEdit } from "react-icons/md"

export const SelectPermissions = ({ item, handleChange }) => {
  const { t } = useTranslation()
  const [values, setValues] = useState(item)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    if (values && isMounted) {
      handleChange(values)
    }
  }, [values])

  return (
    <div className="flex items-center space-x-2 justify-start hover:bg-gray-200 px-4 py-2">
      <div className="cursor-default w-32 capitalize">
        {t(item?.title)}
      </div>
      <div className="flex items-center space-x-3">
        <div className="cursor-pointer" onClick={() => {
          console.log(100052, "none", values)
          values?.value !== "none" && setValues({ title: item?.title, value: "none" })
        }}>
          <MdOutlineCancel className={`w-[18px] h-[18px] ${values?.value === "none" ? "text-primary hover:opacity-70" : "text-gray-500 hover:text-gray-800"}`} />
        </div>
        <div className="cursor-pointer " onClick={() => {
          console.log(100052, "view", values)
          values?.value !== "view" && setValues({ title: item?.title, value: "view" })
        }}>
          <IoEyeOutline className={`w-[18px] h-[18px] ${values?.value === "view" ? "text-primary hover:opacity-70" : "text-gray-500 hover:text-gray-800"}`} />
        </div>
        <div className="cursor-pointer" onClick={() => {
          console.log(100052, "edit", values)
          values?.value !== "edit" && setValues({ title: item?.title, value: "edit" })
        }}>
          <MdOutlineEdit className={`w-[18px] h-[18px] ${values?.value === "edit" ? "text-primary hover:opacity-70" : "text-gray-500 hover:text-gray-800"}`} />
        </div>
      </div>
    </div>
  )
}