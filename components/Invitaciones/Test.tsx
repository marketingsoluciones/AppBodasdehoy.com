import { Formik, Form, useFormikContext } from "formik";
import { AuthContextProvider, EventContextProvider } from "../../context";
import InputField from "../Forms/InputField";
import { IconLightBulb16 } from "../icons";
import * as yup from "yup";
import { phoneUtil, useAuthentication } from "../../utils/Authentication";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useEffect, useState } from "react";
import { ActivatorPremium } from "../ActivatorPremium";
import { Tooltip } from "../Utils/Tooltip";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';

export type TitleComponent = "email" | "whatsapp" | "sms" | "diseño"

export const Test = ({ TitleComponent, setEmailEditorModal, emailEditorModal, setPreviewEmailReactEditor }: { TitleComponent: TitleComponent, setEmailEditorModal: (value: boolean) => void, emailEditorModal: boolean, setPreviewEmailReactEditor: (value: boolean) => void }) => {
  const { t } = useTranslation();
  const { geoInfo, config } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { isPhoneValid } = useAuthentication()
  const [valirReset, setValirReset] = useState(false)
  const toast = useToast()
  const [isAllowed, ht] = useAllowed()

  const initialValues = {
    email: "",
    phoneNumber: `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`
  }

  const validationSchemaEmail = yup.object().shape({
    email: yup.string().required("Campo requerido").test("Unico", "Correo inválido", async (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "identifier" && !(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value))) {
        const result = await fetchApiBodas({
          query: queries.getEmailValid,
          variables: { email: value },
          development: config.development
        })
        return result?.valid
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

  const handleClick = async (values, actions) => {
    const params = {
      query: `mutation TestInvitacion ($eventoID : String, $email : [String], $linkUrl: String, $imgUrl: String){
          testInvitacion(
            evento_id:$eventoID,
            email:$email,
            linkUrl:$linkUrl,
            imgUrl:$imgUrl
          )
        }        
        `,
      variables: {
        eventoID: event?._id,
        email: [values.email],
        linkUrl: `${process.env.NEXT_PUBLIC_CHAT}`,
        imgUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${event?.imgInvitacion?.i640}`
      },
    };

    try {
      console.log("click",)

      actions.setSubmitting(true)
      // const { data } = await api.ApiApp(params)
      // console.log(data)
      setValirReset(true)
      toast("success", t("Invitación enviada"))
    } catch (error) {
      console.log(error)
    } finally {
      actions.setSubmitting(false)
    }
  }
  const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
  const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path

  return (
    <div className="w-full h-full font-display flex flex-col">
      <div className="w-full h-10 flex gap-2 items-center p-2">
        {/* <button
          onClick={(e) => !isAllowed() ? ht() : handleClick(e, "grupo")}
          className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
        >
          {t("sender-test")}
        </button> */}
        <button
          onClick={(e) => {
            if (!isAllowed()) {
              ht()
            } else {
              setEmailEditorModal(!emailEditorModal)
              setPreviewEmailReactEditor(true)
            }
          }}
          className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
        >
          {t("preview")}
        </button>
        <button
          onClick={(e) => {
            if (!isAllowed()) {
              ht()
            } else {
              setEmailEditorModal(!emailEditorModal)
              setPreviewEmailReactEditor(false)
            }
          }}
          className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
        >
          {t("edit")}
        </button>
      </div>
      <div className="w-full h-full p-2">
        <Formik
          validationSchema={TitleComponent === "email" ? validationSchemaEmail : validationSchemaPhoneNumber}
          onSubmit={(values, actions) => handleClick(values, actions)}
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
                  <button
                    onClick={() => !isAllowed() ? ht() : null}
                    type="submit"
                    disabled={TitleComponent !== "email" || !event?.imgInvitacion}
                    className={`${TitleComponent !== "email" ? "bg-gray-300" : "focus:outline-none hover:opacity-70 transition bg-primary"} text-white rounded-xl text-sm px-5 py-2 mt-4 w-full`}
                  >
                    Enviar {TitleComponent} de prueba
                  </button>
                </Tooltip>
              </>
            </Form>
          )}
        </Formik>
        {TitleComponent !== "email" && <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2 text-sm cursor-default gap-4">
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

