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
        <div className="w-full flex items-center justify-between bg-primary h-[100px] md:h-[60px] py-2">
            {arryOptions.map((item, idx) => (
                <button key={idx} onClick={() => setOptionSelect(item.title)} className={`${optionSelect === item.title ? "bg-white text-primary" : "text-white md:hover:scale-110 transition-all"} text-xs md:text-sm flex flex-col items-center justify-center w-[23%] mx-2 md:mx-6 md:py-1 px-2 rounded-lg md:rounded-xl capitalize md:uppercase`}>
                    {item.icon}
                    {item.title === "diseño" ? t(item.title) : item.title}
                </button>
            ))}
        </div>
    )
}