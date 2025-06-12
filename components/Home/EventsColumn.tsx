import { ComponentType, FC } from "react";
import { useEffect, useMemo, useState, } from "react";
import { ConfirmationBlock } from "../Invitaciones/ConfirmationBlock"
import { useTranslation } from 'react-i18next';
import { Itinerary, OptionsSelect } from "../../utils/Interfaces";
import {  EventsGroupContextProvider } from "../../context";
import { EventsTable } from "./EventsTable";

interface props {
    data?: any[],
    multiSeled?: boolean,
    reenviar?: boolean,
    activeFunction?: any
    setModalStatus: any
    modalStatus: any
    setModalWorkFlow: any
    modalWorkFlow: any
    setModalCompartirTask: any
    modalCompartirTask: any
    deleteTask: any
    setShowEditTask: any
    optionsItineraryButtonBox: OptionsSelect[]
    selectTask: string
    setSelectTask: any
    itinerario: Itinerary
}

export const EventsCollumns: FC<props> = ({  multiSeled = true, reenviar = true, activeFunction,  }) => {
    const { eventsGroup } = EventsGroupContextProvider();
    const { t } = useTranslation();
    const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([])



    const Columna = useMemo(
        () => [
            {
                Header: "color",
                accessor: "color",
                id: "color",
                
            },
            {
                Header: "nombre",
                accessor: "nombre",
                id: "nombre",
                
            },
            {
                Header: "tipo",
                accessor: "tipo",
                id: "tipo",
                
            },  
        ],
        [eventsGroup]
    );

    return (
        <div className="">
            {arrEnviarInvitaciones.length > 0 && (
                <ConfirmationBlock
                    arrEnviarInvitaciones={arrEnviarInvitaciones}
                    set={(act) => setArrEnviatInvitaciones(act)}
                />
            )}
            <EventsTable
                columns={[]}
                data={[]}
                multiSeled={multiSeled}
                setArrEnviatInvitaciones={setArrEnviatInvitaciones}
                reenviar={reenviar}
                activeFunction={activeFunction}
               
            />
        </div>
    );
};