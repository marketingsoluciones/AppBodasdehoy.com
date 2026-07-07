import { GoChecklist } from "react-icons/go";
import { useRouter } from "next/navigation";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';

export const BlockItinerario = () => {
    const { t } = useTranslation();

    const router = useRouter()
    return (
        <div onClick={() => router.push("/itinerario")} className="bg-acento space-x-3 rounded-lg text-gray-500 flex items-center justify-center py-1.5 px-5 shadow-lg font-display text-sm leading-none cursor-pointer">
            <GoChecklist className="w-5 h-5 scale-x-90" />
            <span>{t("seemy")}<span> {t("Itinerary")}</span></span>
        </div>
    )
}
