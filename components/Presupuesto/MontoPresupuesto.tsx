import { useEffect } from "react";
import { EventContextProvider } from "../../context";
import { CochinoIcon } from "../icons";
import { Switch } from "../../components/Forms/Switch";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { estimate } from "../../utils/Interfaces";
import { InputMontoPresupuesto } from "./InputMontoPresupuesto";
import { useAllowed } from "../../hooks/useAllowed";
import { api } from "../../api";

export const MontoPresupuesto = () => {
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()


  useEffect(() => {
    if (event?.presupuesto_objeto && typeof event.presupuesto_objeto.presupuesto_total !== "number" && event.presupuesto_objeto.viewEstimates && event.presupuesto_objeto.coste_estimado) {
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
  const handleChangeS = (e) => {

    const params = {
      query: `mutation {
          editCurrency(evento_id:"${event._id}", currency:"${e.target.value}"  ){
            currency
          }
        }`,
      variables: {},
    }
    try {
      api.ApiApp(params).then(result => {
        const currency = result?.data?.data?.editCurrency?.currency
        event.presupuesto_objeto.currency = currency
        setEvent({ ...event })
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="flex flex-col w-full items-center relative">
      <Switch isOn={event?.presupuesto_objeto?.viewEstimates} onToggle={(value) => handleChangeViewEstimates(value)} />
      <div className="flex flex-col w-full items-center relative">
        {!event?.presupuesto_objeto?.viewEstimates && <div className="bg-white opacity-50 absolute w-full h-full z-30" />}
        <div className="grid grid-cols-2 w-full mt-1 z-40 ">
          <div className="flex items-center justify-center">
            <CochinoIcon className="w-12 h-12 text-gray-500" />
          </div>
          <div className="flex items-center justify-center">
            <select disabled={!isAllowed()} value={event?.presupuesto_objeto?.currency} className={` border-primary rounded-xl focus:ring-0 focus:border-primary ${isAllowed() ? "cursor-pointer" : "cursor-default"} text-sm text-gray-700 h-10`} onChange={(e) => isAllowed() ? handleChangeS(e) : ht()}  >
              <option value={"eur"}>EUR</option>
              <option value={"usd"}>USD</option>
              <option value={"ves"}>VES</option>
              <option value={"mxn"}>MXN</option>
              <option value={"cop"}>COL</option>
              <option value={"ars"}>ARG</option>
              <option value={"uyu"}>URU</option>
            </select>
          </div>
        </div>
        <div className="w-full flex">
          <InputMontoPresupuesto title={"Presupuesto Total"} />
          <InputMontoPresupuesto title={"Costes Estimados"} />
        </div>

      </div>
    </div>
  );
};