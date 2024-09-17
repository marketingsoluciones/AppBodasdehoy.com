import { useTranslation } from "react-i18next"
import { IoEyeOutline } from "react-icons/io5"
import { MdOutlineCancel, MdOutlineEdit } from "react-icons/md"

export const SelectPermissions = ({ item, setValues }) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center space-x-2 justify-start hover:bg-gray-200 px-4 py-2">
      <div className="cursor-default w-32 capitalize">
        {t(item?.title)}
      </div>
      <div className="flex items-center space-x-3">
        <div className="cursor-pointer" onClick={() => setValues({ title: item.title, value: "none" })}>
          <MdOutlineCancel className={`w-[18px] h-[18px] ${item?.value === "none" ? "text-primary hover:opacity-70" : "text-gray-500 hover:text-gray-800"}`} />
        </div>
        <div className="cursor-pointer " onClick={() => setValues({ title: item.title, value: "view" })}>
          <IoEyeOutline className={`w-[18px] h-[18px] ${item?.value === "view" ? "text-primary hover:opacity-70" : "text-gray-500 hover:text-gray-800"}`} />
        </div>
        <div className="cursor-pointer" onClick={() => setValues({ title: item.title, value: "edit" })}>
          <MdOutlineEdit className={`w-[18px] h-[18px] ${item?.value === "edit" ? "text-primary hover:opacity-70" : "text-gray-500 hover:text-gray-800"}`} />
        </div>
      </div>
    </div>
  )
}