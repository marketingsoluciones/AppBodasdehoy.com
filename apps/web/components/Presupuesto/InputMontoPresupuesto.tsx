import { FC, useEffect, useRef, useState } from "react";
import { EventContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { useAllowed } from "../../hooks/useAllowed";
import { getCurrency } from "../../utils/Funciones";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { estimate } from "../../utils/Interfaces";

interface Props {
  title: string
}

export const InputMontoPresupuesto: FC<Props> = ({ title }) => {
  const inputRef = useRef(null)
  const { event, setEvent } = EventContextProvider()
  const [modificar, setModificar] = useState(false);
  const [isAllowed, ht] = useAllowed()
  const [lastvalue, setLastValue] = useState<string>(event?.presupuesto_objeto[title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"]?.toFixed(2))
  const [value, setValue] = useState<string>(event?.presupuesto_objeto[title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"]?.toFixed(2))
  const { t } = useTranslation();

  useEffect(() => {
    setLastValue(event?.presupuesto_objeto[title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"]?.toFixed(2))
    setValue(event?.presupuesto_objeto[title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"]?.toFixed(2))
  }, [event])


  const handle = () => {
    try {
      if (lastvalue !== value) {
        setLastValue(value)
        fetchApiEventos({
          query: queries.editPresupuesto,
          variables: {
            evento_id: event?._id,
            [`${title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"}`]: parseFloat(value !== "" ? value : "0")
          }
        }).then(result => {
          setModificar(false)
          event.presupuesto_objeto = result as estimate
          setEvent({ ...event })
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <ClickAwayListener onClickAway={() => {
      setModificar(false)
      if (lastvalue !== value) {
        setValue(lastvalue)
      }
    }}>
      <div className="w-1/2 px-2" >
        <div className="font-display text-gray-500 font-light text-md grid place-items-center h-10">
          <span className="w-full flex justify-center text-center text-sm leading-tight">{t(title)}</span>
        </div>
        {modificar
          ? <input
            ref={inputRef}
            type="number"
            min={0}
            value={!!value ? value : ""}
            onChange={(e) => {
              e.preventDefault();
              setValue(e.target.value)
            }}
            onKeyDown={(e) => {
              let tecla = e.key.toLowerCase();
              if (tecla === "escape") {
                setModificar(false)
                setValue(lastvalue)
              }
              if (tecla === "e") {
                e.preventDefault()
              }
              if (tecla === "+") {
                e.preventDefault()
              }
              if (tecla === "-") {
                e.preventDefault()
              }
              if (tecla == "enter" || tecla == "tab") {
                handle();
              }

            }}
            className="font-display w-full appearance-none text-gray-500 font-semibold text-lg text-center border-b h-[39px] focus:ring-0 focus:outline-none border-gray-200 rounded-lg"
          />
          : <div className="font-display w-full flex justify-center text-gray-500 font-semibold text-lg text-center">
            <span className="flex justify-center items-center min-w-36 h-10">
              {event?.presupuesto_objeto?.viewEstimates && getCurrency(parseFloat(value !== "" && typeof value === "string" ? value : "0"))}
            </span>
          </div>
        }
        <button
          onClick={() => {
            if (!isAllowed()) {
              ht()
            } else {
              setModificar(!modificar)
              if (!modificar) {
                setTimeout(() => {
                  inputRef.current.focus()
                }, 10);
              } else {
                handle()
              }
            }
          }}
          className="w-full border-primary border font-display focus:outline-none text-primary px-1 text-xs bg-white py-1 rounded-lg my-2 hover:bg-primary hover:text-white transition"
        >
          {modificar ? "Aceptar" : title === "Presupuesto Total" ? t("Modificar total") : t("Modificar costes")}
        </button>
      </div>
    </ClickAwayListener >

  )
}