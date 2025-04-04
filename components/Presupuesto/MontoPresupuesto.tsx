import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useAllowed } from "../../hooks/useAllowed";
import { api } from "../../api";
import { CochinoIcon } from "../icons";

export const MontoPresupuesto = ({ estimado }) => {
  const { t } = useTranslation();
  const [modificar, setModificar] = useState(false);
  const [value, setValue] = useState(estimado.toFixed(2));
  const [mask, setMask] = useState();
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()

  useEffect(() => {
    setMask(!!value ? value : 0);
  }, [value, event?.presupuesto_objeto?.currency]);

  const handleChange = (e) => {
    console.log("esto", e.target.value)
    e.preventDefault();
    const r = e.target.value
    if (r >= 0) {
      setValue(parseFloat(e.target.value));
    }
  };

  const keyDown = (e) => {
    let tecla = e.key.toLowerCase();
    (tecla == "enter" || tecla == " ") && handleBlur();
  };

  const handleBlur = async () => {
    const params = {
      query: `mutation {
        editPresupuesto(evento_id:"${event._id}", coste_estimado:${!!value ? value : 0}  ){
          coste_final
          coste_estimado
          pagado
          currency
          categorias_array {
            _id
            coste_proporcion
            coste_estimado
            coste_final
            pagado
            nombre
            gastos_array{
              _id
              coste_proporcion
              coste_estimado
              coste_final
              pagado
              nombre
              pagos_array {
                _id
                estado
                fecha_creacion
                fecha_pago
                fecha_vencimiento
                medio_pago
                importe
              }
              items_array{
                _id
                next_id
                unidad
                cantidad
                nombre
                valor_unitario
                total
                estatus
                fecha_creacion
              }
            }
          }
        }
      }`,
      variables: {},
    }
    let datos;
    try {
      const { data } = await api.ApiApp(params)
      datos = data.data.editPresupuesto
    } catch (error) {
      console.log(error)
    } finally {
      setModificar(false)
      setEvent(old => ({ ...old, presupuesto_objeto: datos }))
    }
  }

  const handleChangeS = (e) => {
    const params = {
      query: `mutation {
        editCurrency(evento_id:"${event._id}", currency:"${e.target.value}"  ){
          currency
        }
      }`,
      variables: {},
    }
    let datos;
    try {
      api.ApiApp(params).then(result => {
        const currency = result.data.data.editCurrency
        setModificar(false)
        const presupuesto_objeto = { ...event.presupuesto_objeto, ...currency }
        console.log("cambio en el monto", presupuesto_objeto)
        event.presupuesto_objeto = presupuesto_objeto
        setEvent({ ...event })
      })
    } catch (error) {
      console.log(error)
    }
  }


  return (
    <>
      <CochinoIcon className="w-12 h-12 text-gray-500 " />
      <p className="font-display text-gray-500 font-light text-md grid place-items-center">
        {t("estimatedbudget")} <br />
      </p>
      {modificar
        ? <input
          type="number"
          min={0}
          value={!!value ? value : ""}
          onBlur={handleBlur}
          onChange={(e) => handleChange(e)}
          onKeyDown={(e) => keyDown(e)}
          className="font-display appearance-none text-gray-500 font-semibold text-lg text-center border-b w-1/2 focus:outline-none border-gray-200"
        />
        : <span className="font-display text-gray-500 font-semibold text-lg text-center">
          {mask}
          <select value={event?.presupuesto_objeto?.currency} className="border-none focus:ring-0 cursor-pointer" onChange={(e) => handleChangeS(e)}  >
            <option value={"eur"}>EUR</option>
            <option value={"usd"}>USD</option>
            <option value={"ves"}>VES</option>
            <option value={"mxn"}>MXN</option>
            <option value={"cop"}>COL</option>
            <option value={"ars"}>ARG</option>
            <option value={"uyu"}>URU</option>

          </select>
        </span>
      }
      <button
        onClick={() => !isAllowed() ? ht() : setModificar(!modificar)}
        className="border-primary border font-display focus:outline-none text-primary text-xs bg-white px-3 py-1 rounded-lg my-2 hover:bg-primary hover:text-white transition"
      >
        {modificar ? "Aceptar" : "Modificar presupuesto"}
      </button>
      <style jsx>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        `}
      </style>
    </>
  );
};