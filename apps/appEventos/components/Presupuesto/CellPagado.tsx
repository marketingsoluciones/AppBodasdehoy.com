import { useEffect, useState } from "react";
import { getCurrency } from "../../utils/Funciones";
import { useAllowed } from "../../hooks/useAllowed";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';

const CellPagado = ({ set, ...props }: { set: (v: any) => void; [key: string]: any }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const [value, setValue] = useState<any>();
  const [isAllowed, ht] = useAllowed()
  const [mask, setMask] = useState<string | undefined>()
  const toast = useToast()

  useEffect(() => {
    setMask(getCurrency(value))
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
      <div className="w-full flex items-center justify-end h-full">
        <p onClick={() => !isAllowed() ? ht() : handleClick()} className="hover:shadow-md rounded px-2 hover:bg-gray-200 hover:text-white transition w-max cursor-pointer">
          {mask}
        </p>
      </div>
    </>

  )
}

export default CellPagado



