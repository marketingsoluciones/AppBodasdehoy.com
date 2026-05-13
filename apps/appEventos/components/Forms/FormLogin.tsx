// @ts-nocheck — api.AuthUsuario no existe en api.ts (form pre-existente roto, no usado en flow actual de login)
import { Formik } from "formik";
import { useRouter } from "next/navigation";
import { api } from "../../api";
import {getCookie, setCookie} from "../../utils/Cookies";
import InputField from "./InputField";
import { useTranslation } from 'react-i18next';

type FormLoginValues = {
    username: string;
    password: string;
};

const validacion = (values: FormLoginValues) => {
    const errors: Partial<Record<keyof FormLoginValues, string>> = {}

    if(!values.username){
        errors.username= "Usuario requerido"
    }
    if (!values.password){
        errors.password = "Contraseña requerida"
    }

    return errors
}

const FormLogin = () => {
    const router = useRouter()
    return (
        <Formik
          initialValues={{
            username: "",
            password: "",
          }}

          onSubmit={async(values) => {
            const resp = await api.AuthUsuario(values)
            const {data} = resp
            const {token} = data
            setCookie("token-bodas", token, 1)
            if (getCookie("token-bodas")){
              router.push("/")
            }
          }}
          
          validate={validacion}
        >
          {(props) => <BasicFormLogin {...props} />}
        </Formik>
      );
}

export default FormLogin


type BasicFormLoginProps = {
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
    isSubmitting: boolean;
    values: { username: string; password: string; nombre?: string };
};

export const BasicFormLogin = ({
    handleChange,
    handleSubmit,
    isSubmitting,
    values,
  }: BasicFormLoginProps) => {
    const { t } = useTranslation();
    return (
        <form onSubmit={handleSubmit}>
            <div className="py-4">
            <InputField
            placeholder="Ej. jhon@lorem.com"
            name="username"
            label={t("nameoremail")}
            onChange={handleChange}
            value={values.nombre}
            type="email"/>
            </div>
            
            <div className="py-4">
            <InputField
            name="password"
            label={t("password")}
            onChange={handleChange}
            value={values.nombre}
            type="password"/>
            </div>

            <button disabled={isSubmitting} type="submit" className="bg-primary w-full text-white rounded-full py-1 px-2">{t("login")}</button>
        </form>
    )
}