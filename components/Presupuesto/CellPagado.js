import { useEffect, useState } from "react";
import { getCurrency } from "../../utils/Funciones";
import { EventContextProvider } from "../../context";

const CellPagado = ({ set, ...props }) => {
  const [value, setValue] = useState();
  const { event, currencyState, setCurrencyState } = EventContextProvider();


  useEffect(() => {
    setValue(props?.row?.original?.pagado)
  }, [props.row.original.pagado])

  const handleClick = () => {
    if (props?.row?.original?.pagos_array?.length >= 1) {
      set({ id: props?.row?.original?._id, crear: false })
      props.toggleAllRowsExpanded(false)
      props.row.toggleRowExpanded()
      return
    } else {
      set({ id: props?.row?.original?._id, crear: true })
      return
    }
  }

  return (
    <>
      <div className="w-full flex items-center justify-center h-full">
        <p onClick={handleClick} className="hover:shadow-md rounded px-2 hover:bg-gray-200 hover:text-white transition w-max cursor-pointer">
          {getCurrency(value,currencyState)}
        </p>
      </div>
    </>

  )
}

export default CellPagado



