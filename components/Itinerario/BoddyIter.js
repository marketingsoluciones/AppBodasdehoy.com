import { useEffect, useState } from "react"
import { CiHeart } from "react-icons/ci";
import { BsCake } from "react-icons/bs";
import { LiaRingSolid } from "react-icons/lia";
import { MenuOptions, Itinerario } from "./MicroComponente"

export const BoddyIter = ({ IterArryst, setIterArryst, createPdf, setOption }) => {
    const [optionSelect, setOptionSelect] = useState("el gran día")

    const handleClickOption = (idx) => {
        setOptionSelect(idx);
    };

    useEffect(() => {
        setOption(optionSelect)
    }, [optionSelect])

    const OptionsArry = [
        {
            title: "protocolo",
            icon: <BsCake />,
        },
        {
            title: "preboda",
            icon: <CiHeart />,
        },
        {
            title: "el gran día",
            icon: <LiaRingSolid />,
        },
    ]

    return (
        <>
            <div className="flex flex-col items-center bg-white w-full h-full rounded-lg  ">
                <MenuOptions DataOptionsArry={OptionsArry} optionSelect={optionSelect} onClick={handleClickOption} />
                <Itinerario data={OptionsArry.find(elem => elem.title === optionSelect)} />
            </div>
        </>
    )
}