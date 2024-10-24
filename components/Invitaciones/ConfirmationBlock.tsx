import { FC, useState } from "react";
import { EventContextProvider } from "../../context";
import { api } from "../../api";
import { OptionsMenu } from "./OptionsMenu";
import { EmailIcon, IconLightBulb16, SmsIcon, WhatsappIcon } from "../icons";
import { optionArryOptions } from "../../pages/invitaciones";
import { ActivatorPremium } from "../ActivatorPremium";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';


export const ConfirmationBlock: FC<any> = ({ arrEnviarInvitaciones, set }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider();
  const [optionSelect, setOptionSelect] = useState("email")
  const [isAllowed, ht] = useAllowed()

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
    const params = {
      query: `mutation enviaInvitacion (
          $evento_id : String,
          $invitados_ids_array : [String],
          $dominio: String,
          $transport: String
        ){
          enviaInvitacion(
            evento_id:$evento_id,
            invitados_ids_array:$invitados_ids_array,
            dominio:$dominio,
            transport:$transport
          ){
            _id,
            invitados_array{
              _id,
              invitacion,
              nombre,
              correo,
              rol,
              chats_array{
                _id,
                tipo
              }
            }
          }
        }        
        `,
      variables: {
        evento_id: event?._id,
        invitados_ids_array: arrEnviarInvitaciones,
        dominio: process.env.NEXT_PUBLIC_BASE_URL,
        transport: optionSelect
      },
    };
    if (event?.imgInvitacion) {
      try {
        await api.ApiApp(params);
      } catch (error) {
        console.log(error);
      } finally {
        setEvent((old) => {
          arrEnviarInvitaciones.forEach((invitado) => {
            const idxInvitado = event?.invitados_array?.findIndex(
              (inv) => inv._id == invitado
            );
            old.invitados_array[idxInvitado] = {
              ...old.invitados_array[idxInvitado],
              invitacion: true,
              fecha_invitacion: new Date().getTime().toString()
            };
          });

          return { ...old };
        });
        set([])
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
          {!event?.imgInvitacion
            ? <div className="flex gap-2 items-center text-emerald-600">
              <span
                onClick={Cancelar}
                className="font-display text-gray-500 hover:text-gray-300 transition cursor-pointer text-2xl absolute top-2 right-3">X</span>
              <IconLightBulb16 className="w-6 h-6" />
              <span>{t("addimageinvitation")}</span>
            </div> :
            <>
              <p className="font-semibold mb-2 first-letter:capitalize">
                {`¿${t("desea enviar")} ${arrEnviarInvitaciones.length} ${arrEnviarInvitaciones.length > 1 ? t("invitaciones") : t("invitación")} ${t("de su evento")}?`}
              </p>
              <span>{t("selectmedia")}</span>
              <div className="grip grid-cols-3 -mt-2">
                <OptionsMenu
                  arryOptions={arryOptions}
                  optionSelect={optionSelect}
                  setOptionSelect={setOptionSelect}
                />
              </div>
              {optionSelect === "email"
                ? <div className="w-full flex gap-10 mt-6 justify-center h-max items-center">
                  <button
                    onClick={() => !isAllowed() ? ht() : handleSendInvitation()}
                    className={`rounded-md font-display w-28 focus:outline-none ${!event?.imgInvitacion ? "bg-gray-300" : "bg-green"} text-white hover:opacity-90 transition py-1`}
                    disabled={!event?.imgInvitacion}
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
                : <div className="text-yellow-500 flex items-center justify-center space-x-1 mt-7 text-sm cursor-default gap-4">
                  <ActivatorPremium link={redireccionFacturacion} />
                </div>
              }
            </>
          }
        </div>
      </div>
    </>
  );
};