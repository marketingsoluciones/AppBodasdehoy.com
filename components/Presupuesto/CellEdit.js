import { useContext, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { api } from "../../api";
import { EventContextProvider,AuthContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import { useAllowed } from "../../hooks/useAllowed";

const CellEdit = (props) => {
  const { event, setEvent } = EventContextProvider()
  const { currency } = AuthContextProvider()
  const [edit, setEdit] = useState(false);
  const [mask, setMask] = useState(0);
  const [value, setValue] = useState();
  const [isAllowed, ht] = useAllowed()

  useEffect(() => {
    setValue(typeof props?.value == "string" ? capitalize(props?.value) : props?.value)
  }, [props.value])

  useEffect(() => {
    if (props?.type == "text") {
      setMask(value)
    }
    if (props?.type == "number") {
      setMask(getCurrency(value, currency));
    }
  }, [value, currency]);

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

  const handleBlur = async () => {
    setEdit(false);
    let res;
    if (value !== props?.value) {
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
          }
            `,
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
        }
        );
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