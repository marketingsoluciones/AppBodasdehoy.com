import { useField } from "formik";
import { AddIcon, Anillos, FuegosArtificiales, Baile, Baile2, Brindis, Carro, Cena, Cocteles, Comida, Fotografo, Iglesia, Maquillaje, Merienda, Novios, Salida, SesionFotos, Sol, Torta, Vestido, Dress } from "../../icons"
import { Modal } from "../../Utils/Modal";
import { IconList } from "./IconList";
import { useEffect, useState } from "react";

const IconArray = [
    {
        title: "Anillos",
        icon: <Anillos className={"w-full h-full"} />,
    },
    {
        title: "FuegosArtificiales",
        icon: <FuegosArtificiales className={"w-full h-full"} />,
    },
    {
        title: "Baile",
        icon: <Baile className={"w-full h-full"} />,
    },
    {
        title: "Baile2",
        icon: <Baile2 className={"w-full h-full"} />,
    },
    {
        title: "Brindis",
        icon: <Brindis className={"w-full h-full"} />,
    },
    {
        title: "Carro",
        icon: <Carro className={"w-full h-full"} />,
    },
    {
        title: "Cena",
        icon: <Cena className={"w-full h-full"} />
    },
    {
        title: "Cocteles",
        icon: <Cocteles className={"w-full h-full"} />,
    },
    {
        title: "Comida",
        icon: <Comida className={"w-full h-full"} />,
    },
    {
        title: "Fotografo",
        icon: <Fotografo className={"w-full h-full"} />,
    },
    {
        title: "Iglesia",
        icon: <Iglesia className={"w-full h-full"} />,
    },
    {
        title: "Maquillaje",
        icon: <Maquillaje className={"w-full h-full"} />,
    },
    {
        title: "Merienda",
        icon: <Merienda className={"w-full h-full"} />,
    },
    {
        title: "Novios",
        icon: <Novios className={"w-full h-full"} />,
    },
    {
        title: "Salida",
        icon: <Salida className={"w-full h-full"} />,
    },
    {
        title: "SesionFotos",
        icon: <SesionFotos className={"w-full h-full"} />,
    },
    {
        title: "Sol",
        icon: <Sol className={"w-full h-full"} />,
    },
    {
        title: "Torta",
        icon: <Torta className={"w-full h-full"} />,
    },
    {
        title: "Vestido",
        icon: <Vestido className={"w-full h-full"} />,
    },
    {
        title: "Dress",
        icon: <Dress className={"w-full h-full"} />,
    },
]

export const SelectIcon = ({ handleChange, disable, ht, ...props }) => {
    const [field] = useField({ name: props?.name });
    const [selectIcon, setSelectIcon] = useState()
    const [openIcon, setOpenIcon] = useState(false)

    useEffect(() => {
        if (selectIcon) {
            /* helpers?.setValue(selectIcon) */
            handleChange("icon", selectIcon)
        }
    }, [selectIcon])

    return (
        <>
            {field?.value
                ? <div className='w-full h-full cursor-pointer flex justify-center '
                    onClick={() => {
                        disable ? ht() :
                            setOpenIcon(!openIcon)

                    }} {...props}>
                    {IconArray.find((elem) => elem?.title === field?.value).icon}
                </div>
                : <div className='w-full h-full cursor-pointer flex items-center justify-center text-gray-600 hover:text-gray-800' onClick={() => disable ? ht() :
                    setOpenIcon(!openIcon)}>
                    <AddIcon />
                </div>
            }
            {openIcon
                ? <Modal openIcon={openIcon} setOpenIcon={setOpenIcon} classe={"h-max md:w-[30%]"} >
                    <IconList IterArry={IconArray} openIcon={openIcon} setOpenIcon={setOpenIcon} setSelectIcon={setSelectIcon} />
                </Modal>
                : null
            }
        </>
    )
}