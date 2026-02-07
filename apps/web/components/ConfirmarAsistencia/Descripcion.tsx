import { CorazonIcono } from "../icons"
import { useTranslation } from 'react-i18next';

export const DescripcionComponente = () => {
    const { t } = useTranslation();
    const pointsArry = [
        {
            icon: <CorazonIcono />,
            text: t("companionlist")
        },
        {
            icon: <CorazonIcono />,
            text: t("allergictoanyfood")
        },
        {
            icon: <CorazonIcono />,
            text: t("totheevent")
        }
    ]
    return (
        <div className="font-body space-y-5">
            <p className="text-4xl text-secondary font-semibold pt-10  md:px-32">
               {t("specialguest")}
            </p>
            <p className="text-md text-secondary font-regular  md:px-32">
                {t("registerexperience")}
            </p>
            <div className="md:px-32 space-y-4">
                {
                    pointsArry.map((item, idx) => {
                        return (
                            <div key={idx} className="flex items-center gap-2 ">

                                <span className="text-acento">
                                    {item.icon}
                                </span>
                                <p className="text-primary"> {item.text}</p>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}