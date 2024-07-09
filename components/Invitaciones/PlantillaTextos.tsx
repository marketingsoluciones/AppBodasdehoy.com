import { useState } from "react"
import { DiamanteIcon } from "../icons";

export const PlantillaTextos = ({ optionSelect }) => {
    const [inputValue, setInputValue] = useState("")

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 justify-items-center items-center md:pt-14 pt-7">
            <div className="col-span-1 w-[80%]">
                <div className="flex items-center space-x-2 justify-center md:justify-start ">
                    <span className="text-[25px] text-primary">Redacta tu Invitación</span>
                    <DiamanteIcon className="text-tertiary" />
                </div>
                <p className="text-[13px] indent-3 text-gray-500 pb-2 text-center md:text-left">
                    Por favor, redacta tu invitación a continuación. Puedes incluir detalles sobre el evento, la fecha, la ubicación y cualquier otra información relevante. ¡Esperamos verte pronto!
                </p>
                <textarea
                    style={{ resize: "none" }}
                    rows={25}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Escribe algo..."
                    className="w-full h-full rounded-md focus:ring-0 focus:border-black border-gray-300 leading-[15px] md:block hidden"
                />
            </div>
            <div className="relative">
                <img src={`${optionSelect === "whatsapp" ? "/TextoPlantilla.png" : "/SMSPlantilla.png"}`} alt=" foto para la plantilla de los textos" />
                <p className="absolute top-[218px] left-[65px] max-w-[200px] max-h-[240px] text-wrap overflow-y-auto break-words text-[13px] leading-[18px] hidden md:block ">
                    {inputValue}
                </p>
                <div className="block md:hidden">
                    <textarea
                        style={{ resize: "none" }}
                        rows={9}
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Escribe algo..."
                        className="w-[225px] text-[13px] rounded-md focus:ring-0 focus:border-none border-none absolute top-[218px] left-[54px] bg-transparent leading-[15px]"
                    />

                </div>

            </div>
        </div>
    )
}