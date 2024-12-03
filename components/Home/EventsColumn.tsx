import { ComponentType, FC } from "react";
import { useEffect, useMemo, useState, } from "react";
//import { DotsOpcionesIcon, InvitacionesIcon, PencilEdit } from "../../icons";
//import useHover from "../../../hooks/useHover";
import { ConfirmationBlock } from "../Invitaciones/ConfirmationBlock"
//import { DataTable } from "../../Invitaciones/DataTable"
//import { getRelativeTime } from "../../../utils/FormatTime";
import { useTranslation } from 'react-i18next';
import { boolean } from "yup";
import { IoIosAttach } from "react-icons/io";
//import { GruposResponsablesArry } from "./ResponsableSelector";
//import { ItineraryTable } from "./ItineraryTable";
import ClickAwayListener from "react-click-away-listener";
import { HiOutlineViewList } from "react-icons/hi";
import { LiaIdCardSolid, LiaLinkSolid } from "react-icons/lia";
import { GoEye, GoEyeClosed, GoGitBranch } from "react-icons/go";
import { MdOutlineDeleteOutline } from "react-icons/md";
//import { EditTastk } from "./ItineraryPanel";
import { useAllowed } from "../../hooks/useAllowed";
import { CgSoftwareDownload } from "react-icons/cg";
import { getBytes, getMetadata, getStorage, ref } from "firebase/storage";
import { Itinerary, OptionsSelect } from "../../utils/Interfaces";
/* import { event } from "../../../gtas"; */
/* import { AuthContextProvider, EventContextProvider } from "../../../context"; */
/* import { ImageAvatar } from "../../Utils/ImageAvatar"; */
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
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
    //showEditTask: EditTastk
    setShowEditTask: any
    optionsItineraryButtonBox: OptionsSelect[]
    selectTask: string
    setSelectTask: any
    itinerario: Itinerary
}

interface propsCell {
    data: any
    justifyCenter?: boolean
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