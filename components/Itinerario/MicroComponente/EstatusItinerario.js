import { GoEyeClosed } from "react-icons/go";

export const EstatusItinerario = ({ setModalStatus, modalStatus}) => {
    return (
        <div className="flex items-center justify-center text-gray-500 hover:text-gray-800 cursor-pointer"
        onClick={()=>setModalStatus(!modalStatus)}
        >
            <GoEyeClosed className="h-auto w-6" />
        </div>
    )
}