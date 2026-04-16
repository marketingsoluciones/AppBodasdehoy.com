import { useEffect, useState } from "react";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { GrMoney } from "react-icons/gr";


const AddPagado = ({ set, ...props }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState();
  const [isAllowed, ht] = useAllowed()
  const [mask, setMask] = useState()
  const toast = useToast()
  const costeFional = props?.row?.original?.coste_final

  useEffect(() => {
    setMask(getCurrency(value, event?.presupuesto_objeto?.currency))
  }, [value, event?.presupuesto_objeto?.currency])

  useEffect(() => {
    setValue(props?.row?.original?.pagado)
  }, [props?.row?.original.pagado])

  const handleClick = () => {
    set({ id: props?.row?.original?._id, crear: true })
    return

  }

  return (
    <>
      <div className="flex items-center justify-center h-full px-2">
        <p onClick={() => costeFional != 0 ? !isAllowed() ? null : handleClick() : toast("error", t("payments_error"))} className=" hover:text-gray-400 transition cursor-pointer">
          <GrMoney className="w-4 h-4" />
        </p>
      </div>
    </>

  )
}

export default AddPagado



