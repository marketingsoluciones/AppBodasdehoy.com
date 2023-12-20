import { Formik, ErrorMessage, Form, useFormikContext } from "formik";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { api } from '../../api'
import InputField from "../Forms/InputField";
import { DiamanteIcon, EmailIcon, IconLightBulb16, PhoneMobile } from "../icons";
import * as yup from "yup";
import { phoneUtil, useAuthentication } from "../../utils/Authentication";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ActivatorPremium } from "../ActivatorPremium";
import { Tooltip } from "../Utils/Tooltip";
import { useToast } from "../../hooks/useToast";

export default function Test({ TitelComponent }) {
  const { geoInfo } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { isPhoneValid } = useAuthentication()
  const [valirReset, setValirReset] = useState(false)
  const toast = useToast()

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
      toast("success", "Invitación enviada")
    } catch (error) {
      console.log(error)
    } finally {
      actions.setSubmitting(false)
    }
  }
  const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
  const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path

  return (
    <div className="shadow-md rounded-2xl w-full mx-auto inset-x-0 h-60 py-8 md:p-4 font-display flex flex-col gap-2">
      <Formik
        validationSchema={TitelComponent === "email" ? validationSchemaEmail : validationSchemaPhoneNumber}
        onSubmit={(values, actions) => handleClick(values, actions)}
        initialValues={initialValues}
      >
        {({ handleChange, values }) => (
          <Form className="md:w-1/2 flex flex-col gap-2 mx-auto">
            <>
              <AutoSubmitToken TitelComponent={TitelComponent} valirReset={valirReset} setValirReset={setValirReset} />
              <h3 className="font-medium text-gray-500 first-letter:uppercase">{TitelComponent} de prueba</h3>
              {TitelComponent === "email"
                ? <InputField
                  name="email"
                  label={"Correo electronico"}
                  type="email"
                  icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto text-gray-500" />}
                />
                : <InputField
                  name="phoneNumber"
                  label={"Número de telefono"}
                  type="text"
                  autoComplete="off"
                  icon={<PhoneMobile className="absolute w-4 h-4 inset-y-0 left-4 m-auto text-gray-500" />}
                />
              }
              <Tooltip
                label="Primero debes añadir la imagen de la invitación"
                icon={<IconLightBulb16 className="w-6 h-6" />}
                disabled={TitelComponent !== "email" || event?.imgInvitacion}>
                <button
                  type="submit"
                  disabled={TitelComponent !== "email" || !event?.imgInvitacion}
                  className={`${TitelComponent !== "email" ? "bg-gray-300" : "focus:outline-none hover:opacity-70 transition bg-primary"} text-white rounded-xl text-sm px-5 py-2 mt-4 w-full`}
                >
                  Enviar {TitelComponent} de prueba
                </button>
              </Tooltip>
            </>
          </Form>
        )}
      </Formik>
      {TitelComponent !== "email" && <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2 text-sm cursor-default gap-4">
        <ActivatorPremium link={redireccionFacturacion} />
      </div>}
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



const Aceptar = async () => {


  try {
    await api.ApiApp(params);
  } catch (error) {
    console.log(error);
  } finally {
    setEvento((old) => {
      arrEnviarInvitaciones.forEach((invitado) => {
        const idxInvitado = evento?.invitados_array?.findIndex(
          (inv) => inv._id == invitado
        );
        old.invitados_array[idxInvitado] = {
          ...old.invitados_array[idxInvitado],
          invitacion: true,
        };
      });

      return { ...old };
    });
    set([])
  }
};