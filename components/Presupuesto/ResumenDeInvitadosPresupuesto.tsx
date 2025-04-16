import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { EditableLabelWithInput } from "../Forms/EditableLabelWithInput";

export const ResumenInvitados = ({ }) => {
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const toast = useToast()

    interface asd {
        value: number
        accessor: string
    }

    const handleOnBlur = ({ value, accessor }: asd) => {
        try {
            fetchApiEventos({
                query: queries.editTotalStimatedGuests,
                variables: {
                    evento_id: event._id,
                    adults: event?.presupuesto_objeto?.totalStimatedGuests.adults,
                    children: event?.presupuesto_objeto?.totalStimatedGuests.children,
                    [accessor]: value,
                }
            }).then(() => {
                event.presupuesto_objeto.totalStimatedGuests[accessor] = value
                setEvent({ ...event })
                toast("success", t("suscess"))
            })
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div style={{ minWidth: '100px' }} className="  gap-1 CuadroInvitados flex flex-col  items-center justify-center h-full w-full md:p-2 mt-1 rounded-md shadow-md bg-white">
            <div className="flex flex-col gap-1. items-center justify-end ">
                <p className="font-display font-semibold text-2xl md:text-4xl text-primary">
                    {event?.presupuesto_objeto?.totalStimatedGuests?.adults + event?.presupuesto_objeto?.totalStimatedGuests?.children}
                </p>
                <p className="font-display text-sm md:text-[16px] text-primary capitalize">{t("Invitados")} estimados</p>
            </div>
            <div className="flex flex-col justify-center w-28">
                <EditableLabelWithInput value={event?.presupuesto_objeto?.totalStimatedGuests?.adults} type="int" handleChange={handleOnBlur} accessor="adults" textAlign="center" />
                <EditableLabelWithInput value={event?.presupuesto_objeto?.totalStimatedGuests?.children} type="int" handleChange={handleOnBlur} accessor="children" textAlign="center" />
            </div>
        </div>
    )
}