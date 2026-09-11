import { Formik, Form, ErrorMessage } from "formik";
import { FC, useState } from "react";
import { EmailIcon, Eye, EyeSlash, LockClosed } from "../../../icons";
import { InputField } from "../../InputFieldIcons";
import { ButtonComponent } from "../../ButtonComponent";
import { useToast } from "../../../../hooks/useToast";
import { useAuthentication } from "../../../../utils/Authentication";
import { AuthContextProvider } from "../../../../context";
import { useTranslation } from 'react-i18next';

type MyFormValues = {
  identifier: string;
  password: any;
  wrong: any;
};

const FormLogin: FC<any> = ({ setStage }) => {
  const { t } = useTranslation();
  const { setIsStartingRegisterOrLogin } = AuthContextProvider()
  const { signIn } = useAuthentication();
  const [passwordView, setPasswordView] = useState(false)
  // BUG R4-006 (QA 30-jun): el toast rojo del error no se veía inequívoco
  // (bottom-3 z-1000 en un flow de login con overlay loading arriba). Bloque
  // inline rojo sobre el botón + toast global — doble canal visible.
  const [inlineError, setInlineError] = useState<string>('')
  const toast = useToast()
  const initialValues: MyFormValues = {
    identifier: "",
    password: "",
    wrong: "",
  };

  const errorsCode: Record<string, string> = {
    'auth/wrong-password': t('usuario o contraseña inválida'),
    'auth/invalid-credential': t('usuario o contraseña inválida'),
    // BUG #5 QA 30-jun: Firebase v10+ con enumeration protection devuelve este código
    'auth/invalid-login-credentials': t('usuario o contraseña inválida'),
    'auth/user-not-found': t('usuario o contraseña inválida'),
    'auth/invalid-email': t('usuario o contraseña inválida'),
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta de nuevo más tarde.',
  };

  const handleSubmit = async (values: MyFormValues) => {
    setInlineError('')
    try {
      await signIn({ type: 'credentials', payload: values, setStage, setIsStartingRegisterOrLogin });
    } catch (error: any) {
      console.error('[FormLogin]', error?.code, error?.message);
      const msg = error?.code ? errorsCode[error.code] : error?.message || t('usuario o contraseña inválida');
      if (msg) {
        toast('error', msg);
        setInlineError(msg);
      }
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <Form className="text-gray-200 flex flex-col gap-2 py-3 w-full md:w-3/4">
        <span className="w-full relative ">
          <InputField
            label={t("email")}
            name="identifier"
            // placeholder="ingrese correo electrónico"
            icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto text-gray-500" />}
            type="email"
          />

        </span>

        <span className="w-full relative ">
          <InputField
            name="password"
            type={!passwordView ? "password" : "text"}
            // OBS-1 (informe QA 21-jun): autoComplete="off" Chrome lo ignora en password.
            // current-password es el estándar HTML — el browser puede autocompletar UNA SOLA
            // VEZ con la última credencial, sin pre-rellenar al abrir la página de login.
            autoComplete="current-password"
            icon={<LockClosed className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
            label={t("password")}
          />
          <div onClick={() => { setPasswordView(!passwordView) }} className="absolute cursor-pointer inset-y-0 top-5 right-4 m-auto w-4 h-4 text-gray-500" >
            {!passwordView ? <Eye /> : <EyeSlash />}
          </div>
        </span>
        <span className="text-sm text-red">
          <ErrorMessage name="wrong" />
        </span>
        {/*  <span 
          className="text-sm text-primary w-full text-left hover:text-gray-300 transition cursor-pointer"
          >
          Olvidé mi contraseña
        </span> */}
        <div onClick={() => setStage("resetPassword")} className="text-sm text-primary w-full text-left hover:text-gray-300 transition cursor-pointer">
          {t("iforgotmypassword")}
        </div>
        {inlineError ? (
          <div
            role="alert"
            data-testid="login-inline-error"
            className="rounded-md bg-red-100 border border-red-500 text-red-800 px-4 py-3 text-sm font-semibold flex items-start gap-2"
          >
            <span aria-hidden="true">⚠️</span>
            <span className="first-letter:capitalize">{inlineError}</span>
          </div>
        ) : null}
        <ButtonComponent
          onClick={() => { }}
          type="submit"
          tabIndex={0}
        >
          {t("signin")}
        </ButtonComponent>
      </Form>
    </Formik>
  );
};

export default FormLogin;
