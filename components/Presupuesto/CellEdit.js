import { useContext, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { Capitalize, getCurrency } from "../../utils/Funciones";

const CellEdit = (props) => {
    const { event, setEvent } = EventContextProvider()
    const [edit, setEdit] = useState(false);
    const [mask, setMask] = useState(0);
    const [value, setValue] = useState();

    useEffect(() => {
      setValue(typeof props?.value == "string" ? Capitalize(props?.value) : props?.value)
    }, [props.value])

    useEffect(() => {
      setMask(getCurrency(value, "EUR"));
    }, [value]);

    const keyDown = (e) => {
      let tecla = e.key.toLowerCase();
      if (tecla == "enter") {
        setEdit(false);
        handleBlur();
      }
    };

    

    const handleChange = (e) => {
      setValue(
        props?.type == "number" ? parseFloat(e.target.value) : e.target.value
      );
    };

    const handleBlur = async () => {
      setEdit(false);
      let res;

      if (value !== props?.value) {
        try {
          const params = {
            query: `mutation{
              editGasto(evento_id:"${event?._id}", categoria_id: "${props?.categoriaID}", gasto_id: "${props?.row?.original?._id}", variable_reemplazar:"${props?.cell?.column?.id}", valor_reemplazar:"${value}")
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
          const { data } = await api.ApiBodas(params);
          res = data?.data?.editGasto
          console.log(res)
          console.log(props?.cell?.column?.id)
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
            

            return {...old }
          
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
              value={value}
              min="0"
              onChange={(e) => handleChange(e)}
              onKeyDown={(e) => keyDown(e)}
              onBlur={handleBlur}
              autoFocus
              step=".10"
              className="focus:outline-none text-center w-full border-b border-gray-200 px-2 py-1 h-full"
            />
          ) : (
            <p className="cursor-pointer hover:scale-105 transform transition text-center w-full truncate px-2 py-1 h-6" onClick={() => setEdit(true)}>
              {typeof value == "string" ? Capitalize(value) : mask}
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