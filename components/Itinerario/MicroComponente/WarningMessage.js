import { AuthContextProvider } from "../../../context"
import { useTranslation } from 'react-i18next';

export const WarningMessage = ({ modal, setModal, title }) => {
    const { t } = useTranslation();
    const { user, config } = AuthContextProvider()

    return (
        <div className="p-10 flex flex-col items-center justify-center h-full space-y-5">
            <div className="capitalize text-primary text-[20px]">
                {title}
            </div>
            <div>
                <span className="text-[15px]"> Estimado/a <span className="capitalize font-semibold">  {user.displayName} </span> .</span><br /><br />
                <p className="text-[14px] w-[350px] ">
                    {t("enablethisspecific")}<sapn className="font-semibold">{t("premium")}</sapn><br /><br />
                    {t("contactwhatsapp")}<br /><br />
                </p>
                {t("kindregards")}<span className="capitalize font-semibold">{config.development}</span>
            </div>
            <div className="flex flex-col space-y-1">

                <button className="bg-primary rounded-lg px-3 py-1 text-white text-[15px]">
                    <a target="blank"  href="https://wa.me/34910603622">
                        {t("contactus")}
                    </a>
                </button>
                <button className="text-primary text-[12px]" onClick={() => setModal(!modal)}>{t("close")}</button>
            </div>
        </div>
    )
}