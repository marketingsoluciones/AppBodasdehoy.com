import { GoEyeClosed } from "react-icons/go";

export const EstatusItinerario = ({ setModalStatus, modalStatus }: { setModalStatus: (v: boolean) => void; modalStatus: boolean }) => {
    return (
        <div className="flex items-center justify-center cursor-pointer"
            onClick={() => setModalStatus(!modalStatus)}
        >
            <GoEyeClosed className="h-auto w-5" />
        </div>
    )
}