import { Card } from "./MicroComponente/Card"
import { InfoGrid } from "./MicroComponente/InfoGrid"
import { useTranslation } from 'react-i18next';

export const MasInfo = () => {
    const { t } = useTranslation();

    const DataCards = [
        {
            title: t("weddingplanners"),
            texto: t("addresseverydetail"),
            button: t("createevent"),
            router: "/"
        },
        {
            title: t("cateringspecialists"),
            texto: t("interactwith"),
            button: t("createevent"),
            router: "/"
        },
    ]

    const DataGrid = [
        {
            title: t("photographyandmocialmedia"),
            texto: t("sharethephotos"),
            button: t("ver más"),
            router: "/",
        },
        {
            title: t("manageyourbudget"),
            texto: t("recordeverymove"),
            button: t("ver más"),
            router: "/presupuesto",
        },
        {
            title: t("guestsInvitations"),
            texto: t("designandsendout"),
            button: t("ver más"),
            router: "/invitaciones",
        },

    ]

    return (
        <>
            <div className="space-y-20 font-display">
                <Card DataCards={DataCards} />
                <InfoGrid DataGrid={DataGrid} />
            </div>
        </>
    )
}