import { FC } from "react"
import { optionArryOptions } from "../../pages/invitaciones"

interface propsOptionsMenu {
    arryOptions: optionArryOptions[],
    optionSelect: number,
    onClick: CallableFunction
}

export const OptionsMenu: FC<propsOptionsMenu> = ({ arryOptions, optionSelect, onClick }) => {
    return (
        <>
            <div className="  rounded-xl overflow-auto  ">
                <div className=" flex items-center justify-between bg-primary h-20 rounded-xl overflow-auto  ">
                    {arryOptions.map((item, idx) => (
                        <button key={idx} onClick={() => onClick(idx)} className={`${optionSelect === idx ? "bg-white text-primary" : "text-white"} text-sm font-body flex flex-col items-center justify-center w-[20%] px-4  mx-4 py-3 rounded-xl`}>
                            {item.icon}
                            {item.title}
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}