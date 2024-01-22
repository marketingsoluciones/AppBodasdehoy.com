import { FaRegCopy } from "react-icons/fa";
export const CopiarLink = () => {
    return (
        <div className="flex flex-col space-y-1 w-full ">

            <div className="border h-7 truncate  w-60 px-2 py-1 flex items-center">

                    https://react-iconsssssssssssssssssssssssssssssssssssssssssssssssssssss

            </div>

            <div className="text-blue-500 flex space-x-1 items-center cursor-pointer">
                <p>Copiar enlace </p>
                <FaRegCopy />
            </div>
        </div>
    )
}