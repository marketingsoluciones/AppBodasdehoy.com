import { useEffect, useState } from "react";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { AuthContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { GoPlus } from "react-icons/go";
import { useTranslation } from 'react-i18next';


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
      <div className="flex items-center justify-center h-full">
        <p onClick={() => costeFional != 0 ? !isAllowed() ? null : handleClick() : toast("error", t("payments"))} className=" hover:text-gray-400 transition cursor-pointer">
        <GoPlus />
        </p>
      </div>
    </>

  )
}

export default AddPagado



