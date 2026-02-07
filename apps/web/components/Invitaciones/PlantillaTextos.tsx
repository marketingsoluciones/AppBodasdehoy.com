import { useState } from "react"
import { DiamanteIcon } from "../icons";
import { useTranslation } from 'react-i18next';

export const PlantillaTextos = ({ optionSelect }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState("")

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="grid grid-cols-1  justify-items-center items-center md:pt-14 pt-7">
            <div className="col-span-1 w-[80%]">
                <div className="flex items-center space-x-2 justify-center  ">
                    <span className="text-[25px] text-primary">{t("writetourinvitation")}</span>
                    <DiamanteIcon className="text-tertiary" />
                </div>
                <p className="text-[13px] indent-3 text-gray-500 pb-2 text-center ">
                    {t("wehopetoseeyousoon")}
                </p>
            </div>
            <div className="relative">
                <img src={`${optionSelect === "whatsapp" ? "/TextoPlantilla.png" : "/SMSPlantilla.png"}`} alt=" foto para la plantilla de los textos" />
                    <textarea
                        style={{ resize: "none" }}
                        rows={9}
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={t("writesomething")}
                        className="w-[225px] text-[13px] rounded-md focus:ring-0 focus:border-none border-none absolute top-[218px] left-[54px] bg-transparent leading-[15px]"
                    />
            </div>
        </div>
    )
}