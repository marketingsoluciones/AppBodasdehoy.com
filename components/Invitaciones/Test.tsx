import { Formik, Form, useFormikContext } from "formik";
import { AuthContextProvider } from "../../context/AuthContext";
import { EventContextProvider } from "../../context/EventContext";
import InputField from "../Forms/InputField";
import { IconLightBulb16 } from "../icons";
import * as yup from "yup";
import { phoneUtil, useAuthentication } from "../../utils/Authentication";
import { fetchApiBodas, fetchApiEventos, queries } from "../../utils/Fetching";
import { Dispatch, FC, SetStateAction, useEffect, useState, useCallback } from "react";
import { ActivatorPremium } from "../ActivatorPremium";
import { Tooltip } from "../Utils/Tooltip";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import ButtonPrimary from "./ButtonPrimary";
import ModalDefault from "./ModalDefault";
import { ModalTemplates } from "./ModalTemplates";
import { detalle_compartidos_array, TemplateDesign } from "../../utils/Interfaces";
import ButtonSecondary from "./ButtonSecondary";
import i18next from "i18next";
import { FaWhatsapp, FaCreditCard } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { WhatsappSetupComponent } from "./WhatsappSetupComponent";
import { WhatsAppRechargeComponent } from "./WhatsAppRechargeComponent";
import { WhatsAppSession } from "./whatsappSetupComponents";
import { SocketContextProvider } from "../../context";

export type TitleComponent = "email" | "whatsapp" | "sms" | "diseño"

type Props = {
  TitleComponent: TitleComponent
  setEmailEditorModal: (value: boolean) => void
  setPreviewEmailReactEditor: (value: boolean) => void
  optionSelect: string
}

