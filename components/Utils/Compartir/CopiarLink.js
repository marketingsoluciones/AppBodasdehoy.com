import { FaRegCopy } from "react-icons/fa";
export const CopiarLink = () => {
    return (
        <div className="flex flex-col space-y-1 w-full">
            <input type="text"
                value={"http://kjfljsdfjjdsfjldjsf sdjflds"}
                className="border-[1px] border-gray-300 h-7 w-full text-xs text-gray-700 px-2 py-1 flex items-center rounded-xl" />
            <div className="text-blue-500 flex space-x-1 items-center cursor-pointer text-sm">
                <span>Copiar enlace </span>
                <FaRegCopy />
            </div>
        </div>
    )
}