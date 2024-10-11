import { useEffect, useState } from "react"
import { CiHeart } from "react-icons/ci";
import { BsCake } from "react-icons/bs";
import { LiaRingSolid } from "react-icons/lia";
import { useTranslation } from 'react-i18next';
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { EventContextProvider } from "../../context";
import { Itinerary } from "../../utils/Interfaces"


export const BoddyIter = () => {
    const { t } = useTranslation();
    const { event } = EventContextProvider()
    const [optionSelect, setOptionSelect] = useState<Itinerary>(event.itinerarios_array.length && event.itinerarios_array[0])

    const handleClickOption = (idx) => {
        setOptionSelect(idx);
    };

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
            <ItineraryTabs DataOptionsArry={event.itinerarios_array.filter(elem => !!elem?.title)} optionSelect={optionSelect} onClick={setOptionSelect} />
            {/* <ItineraryPanel data={OptionsArry.find(elem => elem.title === optionSelect)} /> */}
        </div>
    )
}