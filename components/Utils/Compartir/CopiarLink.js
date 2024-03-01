import { FaCheck, FaRegCopy } from "react-icons/fa";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { PiCheckFatBold } from "react-icons/pi";

export const CopiarLink = ({ link }) => {
    const [copied, setCopied] = useState(false)

    return (
        <div className="flex flex-col space-y-1 w-full">
            <input type="text"
                value={link}
                className="border-[1px] border-gray-300 h-7 w-full text-xs text-gray-700 px-2 py-1 flex items-center rounded-xl" />
            <ClickAwayListener onClickAway={() => { setCopied(false) }}>
                <div>
                    <CopyToClipboard text={link}>
                        <div onClick={() => setCopied(true)} className="text-blue-500 flex space-x-1 items-center cursor-pointer text-sm w-fit">
                            <span>{!copied ? "Copiar enlace" : "Enlace copiado"} </span>
                            {!copied ? <FaRegCopy /> : <PiCheckFatBold />}
                        </div>
                    </CopyToClipboard>
                </div>
            </ClickAwayListener>

        </div>
    )
}