import { useEffect, useState } from "react"
import { CiHeart } from "react-icons/ci";
import { BsCake } from "react-icons/bs";
import { LiaRingSolid } from "react-icons/lia";
import { Itinerario } from "./MicroComponente"
import { useTranslation } from 'react-i18next';
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "../../components/Itinerario/MicroComponente/ItineraryPanel"


export const BoddyIter = ({ setOption }) => {
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
            icon: <BsCake className="w-4 h-4" />,
        },
        {
            title: t("prewedding"),
            icon: <CiHeart className="w-4 h-4" />,
        },
        {
            title: t("thebigday"),
            icon: <LiaRingSolid className="w-4 h-4" />,
        },
        {
            title: t("otromas"),
            icon: <LiaRingSolid className="w-4 h-4" />,
        },

    ]

    return (
        <div className="w-full min-h-[calc(100vh-234px)] flex flex-col items-center bg-white rounded-lg mt-3">
            <ItineraryTabs DataOptionsArry={OptionsArry} optionSelect={optionSelect} onClick={handleClickOption} />
            <ItineraryPanel data={OptionsArry.find(elem => elem.title === optionSelect)} />
        </div>
    )
}