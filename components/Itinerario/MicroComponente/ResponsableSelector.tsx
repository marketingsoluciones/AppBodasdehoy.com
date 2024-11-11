import { Modal } from "../../Utils/Modal";
import { AddUser, PlusIcon } from "../../icons"
import { ResponsableList } from "./ResponsableList"
import { FC, InputHTMLAttributes, useEffect, useState } from "react"
import { useField } from "formik";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { useAllowedRouter } from "../../../hooks/useAllowed";
import { MdClose } from "react-icons/md";

export const GruposResponsablesArry = [
    {
        icon: "/rol_Decorador.png",
        title: "Decorador",
    },
    {
        icon: "/rol_Fotografo.png",
        title: "Fotográfo",
    },
    {
        icon: "/rol_Catering.png",
        title: "Catering",
    },
    {
        icon: "/rol_Musica.png",
        title: "Música",
    },
    {
        icon: "/rol_Maquillista.png",
        title: "Maquillista",
    },
    {
        icon: "/rol_novio.png",
        title: "Oficiante",
    },
    {
        icon: "/rol_novia.png",
        title: "Novia",
    },
    {
        icon: "/rol_novio.png",
        title: "Novio",
    },
    {
        icon: "/rol_invitados.png",
        title: "Invitados",
    },
    {
        icon: "/rol_proveedor.png",
        title: "Proveedor",
    },
]

interface props extends InputHTMLAttributes<HTMLInputElement> {
    disable: boolean
    handleChange?: any
}

export const ResponsableSelector: FC<props> = ({ disable, handleChange, ...props }) => {
    const { user } = AuthContextProvider()
    const [isAllowedRouter, ht] = useAllowedRouter()
    const [field, meta, helpers] = useField({ name: props?.name });
    const [selectIcon, setSelectIcon] = useState(field?.value?.map((item) => {
        if (typeof item === "object") {
            return item?.title ? item?.title : item?.displayName != null ? item?.displayName : item?.email
        }
        return item && item
    }))
    const [openResponsableList, setOpenResponsableList] = useState(false)
    const [FieldArry, setFieldArry] = useState([])
    const { event } = EventContextProvider()
    const [showResposables, setShowResposables] = useState(false)
    const [usersList, setUsersList] = useState([])

    useEffect(() => {
        helpers.setValue(selectIcon)
        if (selectIcon?.length > 1) {
            setFieldArry(selectIcon?.slice(0, !showResposables ? 3 : selectIcon.length))
        }
        if (selectIcon?.length <= 1) {
            setFieldArry(selectIcon)
        }
        handleChange("responsable", selectIcon)
    }, [selectIcon, showResposables])

    useEffect(() => {
        setUsersList([user, event?.detalles_usuario_id, ...event?.detalles_compartidos_array])
    }, [event])



    return (
        <div className="flex w-full justify-start">
            {
                false ?
                    field?.value?.length > 0
                        ? <div className="bg-green w-10 h-10 relative">
                            <div
                                style={{ width: !showResposables ? 40 : 42 * FieldArry.length, paddingRight: field?.value?.length >= 2 ? 20 : null }}
                                onMouseEnter={() => (setShowResposables(true))}
                                onMouseLeave={() => (setShowResposables(false))}
                                onClick={() => {
                                    disable
                                        ? ht()
                                        : setOpenResponsableList(!openResponsableList)
                                }}
                                {...props}
                                className="flex cursor-pointer h-10">
                                {FieldArry?.map((item, idx) => {
                                    return (
                                        < div
                                            key={idx}
                                            style={{ left: idx >= 1 ? field.value.length > 1 && !showResposables ? 10 * idx : 41 * idx : null }}
                                            className="bg-white cursor-pointer absolute border border-gray-400 rounded-full shadow-lg -top-5 w-10 h-10 translate-y-1/2 -translate-x-1 flex items-center justify-center transition-all ">
                                            {!showResposables && idx === 2 && selectIcon.length > 3
                                                ? "+" + (selectIcon.length - 2)
                                                : <img src={
                                                    GruposResponsablesArry?.find((elem) => elem?.title === item)?.icon
                                                        ? GruposResponsablesArry.find((elem) => elem?.title === item).icon
                                                        : usersList.find((elem) => elem?.displayName === item)?.photoURL
                                                            ? usersList.find((elem) => elem?.displayName === item).photoURL
                                                            : "/placeholder/user.png"
                                                } className="h-10 rounded-full " />
                                            }
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        : <div onClick={() => disable ? ht() : setOpenResponsableList(!openResponsableList)} className="bg-violet-500 h-full rounded-full flex cursor-pointer text-gray-600 hover:text-gray-800 ">
                            <AddUser className="w-10 md:w-8 lg:w-10 h-10 md:h-8 lg:h-10 bg-white" />
                        </div>
                    : <p className="text-gray-900 leading-[0.8] border-[1px] rounded-md w-full p-1">
                        {field?.value?.map((item, idx) => {
                            return (
                                < div key={idx} className="flex items-center space-x-1 px-1 py-2 md:py-1 hover:bg-gray-200 overflow-hidden rounded-full truncate ">
                                    <img src={
                                        GruposResponsablesArry?.find((elem) => elem?.title === item)?.icon
                                            ? GruposResponsablesArry.find((elem) => elem?.title === item).icon
                                            : usersList.find((elem) => elem?.displayName === item)?.photoURL
                                                ? usersList.find((elem) => elem?.displayName === item).photoURL
                                                : "/placeholder/user.png"
                                    } className=" w-6  h-6 rounded-full overflow-hidden truncate  " />
                                    <span className={`text-sm flex-1 ${usersList.findIndex((elem) => elem?.displayName === item) < 0 && "line-through"}`}>{item}</span>
                                    <div onClick={() => {
                                        field.value.splice(field.value.findIndex(el => el === item), 1)
                                        helpers.setValue([...field.value])
                                    }}
                                        className="w-6 h-5 flex justify-center items-center cursor-pointer p-1">
                                        <MdClose className="hover:text-gray-500" />
                                    </div>
                                </div>
                            )
                        })}
                        <label
                            onClick={() => {
                                disable
                                    ? ht()
                                    : setOpenResponsableList(!openResponsableList)
                            }}
                            className="cursor-pointer">
                            <div className="flex items-center gap-2 m-2 mt-3*">
                                <span className="text-sm select-none">Agregar resposable</span>
                                <PlusIcon className="w-4 h-4 text-primary cursor-pointer" />
                            </div>
                        </label>
                    </p>
            }
            {openResponsableList &&
                <Modal set={setOpenResponsableList} classe={"w-[80%] md:w-[270px] h-3/4 md:h-[550px]"} >
                    <ResponsableList DataArry={GruposResponsablesArry} openModal={openResponsableList} setOpenModal={setOpenResponsableList} setSelectIcon={setSelectIcon} value={field.value} />
                </Modal>
            }
        </div >
    )
}