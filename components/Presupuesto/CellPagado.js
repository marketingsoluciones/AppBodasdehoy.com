import { useEffect, useState } from "react";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';

const CellPagado = ({ set, ...props }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider()
  const [value, setValue] = useState();
  const [isAllowed, ht] = useAllowed()
  const [mask, setMask] = useState()
  const toast = useToast()
  const costeFional = props.row.original.coste_final

  useEffect(() => {
    setMask(getCurrency(value, event?.presupuesto_objeto?.currency))
  }, [value, event?.presupuesto_objeto?.currency])

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
        <p onClick={() => costeFional != 0 ? !isAllowed() ? null : handleClick() : toast("error", t("payments_error"))} className="hover:shadow-md rounded px-2 hover:bg-gray-200 hover:text-white transition w-max cursor-pointer">
          {mask}
        </p>
      </div>
    </>

  )
}

export default CellPagado



