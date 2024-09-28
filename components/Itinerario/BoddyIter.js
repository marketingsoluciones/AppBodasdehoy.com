import { useEffect, useState } from "react"
import { CiHeart } from "react-icons/ci";
import { BsCake } from "react-icons/bs";
import { LiaRingSolid } from "react-icons/lia";
import { MenuOptions, Itinerario } from "./MicroComponente"
import { useTranslation } from 'react-i18next';

export const BoddyIter = ({ IterArryst, setIterArryst, createPdf, setOption }) => {
    const { t } = useTranslation();
    const [optionSelect, setOptionSelect] = useState("el gran día")

    const handleClickOption = (idx) => {
        setOptionSelect(idx);
    };

    useEffect(() => {
        setOption(optionSelect)
    }, [optionSelect])

    const OptionsArry = [
        {
            title: t("protocol"),
            icon: <BsCake />,
        },
        {
            title: t("prewedding"),
            icon: <CiHeart />,
        },
        {
            title: t("thebigday"),
            icon: <LiaRingSolid />,
        },
    ]

    return (
        <>
            <div className="border-4 border-yellow-400 flex flex-col items-center bg-white w-full h-full rounded-lg">
                <MenuOptions DataOptionsArry={OptionsArry} optionSelect={optionSelect} onClick={handleClickOption} />
                <Itinerario data={OptionsArry.find(elem => elem.title === optionSelect)} />
            </div>
        </>
    )
}