import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../../context";

export const ResumenInvitados = ({ }) => {
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const totalSegun = (prop, param) => {
        return event?.invitados_array?.filter((item) => item[prop] == param);
    };
    const ObjInvitado = {
        total: event?.invitados_array?.length,
    };
    return (

        <div style={{ minWidth: '100px' }} className="  gap-4 CuadroInvitados flex  items-center justify-center h-full w-full  md:p-4 mt-1  rounded-md shadow-md bg-white">
            <div className="flex gap-1 items-center justify-end ">
                <p className="font-display font-semibold text-2xl md:text-4xl text-primary">
                    {ObjInvitado?.total}
                </p>
                <p className="font-display text-sm md:text-[16px] text-primary">{t("Invitados")}</p>
            </div>
            <div className="flex flex-col items-start justify-center gap-1 ">
                <p className="font-display font-semibold text-xs text-gray-500 flex gap-1">
                    {totalSegun("grupo_edad", "adulto")?.length}{" "}
                    <span className="text-xs font-light">{t("adults")}</span>
                </p>
                <p className="font-display font-semibold text-xs text-gray-500 flex gap-1">
                    {totalSegun("grupo_edad", "niño")?.length}{" "}
                    <span className="text-xs font-light">{t("childrenandbabies")}</span>
                </p>
            </div>
            <style jsx>
                {`
                    .CuadroInvitados {
                        width: full;
                    }
                    @media only screen and (max-width: 1650px) {
                        .CuadroInvitados {
                        flex-direction: column;
                        
                        }
                    }
                    `}
            </style>
        </div>

    )
}