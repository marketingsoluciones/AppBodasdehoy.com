import { useField } from "formik";
import { AddIcon, Anillos, FuegosArtificiales, Baile, Baile2, Brindis, Carro, Cena, Cocteles, Comida, Fotografo, Iglesia, Maquillaje, Merienda, Novios, Salida, SesionFotos, Sol, Torta, Vestido, Dress } from "../../icons"
import { Modal } from "../../Utils/Modal";
import { IconList } from "./IconList";
import { useEffect, useState } from "react";

const IconArray = [
    {
        title: "Anillos",
        icon: <Anillos />,
    },
    {
        title: "FuegosArtificiales",
        icon: <FuegosArtificiales />,
    },
    {
        title: "Baile",
        icon: <Baile />,
    },
    {
        title: "Baile2",
        icon: <Baile2 />,
    },
    {
        title: "Brindis",
        icon: <Brindis />,
    },
    {
        title: "Carro",
        icon: <Carro />,
    },
    {
        title: "Cena",
        icon: <Cena />
    },
    {
        title: "Cocteles",
        icon: <Cocteles />,
    },
    {
        title: "Comida",
        icon: <Comida />,
    },
    {
        title: "Fotografo",
        icon: <Fotografo />,
    },
    {
        title: "Iglesia",
        icon: <Iglesia />,
    },
    {
        title: "Maquillaje",
        icon: <Maquillaje />,
    },
    {
        title: "Merienda",
        icon: <Merienda />,
    },
    {
        title: "Novios",
        icon: <Novios />,
    },
    {
        title: "Salida",
        icon: <Salida />,
    },
    {
        title: "SesionFotos",
        icon: <SesionFotos />,
    },
    {
        title: "Sol",
        icon: <Sol />,
    },
    {
        title: "Torta",
        icon: <Torta />,
    },
    {
        title: "Vestido",
        icon: <Vestido />,
    },
    {
        title: "Dress",
        icon: <Dress />,
    },
]

export const SelectIcon = ({ handleChange, disable,ht, ...props }) => {
    const [field] = useField({ name: props?.name });
    const [selectIcon, setSelectIcon] = useState()
    const [openIcon, setOpenIcon] = useState(false)
    console.log(disable)

    useEffect(() => {
        if (selectIcon) {
            /* helpers?.setValue(selectIcon) */
            handleChange("icon", selectIcon)
        }
    }, [selectIcon])

    return (
        <>
            {field?.value
                ? <div className='w-full  h-full cursor-pointer flex justify-center '
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