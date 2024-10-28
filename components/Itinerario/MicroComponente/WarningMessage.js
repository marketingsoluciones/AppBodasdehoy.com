import { AuthContextProvider } from "../../../context"
import { useTranslation } from 'react-i18next';

export const WarningMessage = ({ modal, setModal, title }) => {
    const { t } = useTranslation();
    const { user, config } = AuthContextProvider()

    return (
        <div className="p-10 flex flex-col items-center justify-center h-full space-y-5">

        </div>
    )
}