export const Test: FC<Props> = ({ TitleComponent, setEmailEditorModal, setPreviewEmailReactEditor, optionSelect }) => {
  const { t } = useTranslation();
  const { geoInfo } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const { isPhoneValid } = useAuthentication()
  const [valirReset, setValirReset] = useState(false)
  const [showModalTemplate, setShowModalTemplate] = useState(false)
  const toast = useToast()
  const [isAllowed, ht] = useAllowed()
  const [templateName, setTemplateName] = useState<string>()
  const [showModalSetupWhatsapp, setShowModalSetupWhatsapp] = useState(false)
  const { user, config } = AuthContextProvider();
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [dupplicatingConnection, setDupplicatingConnection] = useState<{ state: boolean, user: detalle_compartidos_array }>({ state: false, user: undefined })
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const { socket } = SocketContextProvider()
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [showModalRecharge, setShowModalRecharge] = useState(false)
  const [currentMessages, setCurrentMessages] = useState<number>(258) // Estado para mensajes disponibles


  // Limpiar estados de WhatsApp al cambiar de opción
  useEffect(() => {
    if (optionSelect !== "whatsapp") {
      // Limpiar estados cuando no es whatsapp
      setSession(null);
      setQrCode(null);
      setDupplicatingConnection({ state: false, user: undefined });
      setCheckingConnection(false);
      setError(null);
      setLoading(false);
    }
  }, [optionSelect])

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    if (event?.templateEmailSelect && optionSelect === "email") {
      fetchApiEventos({
        query: queries.getVariableEmailTemplate,
        variables: {
          template_id: event?.templateEmailSelect,
          selectVariable: "configTemplate"
        },
      }).then((res: any) => {
        setTemplateName(res?.configTemplate?.name)
      })
    } else if (event?.templateWhatsappSelect && optionSelect === "whatsapp") {
      fetchApiEventos({
        query: queries.getWhatsappInvitationTemplates,
        variables: {
          evento_id: event?._id
        },
      }).then((res: any) => {
        setTemplateName(res?.templateName)
      })
    } else {
      setTemplateName("")
    }
  }, [event?.templateEmailSelect, event?.fecha_actualizacion, event?.updatedAt, optionSelect])

  const initialValues = {
    email: "",
    phoneNumber: `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`
  }

  // Manejo del socket - solo para WhatsApp
  useEffect(() => {
    if (optionSelect !== "whatsapp") return;

    const handleMessage = async (msg: any) => {
      if (msg?.payload?.action === "qrCode") {
        setQrCode(msg?.payload?.value);
        setLoading(false);
      }
      if (msg?.payload?.action === "whatsapp_deleted") {
        try {
          setQrCode(null);
          setSession(null);
          setPhoneNumber('');
          setCheckingConnection(false);
          setError(null);
          setLoading(false);
        } catch (error) {
          console.error('Error al desconectar la sesión:', error);
        }
      }
      if (msg?.payload?.action === "connected") {
        setQrCode(null);
        setLoading(false);
        setSession(msg?.payload?.value);
        setCheckingConnection(true);
      }
    }

    socket?.on("app:message", handleMessage)
    return () => {
      socket?.off("app:message", handleMessage)
    }
  }, [socket, optionSelect]);

  // Generar sessionId único basado en el evento - solo para WhatsApp
  useEffect(() => {
    if (optionSelect === "whatsapp" && event?._id && user?.uid) {
      const uniqueSessionId = `${event._id}`;
      setSessionId(uniqueSessionId);
    }
  }, [event, user, optionSelect]);

  const checkExistingSession = useCallback(async () => {
    if (!sessionId || !config?.development || optionSelect !== "whatsapp") return;
    try {
      setLoading(true);
      const result = await fetchApiBodas({
        query: queries.whatsappGetSession,
        variables: {
          args: {
            sessionId
          }
        },
        development: config.development
      });

      if (result) {
        setSession(result);
        if (result.isConnected) {
          setQrCode(null);
        } else if (result.qrCode) {
          if (result.userId !== user?.uid) {
            setQrCode(null);
            const dupplicatingUser = [event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find(elem => elem.uid === result.userId)
            setDupplicatingConnection({ state: true, user: dupplicatingUser })
          } else {
            setQrCode(result.qrCode);
          }
        }
      }
    } catch (err) {
      console.log('No existe sesión previa', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, config, user, event, optionSelect, setLoading, setSession, setQrCode, setDupplicatingConnection]);

  // Verificar sesión existente - solo para WhatsApp
  useEffect(() => {
    if (optionSelect === "whatsapp") {
      checkExistingSession();
    }
  }, [sessionId, config, showModalSetupWhatsapp, optionSelect, checkExistingSession]);

  const validationSchemaEmail = yup.object().shape({
    email: yup.string().required("Campo requerido").test("Unico", "Correo inválido", async (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "identifier" && !(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value))) {
        return true
      } else {
        return false
      }
    }),
  })

  const validationSchemaPhoneNumber = yup.object().shape({
    phoneNumber: yup.string().test("Unico", `Campo requerido`, (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (value?.length < 4) {
        return false
      } else {
        return true
      }
    }).test("Unico", `Número inválido`, (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "phoneNumber" && value?.length > 3) {
        return isPhoneValid(value)
      } else {
        return true
      }
    })

  })

  const handleClick = async (values) => {
    try {
      fetchApiEventos({
        query: queries.testInvitacion,
        variables: {
          evento_id: event?._id,
          email: optionSelect === "email" ? values.email : undefined,
          phoneNumber: optionSelect === "whatsapp" ? values.phoneNumber : undefined,
          lang: i18next.language
        }
      })
      // setValirReset(true)
      toast("success", t("Invitación enviada"))
    } catch (error) {
      console.log(error)
    }
  }

  const handleChangeTemplate = (template: TemplateDesign) => {
    if (optionSelect === "email") {
      fetchApiEventos({
        query: queries.eventUpdate,
        variables: {
          idEvento: event?._id,
          variable: "templateEmailSelect",
          value: template._id
        }
      })
      setEvent({ ...event, templateEmailSelect: template._id })
      setTemplateName(template.configTemplate.name)
    }
    if (optionSelect === "whatsapp") {
      console.log(100010, template)
      fetchApiEventos({
        query: queries.eventUpdate,
        variables: {
          idEvento: event?._id,
          variable: "templateWhatsappSelect",
          value: template._id
        }
      })
      setEvent({ ...event, templateWhatsappSelect: template._id })
    }

  }
  const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
  const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path



  return (
    <div className="w-full h-full font-display flex flex-col ">
      {showModalSetupWhatsapp && (
        <WhatsappSetupComponent
          setShowModalSetupWhatsapp={setShowModalSetupWhatsapp}
          setSession={setSession}
          setQrCode={setQrCode}
          setLoading={setLoading}
          sessionId={sessionId} session={session}
          dupplicatingConnection={dupplicatingConnection}
          checkingConnection={checkingConnection}
          qrCode={qrCode} loading={loading}
          checkExistingSession={checkExistingSession}
          setError={setError}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          error={error}
        />
      )}
      {showModalRecharge && (
        <WhatsAppRechargeComponent
          setShowModalRecharge={setShowModalRecharge}
          currentMessages={currentMessages}
          onRechargeSuccess={(newTotal) => {
            setCurrentMessages(newTotal);
          }}
        />
      )}
      {showModalTemplate && (
        <ModalDefault onClose={() => setShowModalTemplate(false)}>
          <ModalTemplates action={(template) => { handleChangeTemplate(template as TemplateDesign) }} use={"load"} optionSelect={optionSelect} />
        </ModalDefault>
      )}
      <div className="flex flex-col justify-center items-center ">
        <div className="w-full md:w-[400px] md:h-10 flex flex-col md:flex-row gap-2 md:items-end px-2 ">
          <span className="text-sm text-gray-600 text-primary py-1">{t("template")} {optionSelect === "email" ? t("email") : "Whatsapp"}</span>
          <div className="md:flex-1 h-8 bg-gray-100 rounded-md px-2 py-2 text-sm text-gray-600">
            {templateName ? templateName : "No hay template seleccionado"}
          </div>
        </div>
        <div className={` py-2  justify-center gap-2 items-center px-2 ${isMobile ? "grid grid-cols-2 w-[300px]" : "flex w-[700px]"}`}>
          <ButtonPrimary onClick={(e) => !isAllowed() ? ht() : setShowModalTemplate(true)} >
            {`${event[optionSelect === "email" ? "templateEmailSelect" : "templateWhatsappSelect"] ? t("change") : t("select")} ${t("template")}`}
          </ButtonPrimary>
          <ButtonPrimary onClick={(e) => {
            if (!isAllowed()) {
              ht()
            } else {
              setEmailEditorModal(true)
              setPreviewEmailReactEditor(false)
            }
          }} >
            {t("createOrEdit")}
          </ButtonPrimary>
          <ButtonPrimary disabled={!event[optionSelect === "email" ? "templateEmailSelect" : "templateWhatsappSelect"]} onClick={(e) => {
            if (!isAllowed()) {
              ht()
            } else {
              setEmailEditorModal(true)
              setPreviewEmailReactEditor(true)
            }
          }} >
            {t("preview")}
          </ButtonPrimary>
          {optionSelect === "whatsapp" && (
            <>
              {/* <div className="relative">
                <div className={`absolute w-3 h-3 right-1 top-1.5 rounded-full ${session?.isConnected ? "bg-green" : "bg-gray-300"}`} >
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">{session?.isConnected ? t("connected") : t("disconnected")}</span>
                </div>
                <ButtonPrimary className="w-full" onClick={(e) => setShowModalSetupWhatsapp(true)} >
                  {t("setupWhatsapp")}
                </ButtonPrimary>
              </div> */}
              <ButtonPrimary
                className="flex items-center justify-center space-x-2"
                onClick={(e) => setShowModalRecharge(true)}
              >
                <FaCreditCard className="w-4 h-4" />
                <span>Recargar Saldo</span>
              </ButtonPrimary>
            </>
          )}
        </div>
      </div>
      <div className="flex w-full h-full p-2 justify-center">
        <div className={`h-full flex items-center justify-center  ${isMobile ? "hidden" : ""} `}>
          {TitleComponent === "email" && <HiOutlineMail className="w-2/3 h-2/3 -rotate-12 text-primary -translate-y-4" />}
          {TitleComponent === "whatsapp" && <FaWhatsapp className="w-2/3 h-2/3 text-emerald-500 -rotate-12 -translate-y-4" />}
        </div>
        <div className="">
          <Formik
            validationSchema={TitleComponent === "email" ? validationSchemaEmail : validationSchemaPhoneNumber}
            onSubmit={(values) => handleClick(values)}
            initialValues={initialValues}
          >
            {({ handleChange, values }) => (
              <Form className="md:w-[400px] flex flex-col gap-2 mx-auto items-center">
                <AutoSubmitToken TitelComponent={TitleComponent} valirReset={valirReset} setValirReset={setValirReset} />
                <div className="">
                  <h3 className="font-medium text-gray-500 first-letter:uppercase">{`${TitleComponent} ${t("de prueba")}`}</h3>
                </div>
                {TitleComponent === "email"
                  ? <InputField
                    name="email"
                    label={t("email")}
                    type="email"
                  />
                  : <InputField
                    name="phoneNumber"
                    label={t("phonenumber")}
                    type="telefono"
                    autoComplete="off"
                  />
                }
                <Tooltip
                  label={t("firstyoumust")}
                  icon={<IconLightBulb16 className="w-6 h-6" />}
                  disabled={TitleComponent !== "email" || !!event?.imgInvitacion}>
                  <div className="w-[300px]">
                    <ButtonSecondary
                      onClick={() => !isAllowed() ? ht() : null}
                      type="submit"
                      disabled={
                        TitleComponent === "email"
                          ? !event?.templateEmailSelect
                          : TitleComponent === "whatsapp"
                            ? event?.templateWhatsappSelect ? false : true
                            : !event?.imgInvitacion
                      }
                    >
                      Enviar {TitleComponent} de prueba
                    </ButtonSecondary>
                  </div>
                </Tooltip>
              </Form>
            )}
          </Formik>
        </div>

        {!["email", "whatsapp"].includes(TitleComponent) && <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2 text-sm cursor-default gap-4">
          <ActivatorPremium link={redireccionFacturacion} />
        </div>}
      </div>
    </div>
  );
}
interface AutoSubmitTokenProps {
  TitelComponent: TitleComponent;
  valirReset: boolean;
  setValirReset: (value: boolean) => void;
}

const AutoSubmitToken: FC<AutoSubmitTokenProps> = ({ TitelComponent, valirReset, setValirReset }) => {
  const { resetForm } = useFormikContext();

  useEffect(() => {
    if (valirReset) {
      resetForm()
      setValirReset(false)
    }
  }, [TitelComponent, valirReset, resetForm, setValirReset])

  return null;
};

