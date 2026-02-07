import { FC, useState } from "react";
import { EventContextProvider } from "../../context/EventContext";
import { api } from "../../api";
import { OptionsMenu } from "./OptionsMenu";
import { EmailIcon, IconLightBulb16, SmsIcon, WhatsappIcon } from "../icons";
import { optionArryOptions } from "../../pages/invitaciones";
import { ActivatorPremium } from "../ActivatorPremium";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import i18next from "i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";


export const ConfirmationBlock: FC<any> = ({ arrEnviarInvitaciones, set, optionSelect }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider();
  /*  const [optionSelect, setOptionSelect] = useState("email") */
  const [isAllowed, ht] = useAllowed()
  const toast = useToast()

  const arryOptions: optionArryOptions[] = [
    {
      title: "email",
      icon: <EmailIcon />,
      state: false
    },
    {
      title: "whatsapp",
      icon: <WhatsappIcon />,
      state: false
    },
    {
      title: "sms",
      icon: <SmsIcon />,
      state: false
    },
  ]

  const Cancelar = () => {
    set([]);
  };


  const handleSendInvitation = async () => {
    if (optionSelect === "email") {
      try {
        fetchApiEventos({
          query: queries.testInvitacion,
          variables: {
            evento_id: event?._id,
            email: arrEnviarInvitaciones,
            lang: i18next.language
          }
        })
        toast("success", t("Invitación enviada"))
      } catch (error) {
        console.log(error)
      }
    }
  };

  const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
  const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path
  return (
    <>
      <div className="bg-black w-full h-full fixed rounded-xl opacity-60 z-20 top-0 left-0" />
      <div className="w-full z-[1000] h-full fixed grid place-items-center p-4 top-0 left-0">
        <div className="bg-white rounded-xl relative w-max md:w-[500px] h-max p-6 z-30 flex flex-col gap-1 text-gray-500">
          {
            <>
              <p className="font-semibold mb-2 first-letter:capitalize">
                {`¿${t("desea enviar")} ${arrEnviarInvitaciones.length} ${arrEnviarInvitaciones.length > 1 ? t("invitaciones") : t("invitación")} ${t("de su evento")}?`}
              </p>
              <span>{t("selectmedia")}</span>
              {/* <div className="grip grid-cols-3 -mt-2">
                <OptionsMenu
                  arryOptions={arryOptions}
                  optionSelect={optionSelect}
                  setOptionSelect={setOptionSelect}
                />
              </div> */}
              {<div className="w-full flex gap-10 mt-6 justify-center h-max items-center">
                <button
                  onClick={() => handleSendInvitation()}
                  className={`rounded-md font-display w-28 focus:outline-none bg-green text-white hover:opacity-90 transition py-1`}

                >
                  {t("accept")}
                </button>
                <button
                  onClick={Cancelar}
                  className="rounded-md font-display w-28 focus:outline-none bg-gray-400 text-white hover:opacity-90 transition py-1"
                >
                  {t("cancel")}
                </button>
              </div>

              }
            </>
          }
        </div>
      </div>
    </>
  );
};