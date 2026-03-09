import { useTranslation } from 'react-i18next';

export const GuardarButtom = () => {
    const { t } = useTranslation();
    return (
        <>
            <button className="bg-rosa py-1 px-2 text-white rounded-lg my-2">
                {t("save")}
            </button>
        </>
    )
}