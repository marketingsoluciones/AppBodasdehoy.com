import { useState } from "react"
import { AuthContextProvider } from "../../context"
import { countries_eur } from "../../utils/Currencies"
import { useTranslation } from 'react-i18next';

export const MetodosDePago = ({ setOptionSelect, stripeCurrency }) => {
    const { t } = useTranslation();
    const { geoInfo } = AuthContextProvider()
    const [currency, setCurrency] = useState(stripeCurrency ?? countries_eur.includes(geoInfo?.ipcountry?.toLowerCase()) ? "eur" : "usd")

    return (
        <div className="flex flex-col items-center w-[500px] border*  rounded-lg p-10 space-y-3 bg-white shadow-lg mt-3">
            <h1 className="text-[18px] font-semibold">{t("nopaymentmethods")}</h1>
            <p className="text-center text-[13px] text-gray-600">{t("youhavenotyetregistered")}</p>
            {!stripeCurrency && <select value={currency} className={`font-display text-gray-500 font-semibold text-lg text-center border-none focus:ring-0 ${true && "cursor-pointer"}`} onChange={(e) => setCurrency(e.target.value)}  >
                <option value={"eur"}>EUR</option>
                <option value={"usd"}>USD</option>
            </select>}
            <button
                onClick={() => setOptionSelect(0)}
                className="bg-primary text-white py-1 px-2 rounded-lg text-[13px]"
            >
                {t("addpaymentmethod")}
            </button>
        </div>
    )
}