import { useRouter } from "next/router";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../../context";
import { useEffect, useState } from "react";
import { useToast } from "../../../hooks/useToast";
import { Itinerary } from "../../../utils/Interfaces";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { HiArrowSmallRight } from "react-icons/hi2";
import Select from 'react-select';
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "../../Utils/LoadingSpinner";


export const ModalDuplicate = ({ setModalDuplicate, modalDuplicate }) => {
  const router = useRouter()
  const cleanedPath = router.asPath.replace(/\//g, '');
  const { event, setEvent } = EventContextProvider()
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider();
  const { config, user } = AuthContextProvider()
  const [filteredEventsGroup, setFilteredEventsGroup] = useState([])
  const [selectedOption, setSelectedOption] = useState('');
  const { t } = useTranslation();
  const [loading, setloading] = useState<boolean>(false);


  const toast = useToast();


  useEffect(() => {
    setFilteredEventsGroup(eventsGroup?.filter(elem =>
      elem.usuario_id === user.uid ||
      (elem.usuario_id !== user.uid && elem.permissions?.some(permission => permission.title === "servicios" && permission.value === "edit"))
    ))
  }, [eventsGroup])

  const handleDuplicateItinerario = async () => {
    try {
      const eventDestination = eventsGroup.find(elem => elem.nombre === selectedOption)
      if (eventDestination.itinerarios_array.filter(elem => elem.tipo === window?.location?.pathname.slice(1)).length > 9) {
        toast("warning", t("maxLimitedItineraries"));
        setTimeout(() => {
          setModalDuplicate({ state: false })
        }, 4000);
        return
      }
      setloading(true)
      const itinerary: Itinerary = modalDuplicate.data
      const result = await fetchApiEventos({
        query: queries.duplicateItinerario,
        variables: {
          eventID: event._id,
          itinerarioID: itinerary._id,
          eventDestinationID: eventDestination._id,
          storageBucket: config.fileConfig.storageBucket
        },
        domain: config.domain
      }) as Itinerary
      //si es el mismo evento
      if (eventDestination._id === event._id) {
        const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerary._id)
        event.itinerarios_array[f1].next_id = result._id
        event.itinerarios_array.push(result)
        fetchApiEventos({
          query: queries.editItinerario,
          variables: {
            eventID: event._id,
            itinerarioID: itinerary._id,
            variable: "next_id",
            valor: result._id
          },
          domain: config.domain
        })
        const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
        if (event.listIdentifiers[fListIdentifiers].end_Id === itinerary._id) {
          event.listIdentifiers[fListIdentifiers].end_Id = result._id
          fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
              idEvento: event._id,
              variable: "listIdentifiers",
              value: JSON.stringify(event.listIdentifiers)
            }
          })
        }
        setEvent({ ...event })
      }
      //si no es el mismo evento
      if (eventDestination._id !== event._id) {
        const fListIdentifiers = eventDestination?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
        //si no hay itinerarios
        if (!eventDestination.itinerarios_array.length) {
          if (fListIdentifiers === -1) {
            eventDestination.listIdentifiers.push({
              start_Id: result._id,
              end_Id: result._id,
              table: window?.location?.pathname.slice(1)
            })
          } else {
            eventDestination.listIdentifiers[fListIdentifiers].start_Id = result._id
            eventDestination.listIdentifiers[fListIdentifiers].end_Id = result._id
          }
          fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
              idEvento: eventDestination._id,
              variable: "listIdentifiers",
              value: JSON.stringify(eventDestination.listIdentifiers)
            }
          })
        } else {
          // sino es el primero siempre sera el ultimo
          fetchApiEventos({
            query: queries.editItinerario,
            variables: {
              eventID: eventDestination._id,
              itinerarioID: eventDestination.listIdentifiers[fListIdentifiers].end_Id,
              variable: "next_id",
              valor: result._id
            },
            domain: config.domain
          })
          const f1 = eventDestination.itinerarios_array.findIndex(elem => elem._id === eventDestination.listIdentifiers[fListIdentifiers].end_Id)
          eventDestination.itinerarios_array[f1].next_id = result._id
          eventDestination.listIdentifiers[fListIdentifiers].end_Id = result._id
          fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
              idEvento: eventDestination._id,
              variable: "listIdentifiers",
              value: JSON.stringify(eventDestination.listIdentifiers)
            }
          })
        }

        eventDestination.itinerarios_array.push(result)
        setEventsGroup({ type: "INITIAL_STATE", payload: [...eventsGroup] })
      }
      setloading(false)
      setModalDuplicate({ state: false })
      toast("success", t("successful"));
    } catch (error) {
      console.log(error)
    }
  }

  const options = filteredEventsGroup?.map((elem) => ({
    value: elem.nombre,
    label: elem.nombre,
  }));

  const handleSelectChangee = (selectedOption) => {
    setSelectedOption(selectedOption.value);
  };

  return (
    <div className="bg-white rounded-xl shadow-md md:w-[600px] text-xs md:text-sm translate-y-10">
      <LoadingSpinner loading={loading} />
      <div className="flex items-center justify-between border-b border-gray-300 pb-2 p-4">
        <span className="font-semibold capitalize text-gray-700 md:text-lg">{t("duplicar")} {cleanedPath}</span>
        <button className="text-gray-500" onClick={() => { setModalDuplicate({ state: false }) }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.707 3.293a1 1 0 0 1 1.414 0L10 8.586l5.293-5.293a1 1 0 1 1 1.414 1.414L11.414 10l5.293 5.293a1 1 0 1 1-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L8.586 10 3.293 4.707a1 1 0 0 1 0-1.414z" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-11 gap-4 px-3 py-6">
        <div className="col-span-5">
          <label className="md:text-sm text-gray-500 capitalize">{cleanedPath} {t("aDuplicar")}</label>
          <div className="w-full border border-gray-300 cursor-default rounded-md p-[6.5px] text-azulCorporativo capitalize">
            {modalDuplicate.data?.title}
          </div>
        </div>
        <div className="col-span-1 flex items-center justify-center mt-5">
          <HiArrowSmallRight className="w-5 h-5" />
        </div>
        <div className="col-span-5">
          <label className="md:text-sm text-gray-500 capitalize">{t("duplicateIn")}</label>
          <Select
            options={options}
            onChange={handleSelectChangee}
            classNamePrefix="react-select"
            placeholder={t("seleccionaOpcion") + "..."}
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 border-t border-gray-300 px-4 pb-4 bg-gray-100">
        <button onClick={() => { setModalDuplicate({ state: false }) }} className="bg-gray-400 text-white rounded-md py-2 px-4 mt-4">{t("cancel")}</button>
        <button onClick={() => handleDuplicateItinerario()} disabled={!selectedOption} className={`${!selectedOption ? "bg-gray-300" : "bg-primary"} text-white rounded-md py-2 px-4 mt-4 capitalize`}>{t("duplicar")}</button>
      </div>
    </div>
  )
}