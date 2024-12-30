import { FC, useEffect, useRef } from "react";

interface props {
  value: string
  setValue: any
}

export const Textarea: FC<props> = ({ value, setValue, }) => {
  const refInput: any = useRef()

  const handleChange = (e) => {
    e.target.rows = 1
    let rowT = (refInput?.current.scrollHeight - 16) / 20
    if (rowT < 9) {
      e.target.rows = rowT
    }
    else {
      e.target.rows = 8
    }
    setValue(e.target.value)
  }

  useEffect(() => {
    if (!value) {
      refInput.current.rows = 1
    }
  }, [value])

  return (
    <textarea
      style={{ resize: 'none' }}
      rows={
        refInput?.current
          ? (refInput?.current.scrollHeight - 16) / 20 < 9
            ? (refInput?.current.scrollHeight - 16) / 20
            : 8
          : 1
      }
      ref={refInput}
      value={value}
      onChange={(e) => { handleChange(e) }}
      className={`rounded-lg border-[1px] border-gray-300 text-xs w-[100%] overflow-y-scroll focus:ring-0 focus:outline-none focus:border-primary h-10`} />
  )
}