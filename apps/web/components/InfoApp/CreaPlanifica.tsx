import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';

export const CreaPlanifica = () => {
    const { t } = useTranslation();
    const router = useRouter()
    return (
        <>
            
                <div className=" h-96 md:h-screen relative md:mb-24 font-display">
                    <img src="/Mask.png" alt="Img banner" className=" " />
                    <div className="absolute md:-bottom-20 -bottom-28 md:inset-x-1/4 px-10">
                        <CuadroInfo />
                    </div>
                </div>
            
        </>
    )

}

export const CuadroInfo = () => {
    const router = useRouter();
    const { t } = useTranslation();
    return (
        <>
            <div className="flex justify-center ">
                <div className="bg-primaryOrg text-center py-10 px-8 rounded-3xl space-y-5">
                    <p className="md:text-3xl text-acento">{t("createplanconquer")}</p>
                    <p className="text-white ">
                        {t("planningorganization")}<br /><br />
                        {t("matterwhatsize")}<br />{t("takethereins")}
                    </p>
                    <button onClick={()=> {router.push("/")}} className="bg-acento text-white py-2 px-3">{t("createfree")}</button>
                </div>
            </div>
        </>
    )
}