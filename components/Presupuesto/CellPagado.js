import { useEffect, useState } from "react";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { AuthContextProvider } from "../../context";

const CellPagado = ({ set, ...props }) => {
  const [value, setValue] = useState();
  const [isAllowed, ht] = useAllowed()
  const [mask, setMask] = useState()
  const { currency } = AuthContextProvider()

  useEffect(() => {
    setMask(value)
  }, [value, currency])

  useEffect(() => {
    setValue(props?.row?.original?.pagado)
  }, [props.row.original.pagado])

  const handleClick = () => {

    set({ id: props?.row?.original?._id, crear: true })
    return

  }

  return (
    <>
      <div className="w-full flex items-center justify-center h-full">
        <p onClick={!isAllowed() ? null : handleClick} className="hover:shadow-md rounded px-2 hover:bg-gray-200 hover:text-white transition w-max cursor-pointer">
          {mask}
        </p>
      </div>
    </>

  )
}

export default CellPagado



