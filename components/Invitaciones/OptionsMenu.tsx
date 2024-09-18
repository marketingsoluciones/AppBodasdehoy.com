import { FC } from "react"
import { optionArryOptions } from "../../pages/invitaciones"
import { useTranslation } from "react-i18next"

interface propsOptionsMenu {
    arryOptions: optionArryOptions[],
    optionSelect: string,
    setOptionSelect: CallableFunction
}

export const OptionsMenu: FC<propsOptionsMenu> = ({ arryOptions, optionSelect, setOptionSelect }) => {
    const { t } = useTranslation()
    return (


        <div className="w-full flex items-center justify-between bg-primary md:h-20 mt-3 rounded-t-md md:rounded-xl px-3 pt-1 pb-1 translate-y-10 md:translate-y-0">
            {arryOptions.map((item, idx) => (
                <button key={idx} onClick={() => setOptionSelect(item.title)} className={`${optionSelect === item.title ? "bg-white text-primary" : "text-white"} text-xs md:text-sm flex flex-col items-center justify-center w-[25%] md:mx-4 py-1 md:py-3 px-2 rounded-lg md:rounded-xl capitalize md:uppercase`}>
                    {item.icon}
                    {item.title === "diseño" ? t(item.title) : item.title}
                </button>
            ))}
        </div>


    )
}