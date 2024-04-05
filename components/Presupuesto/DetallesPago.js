import { useEffect, useState } from "react";
import { useAllowed } from "../../hooks/useAllowed";
import { GrMoney } from "react-icons/gr"

const DetallesPago = ({ set, ...props }) => {
  const [value, setValue] = useState();
  const [isAllowed, ht] = useAllowed()


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
      null
      return
    }
  }

  return (
    <>
      <div className="flex items-center justify-center h-full">
        <p onClick={!isAllowed() ? null : handleClick} className=" rounded px-2 hover:text-gray-400 transition cursor-pointer">
          <GrMoney />
        </p>
      </div>
    </>

  )
}

export default DetallesPago



