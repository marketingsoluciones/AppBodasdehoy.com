import { t } from "i18next";
import Select from 'react-select';
import { GoArrowLeft } from "react-icons/go";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { useEffect, useState } from "react";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { estimate } from "../../utils/Interfaces";
import { useToast } from "../../hooks/useToast";

export const DuplicatePresupuesto = ({ setModal }) => {
    const { config, user } = AuthContextProvider()
    const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [filteredEventsGroup, setFilteredEventsGroup] = useState([])
    const [selectedOption, setSelectedOption] = useState('');
    const toast = useToast();

    useEffect(() => {
        setFilteredEventsGroup(eventsGroup?.filter(elem =>
            elem.usuario_id === user.uid ||
            (elem.usuario_id !== user.uid && elem.permissions?.some(permission => permission.title === "servicios" && permission.value === "edit"))
        ))
    }, [eventsGroup])
    const EventsNombre = filteredEventsGroup.filter((element) => element.nombre != event.nombre).map((elem) => ({
        value: elem.nombre,
        label: elem.nombre,
    }))
    const handleSelectChangee = (selectedOption) => {
        setSelectedOption(selectedOption.value);
    };
    const handleDuplicate = async () => {

        try {
            const eventoSeleccionado = eventsGroup.find((element) => element.nombre === selectedOption)
            const result = await fetchApiEventos({
                query: queries.duplicatePresupuesto,
                variables: {
                    eventID: eventoSeleccionado._id,
                    eventDestinationID: event._id
                },
                domain: config.domain
            }) as estimate
            event.presupuesto_objeto = result
            setEvent({ ...event })
            toast("success", t("successful"));
            setModal(false)
        } catch (error) {
            console.log(error)
        }

    }

    return (
        <div className=" md:w-[650px] bg-white rounded-xl shadow-md truncate.">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 p-4">
                <h2 className="text-lg font-semibold capitalize text-gray-700">Importar presupuesto </h2>
                <button className="text-gray-500" onClick={() => { setModal(false) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 3.293a1 1 0 0 1 1.414 0L10 8.586l5.293-5.293a1 1 0 1 1 1.414 1.414L11.414 10l5.293 5.293a1 1 0 1 1-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L8.586 10 3.293 4.707a1 1 0 0 1 0-1.414z" />
                    </svg>
                </button>
            </div>
            <div className="grid md:grid-cols-11 md:gap-4 px-3 py-6">
                <div className="col-span-5 md:w-[270px] w-[313px]">
                    <label className="text-sm text-gray-500 capitalize"> Importar en</label>
                    <div className="w-full border border-gray-300 cursor-default rounded-md p-[6.5px] text-azulCorporativo capitalize truncate">
                        {event.nombre}
                    </div>
                </div>
                <div className="col-span-1 flex items-center justify-center my-3 md:my-0 md:mt-5 rotate-90 md:rotate-0 w-full ">
                    <GoArrowLeft className="w-5 h-5 " />
                </div>
                <div className="col-span-5 ">
                    <label className="text-sm text-gray-500 capitalize">desde</label>
                    <Select
                        options={EventsNombre}
                        onChange={handleSelectChangee}
                        classNamePrefix="react-select"
                        placeholder={t("seleccionaOpcion") + "..."}

                    />
                </div>
            </div>
            <div className=" text-xs flex justify-end gap-4 border-t border-gray-300 px-4 pb-4 bg-gray-100">
                <button onClick={() => { setModal(false) }} className="bg-gray-400 text-white rounded-md py-2 px-4 mt-4">{t("cancel")}</button>
                <button onClick={() => handleDuplicate()} disabled={!selectedOption} className={`${!selectedOption ? "bg-gray-300" : "bg-primary"} text-white rounded-md py-2 px-4 mt-4 capitalize`}>Importar</button>
            </div>
        </div>
    )
}
