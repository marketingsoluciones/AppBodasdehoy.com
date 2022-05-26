import { Formik } from "formik";
import { useRouter } from "next/router";
import { api } from "../../api";
import {getCookie, setCookie} from "../../utils/Cookies";
import InputField from "./InputField";

const validacion = (values) => {
    let errors = {}

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


export const BasicFormLogin = ({
    handleChange,
    handleSubmit,
    isSubmitting,
    values,
  }) => {
    return (
        <form onSubmit={handleSubmit}>
            <div className="py-4">
            <InputField
            placeholder="Ej. jhon@lorem.com"
            name="username"
            label="Usuario o correo electronico"
            onChange={handleChange}
            value={values.nombre}
            type="email"/>
            </div>
            
            <div className="py-4">
            <InputField
            name="password"
            label="Contraseña"
            onChange={handleChange}
            value={values.nombre}
            type="password"/>
            </div>

            <button disabled={isSubmitting} type="submit" className="bg-primary w-full text-white rounded-full py-1 px-2">Iniciar Sesion</button>
        </form>
    )
}


