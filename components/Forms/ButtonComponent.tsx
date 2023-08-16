import { ButtonHTMLAttributes, FC } from "react"


const sizes = {
    sm: "text-sm",
    xs: "text-xs",
    md: "text-md",
    lg : "text-lg"
}

interface propsButton extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: string
    size ? : keyof typeof sizes
    
 }
export const ButtonComponent : FC <propsButton> = ({variant = "primary", size = "sm", children, ...props}) => {
    return (
        <>
        {(() => {

            switch (variant) {
                case "primary":
                    return (
                        <button className={`hover:opacity-90 transition focus:outline-none focus:ring-4 focus:ring-pink-300 font-medium rounded-full ${sizes[size]} px-5 py-2.5 text-center mr-2 mb-2 ${props.disabled ? "text-gray-400 bg-gray-300" : "text-white bg-primary"}`} {...props}>{children}</button>
                    )
                   
                    break;
                case "alternative":
                    return (
                        <button  className={`py-2.5 px-5 mr-2 mb-2 ${sizes[size]} font-medium text-primary bg-white rounded-full border border-primary hover:bg-gray-100 hover:text-pink-600 focus:z-10 focus:ring-2 focus:ring-pink-700 focus:text-pink-700 transition`} {...props}>{children}</button>

                    )
                default:
                    break;
            }

        })()}
        
        </>
    )
}

