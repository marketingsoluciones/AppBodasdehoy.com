import crypto from 'crypto'
import { publicKey } from './../../../../publicKey.js'
import { Formik, Form, ErrorMessage } from "formik";
import { Dispatch, FC, SetStateAction, useState } from "react";
import { EmailIcon, Eye, EyeSlash, LockClosed, PhoneMobile, UserForm } from "../../../icons";
import { InputField as InputFieldIcons } from "../../InputFieldIcons";
import { ButtonComponent } from "../../ButtonComponent";
import { useToast } from "../../../../hooks/useToast";
import { AuthContextProvider, LoadingContextProvider } from "../../../../context";
import { UserCredential, createUserWithEmailAndPassword, getAuth, signInWithCustomToken, updateProfile } from "firebase/auth";
import { parseJwt, phoneUtil, useAuthentication } from "../../../../utils/Authentication";
import { fetchApiBodas, fetchApiEventos, queries } from "../../../../utils/Fetching";
import { useRouter } from "next/router";
import { FirebaseError } from 'firebase/app';
import { redirections } from "./redirections";
import Cookies from 'js-cookie';
import * as yup from "yup";
import { useActivity } from '../../../../hooks/useActivity';
import InputField from '../../InputField';
import { useTranslation } from 'react-i18next';

interface initialValues {
  uid?: string
  identifier: string
  fullName: string;
  password: string;
  phoneNumber: string
  role: string
}

// Set de mensajes de error
yup.setLocale({
  mixed: {
    required: "Campo requerido",
  },
});

interface propsFormRegister {
  whoYouAre: string;
  setStageRegister: Dispatch<SetStateAction<number>>
  stageRegister: number
}


