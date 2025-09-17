import { Formik, Form, useFormikContext } from "formik";
import { AuthContextProvider } from "../../context/AuthContext";
import { EventContextProvider } from "../../context/EventContext";
import InputField from "../Forms/InputField";
import { EmailIcon, IconLightBulb16, WhatsappIcon } from "../icons";
import * as yup from "yup";
import { phoneUtil, useAuthentication } from "../../utils/Authentication";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { FC, useEffect, useState } from "react";
import { ActivatorPremium } from "../ActivatorPremium";
import { Tooltip } from "../Utils/Tooltip";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import ButtonPrimary from "./ButtonPrimary";
import ModalDefault from "./ModalDefault";
import { ModalTemplates } from "./ModalTemplates";
import { TemplateDesign } from "../../utils/Interfaces";
import ButtonSecondary from "./ButtonSecondary";
import i18next from "i18next";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";

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

  const validationSchemaEmail = yup.object().shape({
    email: yup.string().required("Campo requerido").test("Unico", "Correo inválido", async (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "identifier" && !(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value))) {
        // const result = await fetchApiBodas({
        //   query: queries.getEmailValid,
        //   variables: { email: value },
        //   development: config.development
        // })
        // return result?.valid
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
          email: [values.email],
          lang: i18next.language
        }
      })
      setValirReset(true)
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
      fetchApiEventos({
        query: queries.eventUpdate,
        variables: {
          idEvento: event?._id,
          variable: "templateWhatsappSelect",
          value: template._id
        }
      })
    }

  }
  const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
  const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path

  return (
    <div className="w-full h-full font-display flex flex-col space-y-2">
      {showModalTemplate && (
        <ModalDefault onClose={() => setShowModalTemplate(false)}>
          <ModalTemplates action={(template) => { handleChangeTemplate(template as TemplateDesign) }} use={"load"} optionSelect={optionSelect} />
        </ModalDefault>
      )}
      <div className="md:w-max">
        <div className="w-full h-10 flex gap-2 items-end px-2">
          <span className="text-sm text-gray-600 text-primary py-1">{t("template")} {optionSelect === "email" ? t("email") : "Whatsapp"}</span>
          <div className="flex-1 h-8 bg-gray-100 rounded-md px-2 py-2 text-sm text-gray-600">
            {templateName}
          </div>
        </div>
        <div className="w-full h-10 flex justify-end gap-2 items-center px-2">
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
        </div>
      </div>
      <div className="flex w-full h-full p-2">
        <div className="flex-1 h-full flex items-center justify-center">
          {TitleComponent === "email" && <HiOutlineMail className="w-2/3 h-2/3 -rotate-12 text-primary -translate-y-4" />}
          {TitleComponent === "whatsapp" && <FaWhatsapp className="w-2/3 h-2/3 text-emerald-500 -rotate-12 -translate-y-4" />}
        </div>
        <Formik
          validationSchema={TitleComponent === "email" ? validationSchemaEmail : validationSchemaPhoneNumber}
          onSubmit={(values) => handleClick(values)}
          initialValues={initialValues}
        >
          {({ handleChange, values }) => (
            <Form className="md:w-1/2 flex flex-col gap-2 mx-auto">
              <>
                <AutoSubmitToken TitelComponent={TitleComponent} valirReset={valirReset} setValirReset={setValirReset} />
                <h3 className="font-medium text-gray-500 first-letter:uppercase">{`${TitleComponent} ${t("de prueba")}`}</h3>
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
                  <ButtonSecondary
                    onClick={() => !isAllowed() ? ht() : null}
                    type="submit"
                    disabled={
                      TitleComponent === "email"
                        ? !event?.templateEmailSelect
                        : TitleComponent === "whatsapp"
                          ? true
                          : !event?.imgInvitacion
                    }
                  >
                    Enviar {TitleComponent} de prueba
                  </ButtonSecondary>
                </Tooltip>
              </>
            </Form>
          )}
        </Formik>
        <div className="flex-1 h-full p-4">

        </div>
        {!["email", "whatsapp"].includes(TitleComponent) && <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2 text-sm cursor-default gap-4">
          <ActivatorPremium link={redireccionFacturacion} />
        </div>}
      </div>
    </div>

  );
}
const AutoSubmitToken = ({ TitelComponent, valirReset, setValirReset }) => {
  const { resetForm, setValues, values } = useFormikContext();

  useEffect(() => {
    resetForm()
    setValirReset(false)
  }, [TitelComponent, valirReset])

  return null;
};

