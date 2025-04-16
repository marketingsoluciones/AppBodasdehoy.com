import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../../context";
import { useAllowed } from "../../hooks/useAllowed";
import { api } from "../../api";
import { CochinoIcon } from "../icons";
import { Switch } from "../../components/Forms/Switch";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { estimate } from "../../utils/Interfaces";

export const MontoPresupuesto = ({ estimado }) => {
  const { t } = useTranslation();
  const [modificar, setModificar] = useState(false);
  const [value, setValue] = useState(estimado?.toFixed(2));
  const [mask, setMask] = useState();
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()

  useEffect(() => {
    setMask(!!value ? value : 0);
  }, [value, event?.presupuesto_objeto]);

  const handleChange = (e) => {
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
    try {
      const result = await fetchApiEventos({
        query: queries.editPresupuesto,
        variables: {
          evento_id: event?._id,
          coste_estimado: !!value ? value : 0
        }
      })
      setModificar(false)
      event.presupuesto_objeto = result as estimate
      setEvent({ ...event })
    } catch (error) {
      console.log(error)
    }

  }

  const handleChangeViewEstimates = async (value: boolean) => {
    try {
      const result = await fetchApiEventos({
        query: queries.editPresupuesto,
        variables: {
          evento_id: event?._id,
          viewEstimates: value
        }
      })
      event.presupuesto_objeto = result as estimate
      setEvent({ ...event })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <div className="flex flex-col w-full items-center relative">
        <Switch isOn={event?.presupuesto_objeto?.viewEstimates} onToggle={(value) => handleChangeViewEstimates(value)} />
        <div className="flex flex-col w-full items-center relative">
          {!event?.presupuesto_objeto?.viewEstimates && <div className="bg-white opacity-50 absolute w-full h-full" />}
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
              className="font-display appearance-none text-gray-500 font-semibold text-lg text-center border-b w-1/2 focus:ring-0 focus:outline-none border-gray-200"
            />
            : <div className="font-display flex justify-center text-gray-500 font-semibold text-lg text-center">
              <span className="flex justify-end items-center min-w-36 h-10">
                {event?.presupuesto_objeto?.viewEstimates && new Intl.NumberFormat(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(parseInt(mask))}
              </span>
            </div>
          }
          <button
            onClick={() => !isAllowed() ? ht() : setModificar(!modificar)}
            className="border-primary border font-display focus:outline-none text-primary text-xs bg-white px-3 py-1 rounded-lg my-2 hover:bg-primary hover:text-white transition"
          >
            {modificar ? "Aceptar" : "Modificar presupuesto"}
          </button>
        </div>
      </div>
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