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

  useEffect(() => {
    console.log(100030, field.value)
  }, [field.value])


  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(100032, [...Array.from(field.value), ...Array.from(e.target.files)])
    let arrayUnido = [...Array.from(field.value), ...Array.from(e.target.files)]
    helpers.setValue(arrayUnido)
  }


  return (
    <div className="w-full h-max relative">
      <label className={` font-display text-primary text-sm w-full `}>{label}</label>
      <div className="w-full relative">
        <div className={`border-[1px] border-gray-300 hover:scale-120 transform flex items-center gap-1`} >
          <p className="bg-white py-2 text-gray-900 p-1">
            {!!field?.value?.length && [...field?.value]?.map((elem, idx) =>
              <span key={idx} className="inline-flex ml-2 mt-1 items-start leading-[1.2]">
                <IoIosAttach className="w-4 h-5" />
                <span className="flex-1">
                  {elem?.name}
                </span>
                <div className="w-6 h-5 flex justify-center items-center cursor-pointer p-1">
                  <MdClose className="hover:text-gray-500" />
                </div>
              </span>
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
