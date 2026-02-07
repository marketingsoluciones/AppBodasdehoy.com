import { FC } from "react";

interface props {
    type: any,
    value: any,
    onChange?: any,
    onBlur: any,
    keyDown: any
    name?: any
}


export const InputUpdateInBlur: FC<props> = ({ name, type, value, onChange, onBlur, keyDown }) => {

    return (
        <>
            <input
                name={name}
                type={type}
                min={0}
                onBlur={(e) => onBlur(e)}
                onChange={(e) => onChange(e)}
                onKeyDown={(e) => keyDown(e)}
                value={value}
                autoFocus
                className=" outline-none ring-0 border-none focus:outline-none focus:ring-0 focus:border-none text-center w-full px-2 h-6 text-xs"
            />
            <style jsx>
                {
                    `input {
                        background: transparent;
                        input[type="number"]::-webkit-inner-spin-button,
                        input[type="number"]::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                            }
                    }`
                }
            </style>
        </>
    );
}

