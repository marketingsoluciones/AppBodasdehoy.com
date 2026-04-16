import { GoEyeClosed } from "react-icons/go";

export const EstatusItinerario = ({ setModalStatus, modalStatus }) => {
    return (
        <div className="flex items-center justify-center cursor-pointer"
            onClick={() => setModalStatus(!modalStatus)}
        >
            <GoEyeClosed className="h-auto w-5" />
        </div>
    )
}