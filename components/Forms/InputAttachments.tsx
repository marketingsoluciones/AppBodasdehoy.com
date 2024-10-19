import { useField } from "formik"
import React, { ChangeEvent, FC, InputHTMLAttributes, useEffect, useState } from "react"
import { useAllowed } from "../../hooks/useAllowed";
import { flags } from "../../utils/flags.js"
import { AuthContextProvider } from "../../context";
import { IoIosArrowDown, IoIosAttach } from "react-icons/io";
import ClickAwayListener from "react-click-away-listener"
import { useTranslation } from 'react-i18next';
import { PlusIcon } from "../icons";
import { MdClose, MdOutlineCancel } from "react-icons/md";
import { CgSoftwareDownload } from "react-icons/cg";

interface props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
  disabled?: boolean
  labelClass?: boolean

}
interface Flag {
  pre: string
  name: string
  cod: number
}

const InputAttachments: FC<Partial<props>> = ({ label, className, disabled = false, labelClass = true, ...props }) => {
  const { t } = useTranslation();
  const { geoInfo } = AuthContextProvider()
  const [field, meta, helpers] = useField({ name: props.name })
  const [isAllowed, ht] = useAllowed()
  const [values, setValues] = useState<any>([])

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    let arrayUnido = [...Array.from(field.value), ...Array.from(e.target.files)]
    helpers.setValue(arrayUnido)
  }

  const handleDeleteFromInput = (elem) => {
    const f1 = field.value.findIndex(el => el.name === elem.name)
    field.value.splice(f1, 1)
    helpers.setValue([...field.value])
  }

  return (
    <div className="w-full h-max relative">
      <label className={` font-display text-primary text-sm w-full inline-flex`}>{label} <IoIosAttach className="w-4 h-5 text-gray-600" /> </label>
      <div className="w-full relative">
        <div className={`border-[1px] border-gray-300 hover:scale-120 transform flex items-center gap-1`} >
          <p className="bg-white w-full py-2 text-gray-900 p-1">
            {!!field?.value?.length && [...field?.value]?.map((elem, idx) =>
              <div key={idx} className="flex ml-2 mt-1 px-2 py-1 md:py-0 items-center leading-[1.2] space-x-1 border-[1px] bg-gray-200 rounded-sm">
                <span className="flex-1 text-sm truncate">{elem?.name}</span>
                <span className="text-xs font-semibold">({Math.trunc(elem.size / 1024)} K)</span>
                {elem?._id
                  ? <a href={elem.url} target="_blank">
                    <CgSoftwareDownload className="cursor-pointer hover:text-gray-500 w-5 h-5 text-gray-700" />
                  </a>
                  : <div className="w-5 text-[10px]">new</div>
                }
                <div onClick={() => handleDeleteFromInput(elem)} className="w-6 h-5 flex justify-center items-center cursor-pointer p-1">
                  <MdClose className="hover:text-gray-500" />
                </div>
              </div>
            )}
            <label htmlFor="attachments" className="cursor-pointer">
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm select-none">Cargar archivos</span>
                <PlusIcon className="w-4 h-4 text-primary cursor-pointer" />
              </div>
            </label>
          </p>
        </div>
        <input
          id="attachments"
          type="file"
          multiple
          name="attachments"
          required
          onChange={(e) => handleOnChange(e)}
          className="hidden"
          //accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={false}
        />
      </div>
    </div>
  )
}

export default React.memo(InputAttachments)
