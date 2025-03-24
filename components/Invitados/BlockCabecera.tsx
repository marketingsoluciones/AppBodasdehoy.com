import { CanceladoIcon, ConfirmadosIcon, MesaIcon, PendienteIcon } from "../icons";
import { EventContextProvider } from "../../context";
import { useRouter } from "next/router";
import { Swiper, SwiperSlide } from "swiper/react";
import BlockTitle from "../Utils/BlockTitle";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';


const BlockCabecera = () => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const router = useRouter();
  const [isAllowed, ht] = useAllowed()

  const totalSegun = (prop, param) => {
    return event?.invitados_array?.filter((item) => item[prop] == param);
  };

  const ObjInvitado = {
    total: event?.invitados_array?.length,
  };

  const TotalList = [
    {
      title: `${totalSegun("asistencia", "pendiente")?.length} de ${ObjInvitado?.total
        }`,
      subtitle: "por confirmar",
      icon: <PendienteIcon />,
    },
    {
      title: `${totalSegun("asistencia", "confirmado")?.length} de ${ObjInvitado?.total
        }`,
      subtitle: "confirmados",
      icon: <ConfirmadosIcon />,
    },
    {
      title: `${totalSegun("asistencia", "cancelado")?.length} de ${ObjInvitado?.total
        }`,
      subtitle: "cancelados",
      icon: <CanceladoIcon />,
    },
  ];
  return (
    <>
      <BlockTitle title="Mis invitados" />
      <div className="w-full flex flex-col gap-4 md:grid md:grid-cols-6 md:my-2 py-1 md:border-b-4 md:border-primary relative">

        <div className="absolute* md:static z-10 translate-y-[6px] md:translate-y-0 flex gap-10 items-center justify-center h-full w-full md:col-span-2 md:py-4">
          <div className="flex gap-1 items-center justify-end ">
            <p className="font-display font-semibold text-2xl md:text-4xl text-primary">
              {ObjInvitado?.total}
            </p>
            <p className="font-display text-sm md:text-[16px] text-primary">{t("Invitados")}</p>
          </div>
          <div className="flex flex-col md:gap-1 items-start justify-center h-full col-span-1">
            <p className="font-display font-semibold text-sm md:text-[16px] text-gray-500 flex gap-1">
              {totalSegun("grupo_edad", "adulto")?.length}{" "}
              <span className="text-xs font-light">{t("adults")}</span>
            </p>
            <p className="font-display font-semibold text-sm  md:text-[16px] text-gray-500 flex gap-1">
              {totalSegun("grupo_edad", "niño")?.length}{" "}
              <span className="text-xs font-light">{t("childrenandbabies")}</span>
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl col-span-3 shadow-lg flex *items-end md:items-center pb-1 md:pb-0 w-3/4 md:w-full h-[88px] md:h-auto relative md: justify-between px-8 md:px-4">
          {TotalList.map((item, idx) => (
            <div key={idx} className={`${idx == 0 ? "hidden md:flex" : "flex"} gap-2 items-center justify-center`}>
              {item?.icon}
              <span>
                <p className="font-display md:text-lg font-semibold text-gray-700 leading-5">
                  {t(item?.title)}
                </p>
                <p className="font-display text-xs font-medium text-gray-500">
                  {t(item?.subtitle)}
                </p>
              </span>
            </div>
          ))}
        </div>
        <div className="hidden md:flex w-40 h-40 bg-primary rounded-full col-span-1 absolute right-0 flex-col items-center justify-center z-20">
          <MesaIcon className="text-white" />
          <p className="font-display text-md font-semibold text-white first-letter:capitalize">
            {t("sit")} <span className="font-light">{t("Invitados")}</span>
          </p>
          <button
            onClick={() => !isAllowed("mesas") ? ht() : router.push("/mesas")}
            className="focus:outline-none bg-tertiary rounded-lg text-gray-700 font-display text-sm font-semibold px-2 "
          >
            {t("addtable")}
          </button>
        </div>
      </div>
    </>
  );
};

export default BlockCabecera;
