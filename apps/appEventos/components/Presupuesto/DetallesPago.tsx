import { useEffect, useState } from "react";
import { useAllowed } from "../../hooks/useAllowed";
import { FaRegEye } from "react-icons/fa";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { MdOutlineExpandMore } from "react-icons/md";

const DetallesPago = ({ set, ...props }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState();
  const [isAllowed, ht] = useAllowed()
  const toast = useToast()


  useEffect(() => {
    setValue(props?.row?.original?.pagado)
  }, [props?.row?.original?.pagado])

  const handleClick = () => {
    if (props?.row?.original?.pagos_array?.length >= 1) {
      set({ id: props?.row?.original?._id, crear: false })
      props.toggleAllRowsExpanded(false)
      props.row.toggleRowExpanded()
      return
    } else {
      toast("error", t("paymenttoview"))
      return
    }
  }

  return (
    <>
      <div className="flex items-center justify-center h-full">
        <p onClick={!isAllowed() ? null : handleClick} className=" rounded hover:text-gray-400 transition cursor-pointer">
        <MdOutlineExpandMore className="w-4 h-4" />
        </p>
      </div>
    </>

  )
}

export default DetallesPago



