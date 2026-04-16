import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';

export const GridButtons = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const DataButton = [
        {
            title: t("wedding"),
            router: "/",
        },
        {
            title: t("anniversaries"),
            router: "/",
        },
        {
            title: t("communions"),
            router: "/",
        },
        {
            title: t("graduations"),
            router: "/",
        },
        {
            title: t("barmitzvah"),
            router: "/",
        },
        {
            title: t("baptism"),
            router: "/",
        },
    ]
    return (
        <>
            <div className="grid md:grid-cols-2  font-display px-10">
                <div className="space-y-3 flex flex-col items-end ">
                    <div>
                        <img src="/logo.png" alt="logo" />
                    </div>
                    <p className="text-right text-2xl md:w-[40%] text-primaryOrg ">
                        {t("makesiteasier")}
                    </p>
                </div>
                <div className="grid md:grid-cols-3 p-14">
                    {
                        DataButton.map((item, idx) => (
                                <button onClick={()=> {router.push("/")}} key={idx} className="text-primaryOrg border-2 m-2 rounded-3xl border-primaryOrg ">
                                    {item.title}
                                </button>
                        ))
                    }
                </div>
            </div>
        </>
    )
}