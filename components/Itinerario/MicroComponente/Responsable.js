import { Modal } from "../../Utils/Modal";
import { AddUser } from "../../icons"
import { ResponsableList } from "./ResponsableList"
import { useEffect, useState } from "react"
import { useField } from "formik";

const ResponsablesArry = [
    {
        icon: "/rol_Decorador.png",
        title: "Decorador",
    },
    {
        icon: "/rol_Fotografo.png",
        title: "Fotográfor",
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

export const Responsable = ({ itinerario, handleChange, title, task, ...props }) => {
    const [field, meta, helpers] = useField({ name: props?.name });
    const [selectIcon, setSelectIcon] = useState([])
    const [openResponsableList, setOpenResponsableList] = useState(false)
    const [FieldArry, setFieldArry] = useState([])

    console.log(selectIcon)

    useEffect(() => {
        if (field.value.length > 1) {
            setFieldArry(field?.value?.slice(0, 2))

        }
        if (field.value.length <= 1) {
            setFieldArry(field?.value)
        }
    }, [selectIcon, field?.value])

    useEffect(() => {

        helpers.setValue(selectIcon.map((item) => item.title))
        handleChange("responsable", selectIcon.map((item) => item.title))

    }, [selectIcon])

    const longitud = field?.value.length

    return (
        <div
            style={{ paddingRight: field?.value?.length + 5, marginRight: -5.5 * field.value.length }}
            className="flex justify-center items-center pl-1 "
        >
            {field?.value.length > 0
                ?
                <div
                    style={{ width: field.value.length >= 3 ? 47 * FieldArry?.length : FieldArry.length == 1 ? 63 * FieldArry?.length : 35 * FieldArry?.length }}
                    className=" cursor-pointer relative -mr-5 my-5 md:my-0">
                    {

                        FieldArry?.map((item, idx) => {
                            return (
                                < div
                                    key={idx}
                                    style={{ left: 15 * idx }}
                                    className=" cursor-pointer absolute border border-gray-400  rounded-full shadow-lg -top-5  "
                                    onClick={() => {
                                        setOpenResponsableList(!openResponsableList)
                                    }} {...props}>
                                    <img src={ResponsablesArry.find((elem) => elem?.title === item)?.icon} className="h-10 " />
                                </div>
                            )
                        })
                    }
                    {
                        field?.value?.length > 2 ? (
                            < div
                                style={{ left: 30 }}
                                className="w-11 h-11 cursor-pointer absolute border border-gray-400  rounded-full shadow-lg -top-5 bg-slate-100  flex items-center  justify-center"
                                onClick={() => {
                                    setOpenResponsableList(!openResponsableList)
                                }} {...props}>
                                {"+" + longitud}
                            </div>
                        ) :
                            null
                    }
                </div>
                :
                <div onClick={() => setOpenResponsableList(!openResponsableList)} className="w-full h-full rounded-full flex justify-center cursor-pointer text-gray-600 hover:text-gray-800 ">
                    <AddUser className="w-10 md:w-8 lg:w-10 h-10 md:h-8 lg:h-10" />
                </div>
            }
            {
                openResponsableList
                    ? <Modal openIcon={openResponsableList} setOpenIcon={setOpenResponsableList} classe={"h-max w-[80%] md:w-[18%]"} >
                        <ResponsableList DataArry={ResponsablesArry} openModal={openResponsableList} setOpenModal={setOpenResponsableList} setSelectIcon={setSelectIcon} value={field.value} />
                    </Modal>
                    : null
            }
        </div >
    )
}