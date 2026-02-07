import { AuthContextProvider } from "../../../context"
import { useTranslation } from 'react-i18next';

export const WarningMessage = ({ modal, setModal, title }) => {
    const { t } = useTranslation();
    const { user, config } = AuthContextProvider()

    return (
        <div className="p-10 flex flex-col items-center justify-center h-full space-y-5 relative">
            <div className="absolute top-2 right-4 cursor-pointer hover:scale-110" onClick={()=> setModal(!modal) }>x</div>
            <p className="text-center text-[19px] text-gray-700">{t("Weareexcited")}</p>
            <p className="text-center text-sm text-gray-600">{t("developing")}</p>
            <img src="/Developing.png" alt="Development"/>
        </div>
    )
}