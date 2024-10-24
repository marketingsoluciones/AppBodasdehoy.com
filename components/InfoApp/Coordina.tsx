import { useTranslation } from 'react-i18next';

export const Coordina = () => {
    const { t } = useTranslation();
    return (
        <>
            <div className="grid md:grid-cols-2 space-x-10 font-display " >
                <div>
                    <img src="/Pantalla.png" alt="Pantalla" />
                </div>
                <div className="flex flex-col justify-center items-center md:items-start mt-10 md:mt-0 px-10 md:px-0">
                    <p className="md:text-6xl hidden md:block text-secondaryOrg">{t("coordinates")}<br/>{t("yourentireevent")}</p>
                    <p className="text-3xl block md:hidden text-secondaryOrg">{t("coordinateevent")}</p>
                    <p className="text-2xl text-primaryOrg">{t("fromtool")}</p>
                </div>
            </div>
        </>
    )
}