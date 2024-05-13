import { GoSearch } from "react-icons/go";
export const BlockLugarEvento = () => {
    return (
        <div className="bg-primaryOrg space-x-3 rounded-lg text-white flex  items-center  pl-5 shadow-lg font-display text-xl select-none  ">
            <span>Lugar del evento</span>
            <div className="bg-white w-[62.54%] rounded-lg h-full flex items-center justify-end">
                <GoSearch className=" w-6 h-6 text-primaryOrg mr-2 " />
            </div>
        </div>
    )
}