import { Modal } from "../../Utils/Modal";
import { AddUser } from "../../icons"
import { ResponsableList } from "./ResponsableList"
import { useEffect, useState } from "react"
import { useField } from "formik";
import { EventContextProvider } from "../../../context";

export const ResponsablesArry = [
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

export const Responsable = ({ disable, itinerario, handleChange, title, task, ht, ...props }) => {
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

    return (
        <div className="flex justify-start items-center pl-1 ">
            {field?.value?.length > 0
                ? <div className="w-10 h-10 relative">
                    <div
                        style={{ width: !showResposables ? 40 : 42 * FieldArry.length, paddingRight: field?.value?.length >= 2 ? 20 : null }}
                        onMouseEnter={() => (setShowResposables(true))}
                        onMouseLeave={() => (setShowResposables(false))}
                        onClick={() => {
                            disable
                                ? ht()
                                : setOpenResponsableList(!openResponsableList)
                        }} {...props}
                        className="flex cursor-pointer h-10">
                        {FieldArry?.map((item, idx) => {
                            if (true)
                                return (
                                    < div
                                        key={idx}
                                        style={{ left: idx >= 1 ? field.value.length > 1 && !showResposables ? 10 * idx : 41 * idx : null }}
                                        className="bg-white cursor-pointer absolute border border-gray-400 rounded-full shadow-lg -top-5 w-10 h-10 translate-y-1/2 -translate-x-1 flex items-center justify-center transition-all ">
                                        {!showResposables && idx === 2 && selectIcon.length > 3
                                            ? "+" + (selectIcon.length - 2)
                                            : <img src={
                                                ResponsablesArry?.find((elem) => elem?.title === item)?.icon
                                                    ? ResponsablesArry.find((elem) => elem?.title === item).icon
                                                    : event?.detalles_compartidos_array.find((elem) => elem?.displayName === item)?.photoURL
                                                        ? event?.detalles_compartidos_array.find((elem) => elem?.displayName === item).photoURL
                                                        : "/placeholder/user.png"
                                            } className="h-10 rounded-full " />
                                        }
                                    </div>
                                )
                        })}
                    </div>
                </div>
                : <div onClick={() => disable ? ht() : setOpenResponsableList(!openResponsableList)} className="w-full h-full rounded-full flex justify-center cursor-pointer text-gray-600 hover:text-gray-800 ">
                    <AddUser className="w-10 md:w-8 lg:w-10 h-10 md:h-8 lg:h-10" />
                </div>
            }
            {openResponsableList &&
                <Modal openIcon={openResponsableList} setOpenIcon={setOpenResponsableList} classe={"md:h-[550px] w-[80%] md:w-[270px]"} >
                    <ResponsableList DataArry={ResponsablesArry} openModal={openResponsableList} setOpenModal={setOpenResponsableList} setSelectIcon={setSelectIcon} value={field.value} />
                </Modal>
            }
        </div >
    )
}