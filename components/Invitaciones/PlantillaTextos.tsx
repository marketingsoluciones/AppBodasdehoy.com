import { useState } from "react"

export const PlantillaTextos = ({ optionSelect }) => {
    const [inputValue, setInputValue] = useState("")

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="grid grid-cols-2 justify-items-center items-center md:pt-14">

            <div className="col-span-1 space-y-3">
                <h1 className="text-[25px] text-primary">Redacta tu Invitación</h1>
                <p className="text-[13px] indent-3 text-gray-500 ">
                    Por favor, redacta tu invitación a continuación. Puedes incluir detalles sobre el evento, la fecha, la ubicación y cualquier otra información relevante. ¡Esperamos verte pronto!
                </p>
                <textarea
                    style={{ resize: "none" }}
                    rows={15}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Escribe algo..."
                    className="w-full h-full rounded-md focus:ring-0 focus:border-black border-gray-300"
                />
            </div>
            <div className="relative">
                <img src={`${optionSelect === "whatsapp" ? "/TextoPlantilla.png" : "/SMSPlantilla.png"}`} alt=" foto para la plantilla de los textos" />
                <p className="absolute top-[218px] left-[65px] max-w-[200px] max-h-[240px] text-wrap overflow-y-auto break-words text-[13px] ">
                    {inputValue}
                </p>
            </div>

        </div>
    )
}