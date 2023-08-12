import { Formik, Form, ErrorMessage } from "formik";
import { FC, useState } from "react";
import { EmailIcon, Eye, EyeSlash, LockClosed, PhoneMobile, UserForm } from "../../../icons";
import { InputField } from "../../InputFieldIcons";
import { ButtonComponent } from "../../ButtonComponent";
import { useToast } from "../../../../hooks/useToast";
import { AuthContextProvider, LoadingContextProvider } from "../../../../context";
import { UserCredential, createUserWithEmailAndPassword, getAuth, updateProfile } from "firebase/auth";
import { useAuthentication } from "../../../../utils/Authentication";
import { fetchApiBodas, queries } from "../../../../utils/Fetching";

type MyFormValues = {
  fullName: string
  email: string
  password: any
  phoneNumber: string
  wrong: any
  city: string
  country: string
  weddingDate: any
  role: string
  uid: string
};

const FormRegister: FC<any> = ({ setStage }) => {
  const { setUser, config } = AuthContextProvider();
  const { setLoading } = LoadingContextProvider()
  const [passwordView, setPasswordView] = useState(false)
  const { getSessionCookie } = useAuthentication();
  const toast = useToast()
  const initialValues: MyFormValues = {
    fullName: "",
    email: "",
    password: "",
    wrong: "",
    city: "",
    country: "",
    weddingDate: undefined,
    phoneNumber: "",
    role: "",
    uid: "",
  };

  const errorsCode: any = {
    "auth/wrong-password": "Correo o contraseña invalida",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Intenta de nuevo más tarde",
  };

  const handleSubmit = async (values: MyFormValues, actions: any) => {
    try {
      setLoading(true)


      // Si es registro completo
      // Autenticacion con firebase
      const res: UserCredential = await createUserWithEmailAndPassword(
        getAuth(),
        values.email,
        values.password
      );
      let UserFirebase = res.user;
      values.uid = res.user.uid;
      // Actualizar displayName
      getAuth().onAuthStateChanged(async (usuario: any) => {
        if (usuario) {
          updateProfile(usuario, { displayName: values.fullName });
          // Almacenar token en localStorage
          getSessionCookie((await usuario?.getIdTokenResult())?.token)
        }
      });

      // Crear usuario en MongoDB
      const moreInfo = await fetchApiBodas({
        query: queries.createUser, variables: {
          ...values,
          phoneNumber: JSON.stringify(values.phoneNumber),
        },
        development: config?.development
      });
      console.log(70001, moreInfo)
      // Almacenar en contexto USER con toda la info
      if (moreInfo?.status) {
        setUser({ ...UserFirebase, ...moreInfo });
      }

      /////// REDIRECIONES ///////
      // if (userTemp) {
      //   setUser(userTemp)
      //   setUserTemp(null)
      // }
      // if (redirect?.split("/")[3] == "info-empresa" && moreInfo.role.includes("empresa")) {
      //   await router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/empresa` ?? "")
      //   toast("success", `Registro de Empresa realizado con exito `)
      //   setLoading(false);
      // }
      // if (redirect?.split("/")[3] !== "info-empresa" && moreInfo.role.includes("empresa")) {
      //   await router.push(redirect ? redirect : `${process.env.NEXT_PUBLIC_DIRECTORY}/empresa` ?? "")
      //   toast("success", `Inicio sesión con exito`)
      // }

      // if (redirect?.split("/")[3] == "info-empresa" && !moreInfo.role.includes("empresa")) {
      //   await router.push(redirect)
      //   toast("warning", `Inicio sesión con una cuenta que no es de empresa`)
      // }
      // if (redirect?.split("/")[3] !== "info-empresa" && !moreInfo.role.includes("empresa")) {
      //   await router.push(redirect ? redirect : process.env.NEXT_PUBLIC_EVENTSAPP ?? "")
      //   toast("success", `Inicio sesión con exito`)
      // }
      ///////////////////////////

      //toast("success", "Registro realizado con exito")
      setLoading(false);
    } catch (error) {
      console.log(error);
      // if (error instanceof FirebaseError) {
      //   toast("error", "Ups... este correo ya esta registrado")
      // } else {
      //   toast("error", "Ups... algo a salido mal")
      // }
      setLoading(false);
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
            name="email"
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
