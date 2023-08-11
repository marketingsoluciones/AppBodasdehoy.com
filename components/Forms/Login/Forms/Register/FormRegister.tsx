import { Formik, Form } from "formik";
import { FC, Children, memo, Dispatch, SetStateAction, useState } from "react";
import { DatePicker, InputField } from "../../../Inputs";
import { EmailIcon, UserForm, Eye, EyeSlash, LockClosed, PhoneMobile, } from "../../../Icons";
import { createUserWithEmailAndPassword, updateProfile, UserCredential } from "@firebase/auth";
import * as yup from "yup";
import { UserMax } from "../../../../context/AuthContext";
import { AuthContextProvider, LoadingContextProvider, } from "../../../../context";
import router from "next/router";
import { ValidationSchemaRegister } from "./ValidationRegister";
import { fetchApi, queries } from "../../../../utils/Fetching";
import SelectFieldCoutries from "../../../Inputs/SelectFieldCoutries";
import { auth } from "../../../../firebase";
import InputCity from "../../../Inputs/InputCity";
import { useAuthentication } from '../../../../utils/Authentication';
import { useToast } from '../../../../hooks/useToast';
import { FirebaseError } from "firebase/app";

// Interfaces para el InitialValues del formulario de registro
interface userInitialValuesPartial {
  fullName: string;
  email: string;
  city: string;
  country: string;
  weddingDate: Date | undefined;
  phoneNumber: string;
  role: string;
  uid: string;
}
interface userInitialValuesTotal {
  fullName: string;
  email: string;
  password: string;
  city: string;
  country: string;
  weddingDate: Date | undefined;
  phoneNumber: string;
  role: string;
  uid: string;
}
interface businessInitialValuesPartial {
  fullName: string;
  email: String,
  phoneNumber: string;
  role: string
}
interface businessInitialValuesTotal {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string
}

// Set de mensajes de error
yup.setLocale({
  mixed: {
    required: "Campo requerido",
  },
});

/*
  ### Componente FormRegister(Formik) ###
  @params whoYouAre : tipo de perfil seleccionado
*/
interface propsFormRegister {
  whoYouAre: string;
  setStageRegister: Dispatch<SetStateAction<number>>
  stageRegister: number
}

