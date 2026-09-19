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
    // BUG-16 (informe QA 21-jun): sin guard, evento_id undefined → 400 "Variable
    // $evento_id of required type ID! was not provided" + array errors en consola.
    if (!event?._id) {
      console.warn('[InputMontoPresupuesto] sin event._id, abortar editPresupuesto')
      return
    }

    setIsSubmitting(true)
    try {
      // BUG-CW-N25 v2 (informe QA1 23-jun): fetchApiBodas iba DIRECTO al endpoint
      // api-bodas legacy y se saltaba el adapter MCP_ADAPTERS. El endpoint legacy
      // respondía {success:true} SIN el campo evento{...}, así que el siguiente
      // `if (result?.evento?.presupuesto_objeto)` nunca entraba y la UI no se
      // actualizaba (ni el valor persistía en api-mcp). Cambio a fetchApiEventos
      // que aplica el adapter (apiMcpAdapter.ts:editPresupuesto pass-through a
      // api-mcp con shape correcto: success errors evento{ _id presupuesto_objeto }).
      const result: any = await fetchApiEventos({
        query: queries.editPresupuesto,
        variables: {
          evento_id: event._id,
          datos: { [title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"]: numVal }
        }
      })
      if (result?.evento?.presupuesto_objeto) {
        // BUG-CW-N25 v3 (informe QA1 23-jun re-test v2): api-mcp devuelve un
        // SUBSET de presupuesto_objeto sin `presupuesto_total` ni `viewEstimates`.
        // Si reemplazamos prev.presupuesto_objeto con el subset, perdemos
        // viewEstimates → el render condicionado a viewEstimates muestra BLANK
        // y el useEffect re-setea value="0.00" porque rawVal=undefined.
        //
        // Fix v3: MERGE en lugar de replace y FORZAR el valor recién guardado
        // para que las consultas locales siguientes lo vean aunque el backend
        // no lo incluya en el response.
        const fieldKey = title === "Presupuesto Total" ? "presupuesto_total" : "coste_estimado"
        const formatted = safeFixed(numVal)
        setLastValue(formatted)
        setValue(formatted)
        setEvent((prev: any) => ({
          ...prev,
          presupuesto_objeto: {
            ...(prev?.presupuesto_objeto || {}),
            ...(result.evento.presupuesto_objeto || {}),
            [fieldKey]: numVal,
          } as estimate,
        }))
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
            onFocus={(e) => e.currentTarget.select()}
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
