import { IoIosArrowDown } from "react-icons/io";
import { ModalPermissionList, PermissionList } from "../Compartir";
import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";
import { fetchApiBodas, queries } from "../../../utils/Fetching";
export const ListUserToEvent = ({ evento }) => {
    const [sharedUser, setSharedUser] = useState([])
    const { config, user } = AuthContextProvider()
    const [data, setData] = useState([])

    useEffect(() => {
        let asd = []
        asd = evento?.compartido_array
        asd?.push(evento?.usuario_id)
        const f1 = asd?.findIndex((elm) => elm === user?.uid)
        asd?.splice(f1, 1)
        setData([...asd])
    }, [evento])

    useEffect(() => {
        data.map((item) => {
            try {
                fetchApiBodas({
                    query: queries?.getUser,
                    variables: { uid: item },
                    development: config?.development
                }).then((result) => {
                    setSharedUser((old) => {
                        old?.push(result)
                        return [...old]
                    })
                })
            } catch (error) {
                console.log(error)
            }
        })
    }, [data])

    return (
        <>
            <div className="flex flex-col space-y-1 mb-5 md:mb-0 ">
                <p className="text-gray-500">Personas con acceso</p>
                <div className="border rounded-md section overflow-y-auto">
                    {sharedUser?.map((item, idx) => {
                        return (
                            <div key={idx}>
                                <User data={item} />
                            </div>
                        )
                    })}
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

 const User = ({ data }) => {
    const [openModal, setOpenModal] = useState(false)
    return (
        <div className="flex justify-center items-center py-2 px-2 space-x-4 relative">
            <div className="hidden md:block">
                <img
                    src={data?.photoURL != null ? data?.photoURL : "/placeholder/user.png"}
                    className="object-cover w-11 h-11 rounded-full"
                    alt={""}
                />
            </div>
            <div className="flex flex-col text-[15px] cursor-default w-[53%]">
                <span>{data?.displayName}</span>
                <span className="truncate">{data?.email}</span>
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

                    <ModalPermissionList set={setOpenModal} state={openModal} />
                )
            }
        </div>
    )
}