const FormRegister: FC<any> = ({ whoYouAre, setStage }) => {
  const { t } = useTranslation();
  const router = useRouter()
  const { user, setUser, config, geoInfo, setVerificationDone, setIsStartingRegisterOrLogin, linkMedia, storage_id, link_id, preregister, WihtProvider } = AuthContextProvider();
  const { setLoading } = LoadingContextProvider()
  const [passwordView, setPasswordView] = useState(false)
  const { getSessionCookie, isPhoneValid } = useAuthentication();
  const toast = useToast()
  const [updateActivity, updateActivityLink] = useActivity()
  const [phoneNumber, setPhoneNumber] = useState<string | null>()

  const initialValues: initialValues = {
    identifier: preregister?.email ?? "",
    fullName: preregister?.name ?? "",
    password: "",
    phoneNumber: preregister?.phoneNumber ?? `+${phoneUtil?.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
    role: preregister?.role[0] ?? whoYouAre
  };
  const validationSchema = yup.object().shape({
    identifier: yup.string().required(t("requiredfield")).test("Unico", t("invalidmail"), (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "identifier" && !value?.includes("@")) {
        return isPhoneValid(value ?? "")
      } else {
        return true
      }
    }).test("Unico", "Correo inválido", async (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "identifier" && value?.includes("@")) {
        const result = await fetchApiBodas({
          query: queries.getEmailValid,
          variables: { email: value },
          development: config?.development
        })
        return result?.valid
      } else {
        return true
      }
    }),
    fullName: yup.string().required("Campo requerido"),
    password: linkMedia == null
      ? yup.string().required(t("requiredfield")).test("Unico", t(`containmorethan`), (value: any) => {
        const name = document.activeElement?.getAttribute("name")
        if (name !== "password") {
          return value?.length > 5
        } else {
          return true
        }
      })
      : null,
    phoneNumber: yup.string().test("Unico", t("requiredfield"), (value: any) => {
      const name = document.activeElement?.getAttribute("name")
      if (value?.length < 4) {
        return false
      } else {
        return true
      }
    }).test("Unico", t(`invalidnumber`), (value: any) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "phoneNumber" && value?.length > 3) {
        return isPhoneValid(value)
      } else {
        return true
      }
    })
  })

  const errorsCode: any = {
    "auth/wrong-password": t("invalidemailpassword"),
    "auth/too-many-requests":
      t("failedattempts"),
  };

  const handleSubmit = async (values: initialValues, actions: any) => {
    let UserFirebase: any = user ?? {};
    try {
      setIsStartingRegisterOrLogin(true)
      setLoading(true)
      // Si es registro completo
      // Autenticacion con firebase
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        getAuth(),
        values.identifier,
        values.password
      );
      UserFirebase = userCredential.user;

      values.uid = userCredential.user.uid;
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          try {
            const data = values?.password
            const encryptedData = crypto.publicEncrypt(
              {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING,
                oaepHash: 'sha256',
              },
              Buffer.from(data)
            );
            const result = await fetchApiBodas({
              query: queries.createUserWithPassword,
              variables: { email: values.identifier, password: encryptedData.toString('hex') },
              development: config?.development
            })
            if (result === "apiBodas/email-already-in-use") {
              console.log(550012, error.code)
              toast("error", t("emailalreadyregistered"))
              setLoading(false)
              return false
            }
            const asd = await signInWithCustomToken(getAuth(), result)
            UserFirebase = asd.user

            values.uid = UserFirebase.uid
          } catch (error) {
            console.log(55001, error)
            return false
          }
        }

      } else {
        toast("error", t("gonewrong"))
        setLoading(false)
        return false
      }
    }

    /// Actualizar displayName
    if (UserFirebase) {
      updateProfile(UserFirebase, { displayName: values?.fullName })
        .then(async () => {
          const idToken = await getAuth().currentUser?.getIdToken(true)
          const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
          Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO, expires: dateExpire })
          await getSessionCookie(idToken)
          // Crear usuario en MongoDB
          fetchApiBodas({
            query: queries.createUser,
            variables: {
              role: values.role,
              uid: values.uid,
              email: UserFirebase?.email,
              phoneNumber: values?.phoneNumber
            },
            development: config?.development
          }).then(async (moreInfo: any) => {
            setUser({ ...UserFirebase, ...moreInfo });
            toast("success", t(`successfulsessionregistration`))
            updateActivity("registered")
            updateActivityLink("registered")
            setVerificationDone(true)
            router.push("/")
          })
        })
        .catch((error): any => {
          console.log(45111, error)
        })
    }
  }

  const handleSumitMedia = async (values: initialValues, actions: any) => {
    try {
      if (storage_id && link_id) {
        fetchApiEventos({
          query: queries.updateActivityLink,
          variables: {
            args: {
              link_id,
              storage_id,
              activity: "preregistered",
              name: values?.fullName,
              role: values?.role,
              email: values?.identifier,
              phoneNumber: values.phoneNumber,
              navigator: navigator?.userAgentData?.platform,
              mobile: (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
            }
          }
        }).catch(error => console.log(90000, error))
      }
      setPhoneNumber(values?.phoneNumber)
    } catch (error) {
      console.log(45111, error)
    }
  }

  return (
    <>
      <Formik
        initialValues={initialValues ?? {}}
        validationSchema={validationSchema ?? {}}
        onSubmit={linkMedia == null ? handleSubmit : handleSumitMedia}
      >
        <Form className={`w-full md:w-[350px] text-gray-200 gap-4 md:gap-5 md:space-y-0 flex flex-col ${WihtProvider ? "mt-16" : ""} `}>
          <div className={`col-span-2 ${WihtProvider ? "hidden" : ""}`}>
            <InputFieldIcons
              disabled={!!phoneNumber}
              name="fullName"
              type="text"
              autoComplete="off"
              label={t("namesurname")}
              icon={<UserForm className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
            />
          </div>
          <div className={`col-span-2 ${WihtProvider ? "hidden" : ""}`}>
            <InputFieldIcons
              disabled={!!phoneNumber}
              name="identifier"
              type="text"
              autoComplete="off"
              label={t("email")}
              icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto text-gray-500" />}
            />
          </div>
          {linkMedia == null &&
            <div className={`w-full relative ${WihtProvider ? "hidden" : ""}`}>
              <InputFieldIcons
                name="password"
                type={passwordView ? "password" : "text"}
                autoComplete="off"
                label={t("password")}
                autoFocus={!!preregister}
                icon={<LockClosed className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />} />
              <div onClick={() => { setPasswordView(!passwordView) }} className="absolute cursor-pointer inset-y-0 top-5 right-4 m-auto w-4 h-4 text-gray-500" >
                {!passwordView ? <Eye /> : <EyeSlash />}
              </div>
            </div>
          }
          <span className="w-full relative ">
            <InputField
              disabled={!!phoneNumber}
              name="phoneNumber"
              type="telefono"
              autoComplete="off"
              // icon={<PhoneMobile className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
              label={t("phonenumber")}
            />
          </span>
          <div className="flex items-center w-fit col-span-2 gap-6 mx-auto  ">
            <button
              id="sign-in-button"
              type="submit"
              className="col-span-2 bg-primary rounded-full px-10 py-2 text-white font-medium mx-auto inset-x-0 md:hover:bg-tertiary transition"
            >
              {linkMedia != null ? !phoneNumber ? "siguiente" : "Reenviar Link" : !phoneNumber ? "Registrar" : "Reenviar Link"}
            </button>
          </div>
          {linkMedia != null && <div className='text-gray-900 w-full h-40'>
            {phoneNumber &&
              <>
                <p className='w-full text-center text-sm'>
                  {t("ingoodtime")} {phoneNumber}; {t("clickonthe")}
                </p>
              </>
            }
          </div>}
        </Form>
      </Formik>
      <style jsx>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        `}
      </style>
    </>
  );
};

export default FormRegister;
