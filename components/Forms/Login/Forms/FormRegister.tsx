import { Formik, Form, ErrorMessage } from "formik";
import { FC, useState } from "react";
import { EmailIcon, Eye, EyeSlash, LockClosed, PhoneMobile, UserForm } from "../../../icons";
import { InputField } from "../../InputFieldIcons";
import { ButtonComponent } from "../../ButtonComponent";
import { useToast } from "../../../../hooks/useToast";
import { useAuthentication } from "../../../../utils/Authentication";

type MyFormValues = {
  identifier: string;
  password: any;
  wrong: any;
};

const FormRegister: FC<any> = ({ setStage }) => {
  const [passwordView, setPasswordView] = useState(false)
  //const { signIn } = useAuthentication();
  const toast = useToast()
  const initialValues: MyFormValues = {
    identifier: "",
    password: "",
    wrong: "",
  };

  const errorsCode: any = {
    "auth/wrong-password": "Correo o contraseña invalida",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Intenta de nuevo más tarde",
  };

  const handleSubmit = async (values: MyFormValues, actions: any) => {
    try {
      //signIn("credentials", values)
    } catch (error: any) {
      console.error(JSON.stringify(error));
      toast("error", JSON.stringify(errorsCode[error.code]))
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <Form className="text-gray-200 flex flex-col gap-2 w-full *md:w-3/4">
        <span className="w-full relative ">
          <InputField
            name="fullName"
            type="text"
            autoComplete="off"
            icon={<UserForm className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
            label={"Nombre y apellidos"}
          />
        </span>
        <span className="w-full relative ">
          <InputField
            label={"Correo electronico"}
            name="identifier"
            icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto text-gray-500" />}
            type="email"
          />
        </span>
        <span className="w-full relative ">
          <InputField
            name="password"
            type={!passwordView ? "password" : "text"}
            autoComplete="off"
            icon={<LockClosed className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
            label={"Contraseña"}
          />
          <div onClick={() => { setPasswordView(!passwordView) }} className="absolute cursor-pointer inset-y-0 top-5 right-4 m-auto w-4 h-4 text-gray-500" >
            {!passwordView ? <Eye /> : <EyeSlash />}
          </div>
        </span>
        <span className="w-full relative ">
          <InputField
            name="phoneNumber"
            type="number"
            autoComplete="off"
            icon={<PhoneMobile className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
            label={"Número de telefono"}
          />
        </span>
        <span className="text-sm text-red">
          <ErrorMessage name="wrong" />
        </span>
        <ButtonComponent
          onClick={() => { }}
          type="submit"
          tabIndex={0}
        >
          Registrarse
        </ButtonComponent>
      </Form>
    </Formik>
  );
};

export default FormRegister;
