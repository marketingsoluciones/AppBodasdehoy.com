import { Modal } from "../../Utils/Modal";
import { AddUser } from "../../icons"
import { ResponsableList } from "./ResponsableList"
import { useEffect, useState } from "react"
import { useField } from "formik";
import { EventContextProvider } from "../../../context";

const ResponsablesArry = [
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
    const [selectIcon, setSelectIcon] = useState([])
    const [openResponsableList, setOpenResponsableList] = useState(false)
    const [FieldArry, setFieldArry] = useState([])
    const { event } = EventContextProvider()

    useEffect(() => {
        if (field?.value?.length > 1) {
            setFieldArry(field?.value?.slice(0, 2))

        }
        if (field?.value?.length <= 1) {
            setFieldArry(field?.value)
        }
    }, [selectIcon, field?.value])

    useEffect(() => {
        helpers.setValue(selectIcon?.map((item) => item.title ? item?.title : item?.displayName != null ? item?.displayName : item?.email))
        handleChange("responsable", selectIcon?.map((item) => item.title ? item?.title : item?.displayName != null ? item?.displayName : item?.email))
    }, [selectIcon])

    const longitud = field?.value?.length

    return (
        <div
            /* style={{ marginRight: field?.value?.length  }} */
            className="flex justify-center items-center pl-1 "
        >
            {field?.value?.length > 0
                ?
                <div
                    style={{ paddingRight: field?.value?.length >= 2 ? 20: null }}
                    className=" flex items-center justify-center w-full cursor-pointer relative my-5 md:my-0 h-full">
                    {
                        FieldArry?.map((item, idx) => {
                            return (
                                < div
                                    key={idx}
                                    style={{ right: idx >= 1 ? field.value.length > 1 ? 20 * idx : null : null }}
                                    className=" cursor-pointer absolute border border-gray-400  rounded-full shadow-lg -top-5   "
                                    onClick={() => {
                                        disable ?
                                            ht() :
                                            setOpenResponsableList(!openResponsableList)
                                    }} {...props}>
                                    <img src={ResponsablesArry?.find((elem) => elem?.title === item)?.icon != undefined ? ResponsablesArry.find((elem) => elem?.title === item)?.icon : event?.detalles_compartidos_array.find((elem) => elem?.displayName === item)?.photoURL != null ? event?.detalles_compartidos_array.find((elem) => elem?.displayName === item)?.photoURL : "/placeholder/user.png"} className="h-10 rounded-full " />
                                </div>
                            )
                        })
                    }
                    {
                        field?.value?.length > 2 ? (
                            < div
                                style={{ left: 36 }}
                                className="w-11 h-11 cursor-pointer absolute border border-gray-400  rounded-full shadow-lg -top-5 bg-slate-100  flex items-center  justify-center"
                                onClick={() => {
                                    disable ?
                                        ht() :
                                        setOpenResponsableList(!openResponsableList)
                                }} {...props}>
                                {"+" + longitud}
                            </div>
                        ) :
                            null
                    }
                </div>
                :
                <div onClick={() => disable ? ht() : setOpenResponsableList(!openResponsableList)} className="w-full h-full rounded-full flex justify-center cursor-pointer text-gray-600 hover:text-gray-800 ">
                    <AddUser className="w-10 md:w-8 lg:w-10 h-10 md:h-8 lg:h-10" />
                </div>
            }
            {
                openResponsableList
                    ? <Modal openIcon={openResponsableList} setOpenIcon={setOpenResponsableList} classe={"md:h-[550px] w-[80%] md:w-[270px]"} >
                        <ResponsableList DataArry={ResponsablesArry} openModal={openResponsableList} setOpenModal={setOpenResponsableList} setSelectIcon={setSelectIcon} value={field.value} />
                    </Modal>
                    : null
            }
        </div >
    )
}