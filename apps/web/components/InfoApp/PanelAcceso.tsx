import { useTranslation } from 'react-i18next';

export const PanelAcceso = () => {
    const { t } = useTranslation();
    return (
        <>
            <div className="flex flex-col justify-center items-center space-y-10 font-display px-10">
                <p className="text-2xl text-primary">{t("accessto")}</p>
                <div className="grid md:grid-cols-2 justify-items-center md:w-[60%] *gap-5 ">
                    <div className="md:w-[90%]">
                        <p className="text-secondaryOrg">
                            <span className="font-semibold" >{t("managementofyourevents")}</span><br /><br />

                            {t("chargesimultaneously")}<br /><br />

                            <span className="font-semibold">{t("creationwebsite")}</span><br /><br />

                            {t("eachsteptofollow")}<br /><br />

                            <span className="font-semibold">{t("createprivate")}</span><br /><br />
                        </p>
                    </div>
                    <div className="md:w-[90%]">
                        <p className="text-secondaryOrg">
                            <span className="font-semibold" >{t("managementofyourevents")}</span><br /><br />

                            {t("chargesimultaneously")}<br /><br />

                            <span className="font-semibold">{t("creationwebsite")}</span><br /><br />

                            {t("eachsteptofollow")}<br /><br />

                            <span className="font-semibold">{t("createprivate")}</span><br /><br />
                        </p>
                    </div>
                </div>
                <p className="text-primary text-center  ">{t("strategicallymonitoring")}</p>
            </div>
        </>
    )
}