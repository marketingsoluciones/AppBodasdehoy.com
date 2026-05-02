import { FC, useEffect, useRef, useState, useCallback } from "react";
import { EventContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { useAllowed } from "../../hooks/useAllowed";
import { getCurrency } from "../../utils/Funciones";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { estimate } from "../../utils/Interfaces";
import { useToast } from "../../hooks/useToast";

interface Props {
  title: string
}

const safeFixed = (v: any) => (v != null && !isNaN(Number(v))) ? Number(v).toFixed(2) : "0.00"

export const InputMontoPresupuesto: FC<Props> = ({ title }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { event, setEvent } = EventContextProvider()
  const [modificar, setModificar] = useState(false);
  const [isAllowed, ht] = useAllowed()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()
  const raw = event?.presupuesto_objeto?.[title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"]
  const [lastvalue, setLastValue] = useState<string>(safeFixed(raw))
  const [value, setValue] = useState<string>(safeFixed(raw))
  const { t } = useTranslation();

  useEffect(() => {
    const rawVal = event?.presupuesto_objeto?.[title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"]
    setLastValue(safeFixed(rawVal))
    setValue(safeFixed(rawVal))
  }, [event])

  const handleSubmit = useCallback(async (submitValue: string) => {
    if (isSubmitting) return
    const numVal = parseFloat(submitValue)
    if (isNaN(numVal)) return

    setIsSubmitting(true)
    try {
      const result = await fetchApiEventos({
        query: queries.editPresupuesto,
        variables: {
          evento_id: event?._id,
          [`${title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"}`]: numVal
        }
      })
      if (result) {
        const updated = { ...event, presupuesto_objeto: result as estimate }
        setEvent(updated)
        setLastValue(safeFixed(numVal))
        toast("success", t("successfully"))
      }
    } catch (error) {
      toast("error", t("Error al actualizar"))
    } finally {
      setIsSubmitting(false)
      setModificar(false)
    }
  }, [event, setEvent, title, isSubmitting, toast, t])

  const handle = () => {
    if (lastvalue !== value) {
      handleSubmit(value)
    } else {
      setModificar(false)
    }
  }

  return (
    <ClickAwayListener onClickAway={() => {
      if (modificar) {
        setValue(lastvalue)
        setModificar(false)
      }
    }}>
      <div className="w-1/2 px-2" >
        <div className="font-display text-gray-500 font-light text-md grid place-items-center h-10">
          <span className="w-full flex justify-center text-center text-sm leading-tight">{t(title)}</span>
        </div>
        {modificar
          ? <input
            ref={inputRef}
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              const raw = e.target.value
              const cleaned = raw.replace(/,/g, '.')
              if (cleaned === '' || /^\d*\.?\d*$/.test(cleaned)) {
                setValue(cleaned)
              }
            }}
            onKeyDown={(e) => {
              const tecla = e.key.toLowerCase();
              if (tecla === "escape") {
                setValue(lastvalue)
                setModificar(false)
              }
              if (tecla === "enter") {
                e.preventDefault()
                handle()
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
          disabled={isSubmitting}
          onClick={() => {
            if (!isAllowed()) {
              ht()
            } else if (!modificar) {
              setValue(safeFixed(raw))
              setModificar(true)
              setTimeout(() => {
                inputRef.current?.focus()
                inputRef.current?.select()
              }, 10)
            } else {
              handle()
            }
          }}
          className="w-full border-primary border font-display focus:outline-none text-primary px-1 text-xs bg-white py-1 rounded-lg my-2 hover:bg-primary hover:text-white transition"
        >
          {modificar ? (isSubmitting ? t("Guardando...") : t("Aceptar")) : title === "Presupuesto Total" ? t("Modificar total") : t("Modificar costes")}
        </button>
      </div>
    </ClickAwayListener >
  )
}
