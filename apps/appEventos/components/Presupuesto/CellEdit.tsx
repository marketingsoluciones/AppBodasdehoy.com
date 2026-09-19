import { useContext, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiBodas } from "../../utils/Fetching";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';

type CellEditProps = {
  value?: any;
  type?: 'text' | 'number';
  row?: any;
  [key: string]: any;
};

const CellEdit = (props: CellEditProps) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const [edit, setEdit] = useState(false);
  const [mask, setMask] = useState<any>(0);
  const [value, setValue] = useState<any>();
  const [isAllowed, ht] = useAllowed()

  useEffect(() => {
    setValue(typeof props?.value == "string" ? capitalize(props?.value) : props?.value)
  }, [props.value])

  useEffect(() => {
    if (props?.type == "text") {
      setMask(value)
    }
    if (props?.type == "number") {
      setMask(getCurrency(value));
    }
  }, [value, event?.presupuesto_objeto?.currency]);

  const keyDown = (e: React.KeyboardEvent) => {
    const tecla = e.key.toLowerCase();
    if (tecla == "enter") {
      setEdit(false);
      handleBlur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const r = e.target.value?.split(".")
    setValue(r)
  };

  const handleBlur = async () => {
    setEdit(false);
    if (value !== props?.value) {
      const key = props?.cell?.column?.id;
      const FLOAT = new Set(['coste_proporcion','coste_estimado','coste_final','pagado']);
      let val: any = !!value ? value : "sin datos";
      if (FLOAT.has(key) && typeof val === 'string') {
        const n = Number(val);
        if (!isNaN(n)) val = n;
      }
      try {
        const result = await fetchApiBodas({
          query: `mutation($evento_id:ID!,$categoria_id:ID!,$gasto_id:ID!,$updates:GastoPresupuestoUpdateInput!){
            actualizarGastoPresupuesto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, updates:$updates){
              success errors{ field message code }
              evento{ _id presupuesto_objeto }
            }
          }`,
          variables: {
            evento_id: event?._id,
            categoria_id: props?.categoriaID,
            gasto_id: props?.row?.original?._id,
            updates: { [key]: val },
          },
        });
        const nuevoPresupuesto = result?.evento?.presupuesto_objeto;
        if (nuevoPresupuesto) {
          setEvent((old: any) => ({ ...old, presupuesto_objeto: nuevoPresupuesto }));
        }
      } catch (error) {
      }
    }
  };

  return (
    <ClickAwayListener
      onClickAway={() => { if (edit) { setEdit(false); handleBlur(); } }}
    >
      <div >
        {edit ? (
          <input
            type={props.type}
            min={0}
            /*  value={!!value ? value : ""} */
            onBlur={handleBlur}
            onChange={(e) => handleChange(e)}
            onKeyDown={(e) => keyDown(e)}
            autoFocus
            className="focus:outline-none text-center w-full border-b border-gray-200 px-2 py-1 h-full"
          />
        ) : (
          <p className="cursor-pointer hover:scale-105 transform transition text-center w-full truncate px-2 py-1 h-6" onClick={() => !isAllowed() ? null : setEdit(true)}>
            {typeof value == "string" ? capitalize(value) : mask}
          </p>
        )}
        <style jsx>
          {`
              input {
                background: transparent;
              }
              input[type="number"]::-webkit-inner-spin-button,
              input[type="number"]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
            `}
        </style>
      </div>
    </ClickAwayListener>
  );
};


export default CellEdit