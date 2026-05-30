import { useContext, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching";
import { set } from "date-fns";
import { useToast } from "../../hooks/useToast";
import { string } from "yup";
import { InputUpdateInBlur } from "../Forms/inputs/InputUpdateInBlur";

type CellEditCopyProps = {
  value?: any;
  type?: 'text' | 'number' | 'cantidad' | 'string' | 'unidad';
  row?: any;
  [key: string]: any;
};

const CellEditCopy = (props: CellEditCopyProps) => {

  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider() as any;
  const [edit, setEdit] = useState(false);
  const [mask, setMask] = useState<any>(0);
  const [value, setValue] = useState<any>();
  const [isAllowed, ht] = useAllowed()
  const toast = useToast()

  useEffect(() => {
    setValue(typeof props?.value == "string" ? props?.value : props?.value)
  }, [props.value])

  useEffect(() => {
    if (props?.type == "text") {
      setMask(value)
    }
    if (props?.type == "number") {
      setMask(getCurrency(value));
    }
    if (props?.type == "cantidad") {
      value
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

  const handleBlur = async (e?: React.FocusEvent<HTMLInputElement>) => {
    setEdit(false);
    let res;
    if (value !== props?.value) {
      if (props?.table === "principal") {
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
          toast("success", t("Partida actualizada con exito"))
        } catch (error) {
        }
      }
      if (props?.table === "subtable") {
        const f1 = event?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == props?.categoriaID)
        const data = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.find((item) => item.items_array.some((item) => item._id == props?.row?.original?._id))
        fetchApiEventos({
          query: queries.editItemGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: props?.categoriaID,
            gasto_id: data?._id,
            itemGasto_id: props?.row?.original?._id,
            variable: props?.cell?.column?.id,
            valor: !!value ? value[0] : "sin datos"
          }
        }).then((res: any) => {
          // PresupuestoResponse wrapper: res.evento.presupuesto_objeto contiene la estructura
          const presupuesto = res?.evento?.presupuesto_objeto || res
          if (presupuesto?.categorias_array) {
            setEvent((old) => ({ ...old, presupuesto_objeto: presupuesto }))
          }
          toast("success", t("item actualizado con exito"))
        })
      }
    }
  };

  return (
    <ClickAwayListener
      onClickAway={() => { if (edit) { setEdit(false); handleBlur(); } }}
    >
      <div >
        {edit ? (
          <InputUpdateInBlur
            type={props.type}
            onChange={handleChange}
            onBlur={handleBlur}
            keyDown={keyDown}
            value={value}
          />
        ) : (
          <p className={` ${props.type == "number" && "text-end" || props.type == "string" && "text-left capitalize" || props.type === "cantidad" && "text-center" || props.type === "unidad" && "text-center"} cursor-pointer w-full truncate px-2 py-1 h-6 `} onClick={() => !isAllowed() ? null : setEdit(true)}>
            {
              props.type == "string" && value
            }
            {
              props.type == "number" && mask
            }
            {
              props.type == "cantidad" && value
            }
          </p>
        )}
        <style jsx>
          {`
              input {
                background: transparent;
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
              }
          `}
        </style>
      </div>
    </ClickAwayListener>
  );
};


export default CellEditCopy