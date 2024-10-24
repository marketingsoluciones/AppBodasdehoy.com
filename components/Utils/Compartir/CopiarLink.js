import { FaCheck, FaRegCopy } from "react-icons/fa";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { PiCheckFatBold } from "react-icons/pi";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { useTranslation } from "react-i18next";

export const CopiarLink = ({ link }) => {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)
console.log(link)
    return (
        <div className="bb-red flex flex-col space-y-1 w-full">
            <input type="text"
                defaultValue={link}
                className="border-[1px] border-gray-300 h-7 w-full text-xs text-gray-700 px-2 py-1 flex items-center rounded-xl" />
            <ClickAwayListener onClickAway={() => { setCopied(false) }}>
                <div>
                    <CopyToClipboard text={link}>
                        <div onClick={() => setCopied(true)} className="text-blue-500 flex space-x-1 items-center cursor-pointer text-sm w-fit">
                            <span>{!copied ? t("copylink") : t("copiedlink")} </span>
                            {!copied ? <FaRegCopy /> : <PiCheckFatBold />}
                        </div>
                    </CopyToClipboard>
                </div>
            </ClickAwayListener>

        </div>
    )
}