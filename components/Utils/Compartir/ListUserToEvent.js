import { IoIosArrowDown } from "react-icons/io";
import { PermissionList } from "../Compartir";
import { useState } from "react";
export const ListUserToEvent = () => {
    return (
        <>
            <div className="flex flex-col space-y-1 mb-5 md:mb-0 ">
                <p className="text-gray-500">Permisos por asignar</p>
                <div className="border rounded-md section overflow-y-auto">
                    <User />
                    <User />
                    <User />
                    <User />
                    <User />
                </div>
            </div>
            <style jsx>
                {`
              .section {
                height: calc(100vh - 400px);
              }
            `}
            </style>
        </>
    )
}

const User = () => {
    const [openModal, setOpenModal] = useState(false)
    return (
        <div className="flex justify-center items-center py-5 px-2 space-x-4 relative">
            <div>
                <img
                    src={"/placeholder/user.png"}
                    className="object-cover w-11 h-11 rounded-full"
                    alt={""}
                />
            </div>
            <div className="flex flex-col text-[15px] cursor-default">
                <span>Eduardo diaz</span>
                <span>Edodch4@gmail.com</span>
            </div>

            <div onClick={() => setOpenModal(!openModal)} className="border text-[13px] p-1 flex items-center space-x-1 cursor-pointer rounded-md ">
                <div>
                    Permisos
                </div>
                <div>
                    <IoIosArrowDown />
                </div>
            </div>
            {
                openModal && (

                    <PermissionList set={setOpenModal} state={openModal} />
                )
            }

        </div>
    )
}