const FormRegister: FC<propsFormRegister> = ({ whoYouAre, setStageRegister, stageRegister }) => {
  const { setUser, user, setUserTemp, userTemp, redirect } = AuthContextProvider();
  const { setLoading } = LoadingContextProvider();
  const { getSessionCookie } = useAuthentication();
  const toast = useToast()

  //Initial values de cada form
  const userInitialValuesPartial: userInitialValuesPartial = {
    fullName: "",
    email: "",
    //Envio a la api
    city: "",
    country: "",
    weddingDate: new Date(),
    phoneNumber: "",
    role: whoYouAre || "",
    uid: "",
  };

  const userInitialValuesTotal: userInitialValuesTotal = {
    // Envio a firebase
    fullName: "",
    email: "",
    password: "",
    //Envio a la api
    city: "",
    country: "",
    weddingDate: undefined,
    phoneNumber: "",
    role: whoYouAre || "",
    uid: "",
  };

  const businessInitialValuesPartial: businessInitialValuesPartial = {
    // Envio a firebase
    fullName: "",
    email: "",
    //Envio a la api
    phoneNumber: "",
    role: whoYouAre || "",
  };

  const businessInitialValuesTotal: businessInitialValuesTotal = {
    // Envio a firebase
    fullName: "",
    email: "",
    password: "",
    //Envio a la api
    phoneNumber: "",
    role: whoYouAre || "",
  };

  // Funcion a ejecutar para el submit del formulario
  const handleSubmit = async (values: any, actions: any) => {
    try {
      setLoading(true);
      let UserFirebase: Partial<UserMax> = user ?? {};

      // Si es registro completo
      if (!user?.uid && !userTemp?.uid) {
        // Autenticacion con firebase
        const res: UserCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        UserFirebase = res.user;
        // Almacenamiento en values del UID de firebase
        values.uid = res.user.uid;
      } else {
        // Si existe usuario firebase pero faltan datos de ciudad, etc.
        values.uid = userTemp?.uid;
      }

      // Actualizar displayName
      auth?.onAuthStateChanged(async (usuario: any) => {
        if (usuario) {
          updateProfile(usuario, { displayName: values.fullName });
          // Almacenar token en localStorage
          getSessionCookie((await usuario?.getIdTokenResult())?.token)
        }
      });

      // Crear usuario en MongoDB
      const moreInfo = await fetchApi({
        query: queries.createUser, variables: {
          ...values,
          phoneNumber: JSON.stringify(values.phoneNumber),
        }
      });

      // Almacenar en contexto USER con toda la info
      if (moreInfo?.status) {
        setUser({ ...UserFirebase, ...moreInfo });
      }

      /////// REDIRECIONES ///////
      if (userTemp) {
        setUser(userTemp)
        setUserTemp(null)
      }
      if (redirect?.split("/")[3] == "info-empresa" && moreInfo.role.includes("empresa")) {
        await router.push(`${process.env.NEXT_PUBLIC_DIRECTORY}/empresa` ?? "")
        toast("success", `Registro de Empresa realizado con exito `)
        setLoading(false);
      }
      if (redirect?.split("/")[3] !== "info-empresa" && moreInfo.role.includes("empresa")) {
        await router.push(redirect ? redirect : `${process.env.NEXT_PUBLIC_DIRECTORY}/empresa` ?? "")
        toast("success", `Inicio sesión con exito`)
      }

      if (redirect?.split("/")[3] == "info-empresa" && !moreInfo.role.includes("empresa")) {
        await router.push(redirect)
        toast("warning", `Inicio sesión con una cuenta que no es de empresa`)
      }
      if (redirect?.split("/")[3] !== "info-empresa" && !moreInfo.role.includes("empresa")) {
        await router.push(redirect ? redirect : process.env.NEXT_PUBLIC_EVENTSAPP ?? "")
        toast("success", `Inicio sesión con exito`)
      }
      ///////////////////////////

      //toast("success", "Registro realizado con exito")
    } catch (error) {
      console.log(error);
      if (error instanceof FirebaseError) {
        toast("error", "Ups... este correo ya esta registrado")
      } else {
        toast("error", "Ups... algo a salido mal")
      }
      setLoading(false);
    }
  };

  return (
    <>
      <FormikStepper handleSubmit={handleSubmit}>
        <Form className="w-full text-gray-200 md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0 flex flex-col">
          {(() => {
            if (whoYouAre.toLowerCase() !== "empresa") {
              if (!user?.uid && !userTemp?.uid) {
                return (
                  <UserWithEmailAndPassword
                    initialValues={userInitialValuesTotal}
                    validationSchema={
                      ValidationSchemaRegister.userValidationTotal
                    }
                  />
                );
              } else {
                {
                  userInitialValuesPartial.fullName = !userTemp?.displayName ? "" : userTemp.displayName
                  userInitialValuesPartial.email = !userTemp?.email ? "" : userTemp.email
                }
                return (
                  <UserDataAPI
                    initialValues={userInitialValuesPartial}
                    validationSchema={
                      ValidationSchemaRegister.userValidationPartial
                    }
                  />
                );
              }
            } else {
              if (!user?.uid && !userTemp?.uid) {
                return (
                  <BusinessWithEmailAndPassword
                    initialValues={businessInitialValuesTotal}
                    validationSchema={
                      ValidationSchemaRegister.businessValidationTotal
                    }
                  />
                );
              } else {
                {
                  businessInitialValuesPartial.fullName = !userTemp?.displayName ? "" : userTemp.displayName
                  businessInitialValuesPartial.email = !userTemp?.email ? "" : userTemp.email
                }
                return (
                  <BusinessDataAPI
                    initialValues={businessInitialValuesPartial}
                    validationSchema={
                      ValidationSchemaRegister.businessValidationPartial
                    }
                  />
                );
              }
            }
          })()}
          <div className="flex items-center w-fit col-span-2 gap-6 mx-auto inset-x-0 ">
            {/* <button
              type={"button"}
              disabled={stageRegister === 0}
              onClick={() => setStageRegister(old => old - 1)}
              className=" col-span-2 bg-gray-400  rounded-full px-10 py-2 text-white font-medium mx-auto inset-x-0 hover:bg-tertiary transition"
            >
              Atras
            </button> */}
            <button
              type={"submit"}
              className=" col-span-2 bg-primary rounded-full px-10 py-2 text-white font-medium mx-auto inset-x-0 hover:bg-tertiary transition"
            >
              Registrar
            </button>

          </div>
        </Form>
      </FormikStepper>
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

interface propsFormikStepper {
  handleSubmit: any;
}
export const FormikStepper: FC<propsFormikStepper> = memo(
  ({ handleSubmit, children }) => {
    const childrenArray = Children.toArray(children) as React.ReactElement[];
    const currentChildren = childrenArray[0]?.props.children[0];
    return (
      <Formik
        initialValues={currentChildren?.props?.initialValues ?? {}}
        validationSchema={currentChildren?.props?.validationSchema ?? {}}
        onSubmit={handleSubmit}
      >
        {children}
      </Formik>
    );
  }
);

interface propsForm {
  initialValues: any;
  validationSchema: any;
}


const UserWithEmailAndPassword: FC<propsForm> = () => {
  const [passwordView, setPasswordView] = useState(false)
  return (
    <>
      <div className="col-span-2">
        <InputField
          name="fullName"
          //placeholder="Jhon Doe"
          type="text"
          autoComplete="off"
          icon={<UserForm className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Nombre y apellidos"}
        />
      </div>

      <div className="col-span-2">
        <InputField
          name="email"
          //placeholder="jhondoe@gmail.com"
          type="email"
          autoComplete="off"
          icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Correo electronico"}
        />
      </div>

      <div className="w-full relative">
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
      </div>

      {/* <div className="w-full relative ">
        <SelectFieldCoutries name="country" label={"País"} />
      </div>

      <div className="w-full relative ">
        <InputCity
          name={"city"}
          label={"Ciudad"}
          type="text"
        />

      </div>

      <div className="w-full relative ">
        <DatePicker name={"weddingDate"} label={"Fecha del evento"} />
      </div> */}

      <div className="w-full relative">
        <InputField
          name="phoneNumber"
          type="number"
          autoComplete="off"
          icon={<PhoneMobile className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Número de telefono"}
        />
      </div>
    </>
  );
};

const UserDataAPI: FC<propsForm> = () => {
  return (
    <>
      <div className="w-full col-span-2">
        <InputField
          name="fullName"
          placeholder="Jhon Doe"
          type="text"
          autoComplete="off"
          icon={<UserForm className="absolute w-4 h-4 inset-y-0 left-4 m-auto" />}
          label={"Nombre y apellidos"}
          disabled
        />
      </div>

      <div className="w-full col-span-2">
        <InputField
          name="email"
          placeholder="jhondoe@gmail.com"
          type="email"
          autoComplete="off"
          icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Correo electronico"}
          disabled
        />
      </div>

      <div className="w-full relative ">
        <SelectFieldCoutries name="country" label={"País"} />
      </div>

      <div className="w-full relative ">
        <InputCity
          name={"city"}
          label={"Ciudad"}
          type="text"
        />

      </div>

      <div className="w-full relative ">
        <DatePicker name={"weddingDate"} label={"Fecha del evento"} />
      </div>

      <div className="w-full relative ">
        <InputField
          name="phoneNumber"
          type="number"
          autoComplete="off"
          label={"Número de telefono"}
        />
      </div>
    </>
  );
};

const BusinessWithEmailAndPassword: FC<propsForm> = () => {
  const [passwordView, setPasswordView] = useState(false)
  return (
    <>
      <div className="col-span-2">
        <InputField
          name="fullName"
          //placeholder="Jhon Doe"
          type="text"
          autoComplete="off"
          icon={<UserForm className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Nombre y apellidos"}
        />
      </div>

      <div className="col-span-2">
        <InputField
          name="email"
          label="Correo electronico"
          type="email"
          autoComplete="off"
          icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 m-auto left-4 text-gray-500" />}
        />

      </div>

      <div className="w-full relative">
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
      </div>

      <div className="w-full">
        <InputField
          name="phoneNumber"
          type="number"
          autoComplete="off"
          icon={<PhoneMobile className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Número de telefono"}
        />
      </div>
    </>
  );
};

const BusinessDataAPI: FC<propsForm> = () => {
  return (
    <>
      <div className="w-full col-span-2">
        <InputField
          name="fullName"
          //placeholder="Jhon Doe"
          type="text"
          autoComplete="off"
          icon={<UserForm className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Nombre y apellidos"}
        />
      </div>

      <div className="w-full col-span-2 ">
        <InputField
          name="email"
          label="Correo electronico"
          type="email"
          autoComplete="off"
          icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 m-auto left-4 text-gray-500" />}
          disabled
        />
      </div>

      <div className="w-full relative ">
        <InputField
          name="phoneNumber"
          type="number"
          autoComplete="off"
          icon={<PhoneMobile className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
          label={"Número de telefono"}
        />
      </div>
    </>
  );
};
