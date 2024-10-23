import { useField } from "formik"
import { FC, InputHTMLAttributes, useRef } from "react"
import { MdClose } from "react-icons/md"

interface props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const InputTags: FC<props> = ({ label, ...props }) => {
  const refInput = useRef<HTMLInputElement>()
  const [field, meta, helpers] = useField({ name: props.name })

  const handleAddTags = async () => {
    if (refInput.current.value) {
      field.value.push(refInput.current.value)
      helpers.setValue([...field.value])
      refInput.current.value = ""
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex space-x-2 items-center">
        <input
          ref={refInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTags()
            }
          }}
          className="flex-1 font-display text-sm text-gray-500 border-[1px] border-gray-200 focus:border-gray-400 w-full py-2 px-4 rounded-xl focus:ring-0 focus:outline-none transition"
          type="text"
        />
        <button type="button" onClick={() => handleAddTags()} className="rounded-xl bg-primary px-2 h-8 text-white text-sm hover:font-bold">Añadir tiqueta</button>
      </div>
      {!!field?.value?.length && <p className="border-[1px] space-y-1 p-1 text-gray-700 ">
        {field.value.map((elem, idx) =>
          <div key={idx} className="inline-flex mx-1 bg-gray-200 px-2 py-1 md:py-0 rounded-sm space-x-2 items-center">
            <span>
              {elem}
            </span>
            <MdClose onClick={() => {
              const f1 = field.value.findIndex(el => el === elem)
              field.value.splice(f1, 1)
              helpers.setValue([...field.value])
            }} className="hover:text-gray-500 cursor-pointer" />
          </div>
        )}
      </p>}
    </div>
  )
}