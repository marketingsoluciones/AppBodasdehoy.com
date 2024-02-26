import crypto from 'crypto'
import { publicKey } from './../../../../publicKey.js'
import { Formik, Form, ErrorMessage } from "formik";
import { Dispatch, FC, SetStateAction, useState } from "react";
import { EmailIcon, Eye, EyeSlash, LockClosed, PhoneMobile, UserForm } from "../../../icons";
import { InputField } from "../../InputFieldIcons";
import { ButtonComponent } from "../../ButtonComponent";
import { useToast } from "../../../../hooks/useToast";
import { AuthContextProvider, LoadingContextProvider } from "../../../../context";
import { UserCredential, createUserWithEmailAndPassword, getAuth, signInWithCustomToken, updateProfile } from "firebase/auth";
import { parseJwt, useAuthentication } from "../../../../utils/Authentication";
import { fetchApiBodas, queries } from "../../../../utils/Fetching";
import { useRouter } from "next/router";
import { FirebaseError } from 'firebase/app';
import { redirections } from "./redirections";
import Cookies from 'js-cookie';
import * as yup from "yup";



interface initialValues {
  uid?: string
  identifier: string
  fullName: string;
  password: string;
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
  console.log("---------------------->", { whoYouAre, setStage })
  const router = useRouter()
  const { user, setUser, config } = AuthContextProvider();
  const { setLoading } = LoadingContextProvider()
  const [passwordView, setPasswordView] = useState(false)
  const { getSessionCookie, isPhoneValid } = useAuthentication();
  const toast = useToast()
  const initialValues: initialValues = {
    identifier: "",
    fullName: "",
    password: "",
    role: whoYouAre
  };

  const validationSchema = yup.object().shape({
    identifier: yup.string().required("Campo requerido").test("Unico", "Correo inválido", async (value) => {
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
    password: yup.string().required("Campo requerido").test("Unico", `Debe contener entre 8 y 12 caractéres`, (value: any) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "password") {
        return value?.length > 7 && value?.length < 11
      } else {
        return true
      }
    }),
    phoneNumber: yup.string().test("Unico", `Campo requerido`, (value: any) => {
      const name = document.activeElement?.getAttribute("name")
      if (value?.length < 4) {
        return false
      } else {
        return true
      }
    }).test("Unico", `Número inválido`, (value: any) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "phoneNumber" && value?.length > 3) {
        return isPhoneValid(value)
      } else {
        return true
      }
    })
  })

  const errorsCode: any = {
    "auth/wrong-password": "Correo o contraseña invalida",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Intenta de nuevo más tarde",
  };

  const handleSubmit = async (values: initialValues, actions: any) => {
    let UserFirebase: any = user ?? {};
    try {
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
              toast("error", "Ups... este correo ya esta registrado1")
              setLoading(true)
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
        toast("error", "Ups... algo a salido mal")
        setLoading(true)
        return false
      }
    }

    /// Actualizar displayName
    if (UserFirebase) {
      updateProfile(UserFirebase, { displayName: values?.fullName })
        .then(async () => {
          const idToken = await getAuth().currentUser?.getIdToken(true)
          console.log("*************************----------**********8888888885 parseJwt", parseJwt(idToken ?? ""))
          const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
          Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "", expires: dateExpire })
          await getSessionCookie(idToken)
          // Crear usuario en MongoDB
          fetchApiBodas({
            query: queries.createUser,
            variables: {
              role: values.role, uid: values.uid, email: UserFirebase?.email
            },
            development: config?.development
          }).then(async (moreInfo: any) => {
            setUser({ ...UserFirebase, ...moreInfo });
            redirections({ router, moreInfo, toast })
          })
        })
        .catch((error): any => {
          console.log(45111, error)
        })
    }
  }

  return (
    <>
      <Formik
        initialValues={initialValues ?? {}}
        validationSchema={validationSchema ?? {}}
        onSubmit={handleSubmit}
      >
        <Form className="w-full md:w-[350px] text-gray-200 *md:grid *md:grid-cols-2 gap-4 md:gap-3 md:space-y-0 flex flex-col m-4">
          <div className="col-span-2">
            <InputField
              name="fullName"
              type="text"
              autoComplete="off"
              label={"Nombre y Apellido"}
              icon={<UserForm className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
            />
          </div>
          <div className="col-span-2">
            <InputField
              name="identifier"
              type="text"
              autoComplete="off"
              label={"Correo electrónico"}
              icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto text-gray-500" />}
            />
          </div>
          <div className="w-full relative">
            <InputField
              name="password"
              type={passwordView ? "password" : "text"}
              autoComplete="off"
              label="Contraseña"
              icon={<LockClosed className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />} />
            <div onClick={() => { setPasswordView(!passwordView) }} className="absolute cursor-pointer inset-y-0 top-5 right-4 m-auto w-4 h-4 text-gray-500" >
              {!passwordView ? <Eye /> : <EyeSlash />}
            </div>
          </div>
          <span className="w-full relative ">
            <InputField
              name="phoneNumber"
              type="text"
              autoComplete="off"
              icon={<PhoneMobile className="absolute w-4 h-4 inset-y-0 left-4 m-auto  text-gray-500" />}
              label={"Número de telefono"}
            />
          </span>
          <div className="flex items-center w-fit col-span-2 gap-6 mx-auto pt-3 ">
            <button
              id="sign-in-button"
              type="submit"
              className="col-span-2 bg-primary rounded-full px-10 py-2 text-white font-medium mx-auto inset-x-0 md:hover:bg-tertiary transition"
            >
              Registrar
            </button>
          </div>
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
