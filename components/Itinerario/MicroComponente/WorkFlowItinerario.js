import { GoGitBranch } from "react-icons/go";

export const WorkFlowItinerario = ({setModalWorkFlow, modalWorkFlow}) => {
    return (
        <div className="text-gray-500 hover:text-gray-800 cursor-pointer"  onClick={()=>setModalWorkFlow(!modalWorkFlow)}>
            <GoGitBranch className="h-auto w-5" />
        </div>
    )
}