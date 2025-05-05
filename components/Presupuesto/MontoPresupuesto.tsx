import { useEffect } from "react";
import { EventContextProvider } from "../../context";
import { CochinoIcon } from "../icons";
import { Switch } from "../../components/Forms/Switch";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { estimate } from "../../utils/Interfaces";
import { InputMontoPresupuesto } from "./InputMontoPresupuesto";

export const MontoPresupuesto = () => {
  const { event, setEvent } = EventContextProvider()

  useEffect(() => {
    if (event?.presupuesto_objeto && typeof event.presupuesto_objeto.presupuesto_total !== "number" && event.presupuesto_objeto.viewEstimates && event.presupuesto_objeto.coste_estimado) {
      console.log(100051)
      event.presupuesto_objeto.presupuesto_total = event.presupuesto_objeto.coste_estimado
      fetchApiEventos({
        query: queries.editPresupuesto,
        variables: {
          evento_id: event?._id,
          presupuesto_total: event.presupuesto_objeto.coste_estimado
        }
      })
      setEvent({ ...event })
    }
  }, [event?.presupuesto_objeto]);

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
    <div className="flex flex-col w-full items-center relative">
      <Switch isOn={event?.presupuesto_objeto?.viewEstimates} onToggle={(value) => handleChangeViewEstimates(value)} />
      <div className="flex flex-col w-full items-center relative">
        {!event?.presupuesto_objeto?.viewEstimates && <div className="bg-white opacity-50 absolute w-full h-full" />}
        <CochinoIcon className="w-12 h-12 text-gray-500" />
        <div className="w-full flex">
          <InputMontoPresupuesto title={"Presupuesto Total"} />
          <InputMontoPresupuesto title={"Costes Estimados"} />
        </div>

      </div>
    </div>
  );
};