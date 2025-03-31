import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../../context";
import { useState } from "react";
import { useAllowed } from "../../hooks/useAllowed";
import { InputUpdateInBlur } from "../Forms/inputs/InputUpdateInBlur";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { FaPencilAlt } from "react-icons/fa";
import { useToast } from "../../hooks/useToast";


export const ResumenInvitados = ({ }) => {
    const { event, setEvent } = EventContextProvider()
    const [edit, setEdit] = useState({ type: null, state: false });
    const [values, setValues] = useState({ adults: event?.presupuesto_objeto?.totalStimatedGuests?.adults || 0, children: event?.presupuesto_objeto?.totalStimatedGuests?.children || 0 });
    const [isAllowed, ht] = useAllowed()
    const { t } = useTranslation();
    const [hovered, setHovered] = useState(null)
    const toast = useToast()


    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prevValues) => ({
            ...prevValues,
            [name]: parseInt(value)
        }));
    }

    const keyDown = (e) => {
        let tecla = e.key.toLowerCase();
        if (tecla == "enter") {
            handleBlur(e);
            setEdit({ type: null, state: false });
        }
    };

    const handleBlur = async (e) => {
        try {
            event.presupuesto_objeto.totalStimatedGuests = values
            await fetchApiEventos({
                query: queries.editTotalStimatedGuests,
                variables: {
                    evento_id: event._id,
                    children: values.children,
                    adults: values.adults,
                }
            })
            setEvent({ ...event })
            toast("success", t("suscess"))
        } catch (error) {
            console.log(error);

        }
    }


    return (
        <div style={{ minWidth: '100px' }} className="  gap-1 CuadroInvitados flex flex-col  items-center justify-center h-full w-full  md:p-2 mt-1  rounded-md shadow-md bg-white">
            <div className="flex flex-col gap-1. items-center justify-end ">
                <p className="font-display font-semibold text-2xl md:text-4xl text-primary">
                    {event?.presupuesto_objeto?.totalStimatedGuests?.adults + event?.presupuesto_objeto?.totalStimatedGuests?.children}
                </p>
                <p className="font-display text-sm md:text-[16px] text-primary capitalize">{t("Invitados")} estimados</p>
            </div>
            <div className="flex flex-col  justify-center gap-1 w-full ">
                {edit.type == "adults" && edit.state
                    ?
                    <ClickAwayListener onClickAway={() => setEdit({ type: null, state: false })}>
                        <InputUpdateInBlur name="adults" value={values.adults} onChange={handleChange} onBlur={handleBlur} keyDown={keyDown} type='number' />
                    </ClickAwayListener>
                    : <p
                        onMouseEnter={() => setHovered("adults")}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() =>isAllowed()? setEdit({ type: "adults", state: true }): ht()}
                        className="font-display font-semibold text-xs text-gray-500 flex items-center justify-center gap-1 cursor-pointer capitalize relative"
                    >
                        {event.presupuesto_objeto.totalStimatedGuests.adults}
                        <span className="text-xs font-light">{t("adults")}</span>
                        {hovered === "adults" && <FaPencilAlt className="text-gray-400 ml-1 absolute right-16" />}
                    </p>
                }
                {edit.type == "children" && edit.state
                    ?
                    <ClickAwayListener onClickAway={() => setEdit({ type: null, state: false })}>
                        <InputUpdateInBlur name="children" value={values.children} onChange={handleChange} onBlur={handleBlur} keyDown={keyDown} type='number' />
                    </ClickAwayListener>
                    : <p
                        onMouseEnter={() => setHovered("children")}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => isAllowed() ? setEdit({ type: "children", state: true }) : ht()}
                        className="font-display font-semibold text-xs text-gray-500 flex items-center justify-center gap-1 cursor-pointer capitalize relative"
                    >
                        {event.presupuesto_objeto.totalStimatedGuests.children}
                        <span className="text-xs font-light">{t("childrenandbabies")}</span>
                        {hovered === "children" && <FaPencilAlt className="text-gray-400 ml-1 absolute right-14" />}
                    </p>
                }
            </div>
            <style jsx>
                {`
                    .CuadroInvitados {
                        width: full;
                    }
                    @media only screen and (max-width: 1650px) {
                        .CuadroInvitados {
                        flex-direction: column;
                        
                        }
                    }
                    `}
            </style>
        </div>
    )
}