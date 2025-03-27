import { useContext, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { api } from "../../api";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { set } from "date-fns";
import { useToast } from "../../hooks/useToast";
import { string } from "yup";

const CellEditCopy = (props) => {

  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider()
  const [edit, setEdit] = useState(false);
  const [mask, setMask] = useState(0);
  const [value, setValue] = useState();
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
      setMask(getCurrency(value, event?.presupuesto_objeto?.currency));
    }
    if (props?.type == "cantidad") {
      value
    }
  }, [value, event?.presupuesto_objeto?.currency]);

  const keyDown = (e) => {
    let tecla = e.key.toLowerCase();
    if (tecla == "enter") {
      setEdit(false);
      handleBlur();
    }
  };

  const handleChange = (e) => {
    const r = e.target.value?.split(".")
    setValue(r)
  };

  const handleBlur = async (e) => {
    setEdit(false);
    let res;
    if (value !== props?.value) {
      if (props?.table === "principal") {

        try {
          const params = {
            query: `mutation{
                editGasto(evento_id:"${event?._id}", categoria_id: "${props?.categoriaID}", gasto_id: "${props?.row?.original?._id}", variable_reemplazar:"${props?.cell?.column?.id}", valor_reemplazar:"${!!value ? value : "sin datos"}")
                {
                  coste_estimado
                  coste_final
                  pagado 
                  categorias_array{
                    _id,
                    nombre,
                    coste_estimado,
                    coste_final,
                    pagado,
                    gastos_array{
                      _id,
                      nombre,
                      coste_estimado,
                      coste_final,
                      pagado,
                    }
                }
              }
            }`,
            variables: {},
          };
          const { data } = await api.ApiApp(params);
          res = data?.data?.editGasto
        } catch (error) {
          console.log(error);
        } finally {
          setEvent((old) => {
            const index = old?.presupuesto_objeto?.categorias_array?.findIndex(
              (item) => item._id == props.categoriaID
            );
            const idx = old?.presupuesto_objeto?.categorias_array[index]?.gastos_array.findIndex(item => item._id == props?.row?.original?._id)
            old.presupuesto_objeto[props?.cell?.column?.id] = res[props?.cell?.column?.id]
            old.presupuesto_objeto.categorias_array[index][props?.cell?.column?.id] = res?.categorias_array[0][props?.cell?.column?.id]
            old.presupuesto_objeto.categorias_array[index].gastos_array[idx][props?.cell?.column?.id] = res?.categorias_array[0]?.gastos_array[0][props?.cell?.column?.id]
            return { ...old }
          });
          toast("success", t("Partida actualizada con exito"))
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
        }).then((res) => {
          const f1 = res?.categorias_array?.findIndex((item) => item._id == props?.categoriaID)
          const f2 = res?.categorias_array[f1]?.gastos_array.findIndex((item) => item.items_array.some((item) => item._id == props?.row?.original?._id))
          const f3 = res?.categorias_array[f1]?.gastos_array[f2]?.items_array.findIndex((item) => item._id == props?.row?.original?._id)
          const data = res?.categorias_array[f1]?.gastos_array[f2]?.items_array[f3][props?.cell?.column?.id]
          setEvent((old) => {
            const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == props?.categoriaID)
            const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item.items_array.some((item) => item._id == props?.row?.original?._id))
            const f3 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array.findIndex((item) => item._id == props?.row?.original?._id)
            old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3][props?.cell?.column?.id] = data
            return { ...old }
          })
          toast("success", t("item actualizado con exito"))
        })
      }
    }
  };

  return (
    <ClickAwayListener
      onClickAway={() => edit && setEdit(false) && handleBlur()}
    >
      <div >
        {edit ? (
          <input
            type={props.type}
            min={0}
            onBlur={(e) => handleBlur(e)}
            onChange={(e) => handleChange(e)}
            onKeyDown={(e) => keyDown(e)}
            autoFocus
            className="focus:outline-none focus:ring-0 focus:border-none text-center w-full px-2 h-6 text-xs"
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