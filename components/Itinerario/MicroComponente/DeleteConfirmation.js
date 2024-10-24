import { useTranslation } from 'react-i18next';

export const DeleteConfirmation = ({ modal, setModal }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
            <p className="text-azulCorporativo mx-8 text-center" >{modal?.title}</p>
            <div className="space-x-5">
                <button onClick={() => setModal({ state: false })} className=" bg-gray-400 h-10 w-24 rounded-lg text-white font-body hover:opacity-80">
                    {t("discard")}
                </button>
                <button onClick={() => modal?.handle()} className=" bg-primary h-10 w-24 rounded-lg text-white font-body  hover:opacity-80">
                    {t("eliminate")}
                </button>
            </div>
        </div>
    )
}