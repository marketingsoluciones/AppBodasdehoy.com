import { useEffect, useState } from "react";
import { useAllowed } from "../../hooks/useAllowed";
import { FaRegEye } from "react-icons/fa";
import { useToast } from "../../hooks/useToast";

const DetallesPago = ({ set, ...props }) => {
  const [value, setValue] = useState();
  const [isAllowed, ht] = useAllowed()
  const toast = useToast()


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
      toast("error", "no tienes pago para visualizar ")
      return
    }
  }

  return (
    <>
      <div className="flex items-center justify-center h-full">
        <p onClick={!isAllowed() ? null : handleClick} className=" rounded px-2 hover:text-gray-400 transition cursor-pointer">
        <FaRegEye />
        </p>
      </div>
    </>

  )
}

export default DetallesPago



