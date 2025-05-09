import { updateProfile, getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Form, Formik } from "formik";
import { useState } from "react";
import { AuthContextProvider } from "../../../context";
import { BlockConfiguration } from "../../../pages/configuracion";
import { useToast } from '../../../hooks/useToast';
import InputField from "../../Forms/InputField";
import { Eye, EyeSlash } from "../../icons";
import * as yup from "yup";
import { parseJwt } from "../../../utils/Authentication";
import Cookies from "js-cookie";
import { useTranslation } from 'react-i18next';

export const MiPerfil = () => {
  const { t } = useTranslation();
  const { user, setUser } = AuthContextProvider();
  const [canChangeDisplayName, setCanChangeDisplayName] = useState(false);
  const [canChangePassword, setCanChangePassword] = useState(false);
  const [passwordView, setPasswordView] = useState(false)
  const toast = useToast();
  const auth = getAuth();

  const initialValues = {
    email: user?.email,
    displayName: user?.displayName,
    currentPassword: "",
    password: ""
  }

  const validationSchema = yup.object().shape({
    displayName: yup.string().required("El nombre no puede estar en blanco"),
    password: yup.string().test("Unico", `Debe contener mas de 5 caractéres`, (value: any) => {
      const name = document.activeElement?.getAttribute("name")
      if (canChangePassword) {
        if (name !== "password") {
          return value?.length > 5
        } else {
          return true
        }
      }
      else {
        return true
      }
    })
  })

  const handleEditDisplayName = async (values, errors) => {
    try {
      if (!errors?.displayName) {
        setCanChangeDisplayName(!canChangeDisplayName);
        if (values.displayName !== initialValues.displayName) {
          await updateProfile(auth.currentUser, {
            displayName: values.displayName
          });
          setUser(old => ({ ...old, displayName: values.displayName }))
          toast("success", t("success"))
        }
      }
    } catch (error) {
      toast("warning", t("warning"))
    }
  }

  const handleChangePassword = async ({ values, errors, setValues, setErrors }) => {
    if (canChangePassword && !errors?.password && values?.currentPassword) {
      try {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          values.currentPassword
        )
        const result = await reauthenticateWithCredential(
          auth.currentUser,
          credential
        )
        await updatePassword(auth.currentUser, values.password);
        const idToken = await getAuth().currentUser?.getIdToken(true)
        const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
        Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: process.env.NEXT_PUBLIC_DOMINIO ?? "", expires: dateExpire })
        setCanChangePassword(false)
        setPasswordView(false)
        setValues({ ...values, currentPassword: "", password: "" })
        setTimeout(() => {
          setErrors({ password: t("passwordsuccess") })
        }, 50);
        toast("success", t("passwordsuccess"))
      } catch (error) {
        if (error.code === "auth/wrong-password") {
          toast("error", t("warningpassword"))
        } else {
          toast("error", t("warningpasswordagain"))
        }
      }
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 container ">
      <Formik initialValues={initialValues} onSubmit={() => { }} validationSchema={validationSchema ?? {}}>
        {({ values, errors, setValues, setErrors }) => {
          return (
            <BlockConfiguration title={t("accessdata")}>
              <Form className="w-full flex flex-col gap-4">
                <div className="w-full flex items-center gap-2">
                  <InputField
                    id="email"
                    disabled
                    label={t("email")}
                    name={"email"}
                    type={"text"}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <InputField
                    id="displayName"
                    disabled={!canChangeDisplayName}
                    label={t("displayname")}
                    name={"displayName"}
                    type={"text"}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      canChangeDisplayName ? handleEditDisplayName(values, errors) : setCanChangeDisplayName(!canChangeDisplayName)
                      const element = document.getElementById("displayName")
                      setTimeout(() => {
                        element.focus()
                      }, 50);
                      if (canChangePassword) {
                        setCanChangePassword(false)
                        setValues({ ...values, currentPassword: "", password: "" })
                      }
                    }}
                    //disabled={canChangePassword}
                    className={`${canChangeDisplayName ? "bg-green" : "bg-primary"} w-28 h-10 text-white text-xs rounded-lg`}>
                    {canChangeDisplayName ? t("save") : t("edit")}
                  </button>
                </div>
                <div className="flex flex-row space-x-2">
                  <div className=" flex md:flex-row flex-col w-full items-center md:space-x-2">
                    <div className="flex-1 md:flex-none md:w-[300px] relative w-full">
                      <InputField
                        id="currentPassword"
                        disabled={!canChangePassword}
                        label={t("currentpassword")}
                        name={"currentPassword"}
                        type={passwordView ? "password" : "text"}
                      />
                      <div onClick={() => { setPasswordView(!passwordView) }} className="absolute cursor-pointer inset-y-0 right-4 m-auto w-4 h-4 text-gray-500 translate-y-2.5" >
                        {!passwordView ? <EyeSlash /> : <Eye />}
                      </div>
                    </div>
                    <div className="flex-1 md:flex-none md:w-[300px] relative w-full">
                      <InputField
                        id="password"
                        disabled={!canChangePassword}
                        label={t("newpassword")}
                        name={"password"}
                        type={passwordView ? "password" : "text"}
                      />
                      <div onClick={() => { setPasswordView(!passwordView) }} className="absolute cursor-pointer inset-y-0 right-4 m-auto w-4 h-4 text-gray-500 translate-y-2.5" >
                        {!passwordView ? <EyeSlash /> : <Eye />}
                      </div>
                    </div>
                   {/*  <div className="h-4 hidden sm:flex flex-1" /> */}
                  </div>

                  <div className="flex sm:flex-row md:items-center items-end space-y-4 sm:space-y-0  gap-4 sm:gap-0">
                    <button
                      type="button"
                      onClick={() => {
                        canChangePassword ? handleChangePassword({ values, errors, setValues, setErrors }) : setCanChangePassword(!canChangePassword)
                        const element = document.getElementById("currentPassword")
                        setTimeout(() => {
                          element.focus()
                        }, 50);
                        if (canChangeDisplayName) {
                          setCanChangeDisplayName(false)
                          setValues({ ...values, displayName: initialValues.displayName })
                        }
                      }}
                      //disabled={canChangeDisplayName}
                      className={`${canChangePassword ? "bg-green" : "bg-primary"} w-20 sm:w-24 h-10 text-white text-xs rounded-lg`}>
                      {canChangePassword ? t("update") : t("edit")}
                    </button>
                  </div>
                </div>
              </Form>
            </BlockConfiguration>
          )
        }}
      </Formik>
    </div>
  );
};
