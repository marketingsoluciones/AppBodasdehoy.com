import { Form, Formik, FormikValues, useField } from "formik";
import { Dispatch, FC, HtmlHTMLAttributes, SetStateAction, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { WarningIcon } from "../icons";
import InputField from "./InputField";
import SelectField from "./SelectField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { ImageProfile } from "../../utils/Funciones";
import useHover from "../../hooks/useHover";
import { IoMdContacts } from "react-icons/io"
import { ImportGuest } from "./ImportGuest";
import { useImportGuest } from "../../hooks/useImportGuest";
import { ForApiPeople } from "./ForApiGoogle";
import { phoneUtil, useAuthentication } from "../../utils/Authentication";
import { useTranslation } from 'react-i18next';

interface propsFormInvitado {
  state: any;
  set: any;
}
interface contact {
  name: string[]
  address: string[]
  email: string[]
  icon: string[]
  tel: string[]
}
const FormInvitado: FC<propsFormInvitado> = ({ state, set }) => {
  const { t } = useTranslation();
  const { geoInfo } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const [contact, setContact] = useState(null)
  const [showMedioSelectImport, setShowMedioSelectImport] = useState(false)
  const [showForApiGoogle, setShowForApiGoogle] = useState({ state: false, payload: {} })
  const toast = useToast()
  const [contactsForApiGoogle] = useImportGuest()
  const { isPhoneValid } = useAuthentication()


  useEffect(() => {
    const scriptGsi = document.createElement('script');
    scriptGsi.src = "https://accounts.google.com/gsi/client";
    scriptGsi.async = true;
    scriptGsi.onload = () => {
    }
    document.body.appendChild(scriptGsi);

    const scriptGapi = document.createElement('script');
    scriptGapi.src = "https://apis.google.com/js/api.js";
    scriptGapi.async = true;
    scriptGapi.onload = () => {
    }
    document.body.appendChild(scriptGapi);
  }, [])

  const validationSchema = yup.object().shape({
    nombre: yup.string().required("Nombre requerido"),
    telefono: yup.string().test("Unico", `Teléfono requerido`, (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (value?.length < 4) {
        return false
      } else {
        return true
      }
    }).test("Unico", `Número inválido`, (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "telefono" && value?.length > 3) {
        return isPhoneValid(value)
      } else {
        return true
      }
    }).test("Unico", `Número asignado a otro invitado`, (value) => {
      const name = document.activeElement?.getAttribute("name")
      if (name !== "telefono" && value?.length > 3) {
        return !event.invitados_array.map(item => item?.telefono).includes(value)
      } else {
        return true
      }
    }),
    rol: yup.string().required("Rol requerido").notOneOf(['Seleccionar'], "Seleccione un Rol valido"),
    correo: yup.string().email("El formato del correo no es valido")/* .required("Correo requerido") */.test("Unico", `Correo asignado a otro invitado`, (value) => {
      return !event.invitados_array.map(item => item?.correo).includes(value)
    }).email("Formato invalido")

  });

  const initialValues = {
    /*  tituloInvitado:"", */
    nombre: "",
    sexo: "hombre",
    grupo_edad: "adulto",
    correo: "",
    telefono: `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
    rol: "",
    nombre_menu: "adultos",
    passesQuantity: 0
  };

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      if (values?.telefono[0] === "0") {
        values.telefono = `+${phoneUtil.getCountryCodeForRegion(geoInfo.ipcountry)}${values?.telefono.slice(1, values?.telefono.length)}`
      }
      if (values.nombre_menu === "sin menú") values.nombre_menu = undefined
      const result: any = await fetchApiEventos({
        query: queries.createGuests,
        variables: {
          eventID: event._id,
          invitados_array: values,
        },
      });

      setEvent((old) => ({ ...old, invitados_array: result?.invitados_array }));
      toast("success", t("Invitado creado con exito"))
    } catch (error) {
      toast("error", `${t("Ha ocurrido un error")} ${error}`)
      console.log(error);
    } finally {
      actions.setSubmitting(false);
      set(!state);
    }
  };

  const titleInvitado = [
    "Dr.", "Master.", "Miss.", "Mr.", "Mrs.", "Ms.", "Professor.", "SSG.", "Padre.", "lady.", "sir"
  ]

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting, values, setFieldValue, resetForm }) => {

        return (
          <Form className="w-full flex flex-col">
            <ResetForm setFieldValue={setFieldValue} resetForm={resetForm} contact={contact} />
            {showForApiGoogle.state && <ForApiPeople setContact={setContact} showForApiGoogle={showForApiGoogle} setShowForApiGoogle={setShowForApiGoogle} />}
            {showMedioSelectImport && <ImportGuest setShowMedioSelectImport={setShowMedioSelectImport} setContact={setContact} setShowForApiGoogle={setShowForApiGoogle} />}
            <div className="border-l-2 border-gray-100 pl-3 my-2 w-full ">
              <h2 className="font-display text-3xl capitalize text-primary font-light">
                {t("create")}
              </h2>
              <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
                {t("guest")}
              </h2>
            </div>
            <div className="text-gray-500 font-body flex flex-col gap-4 w-full">
              <div className="input-name w-full flex items-center justify-center relative pt-4">
                <div className="flex absolute z-[5] right-0 top-0 text-white cursor-pointer"
                  onClick={() => {
                    window["ReactNativeWebView"] || navigator["contacts"]
                      ? setShowMedioSelectImport(true)
                      : contactsForApiGoogle().then(result => {
                        setShowForApiGoogle(result)
                      })
                  }}
                >
                  <div className=" flex items-center space-x-2 border px-2 py-0.5 rounded-lg hover:border-gray-300 bg-primary " >
                    <p className="w-14 text-xs leading-3 capitalize">{t("importcontacts")}</p>
                    <IoMdContacts className="w-7 h-7" />
                  </div>
                </div>
                <img
                  src={ImageProfile[values.sexo]?.image ?? "/placeholder/user.png"}
                  alt={ImageProfile[values.sexo]?.alt}
                  className="w-14 h-14 rounded-full mr-6 "
                />
                {/* <div className="w-1/2 flex items-center justify-center"> */}
                <InputField
                  //placeholder="960 66 66 66"
                  name="telefono"
                  label={t("phone")}
                  type="telefono"
                />
                {/* </div> */}
              </div>
              <div className="w-full md:grid md:grid-cols-4 items-center justify-center space-x-3">
                {/* <div className="col-span-1 hidden*">
                  <SelectField
                    name={"tituloInvitado"}
                    label={t("titulo")}
                    options={titleInvitado}
                    nullable={true}
                  />
                </div> */}
                <div className="col-span-3">

                  <InputField
                    //placeholder="Ej. Francisco Montilla"
                    name="nombre"
                    label={t("name")}
                    type="text"
                  />
                </div>
              </div>
              <div className=" w-full h-full flex gap-6">
                <div className="w-1/2 flex-col flex gap-2 relative">
                  <BooleanSwitch
                    label={t("sex")}
                    lista={["hombre", "mujer"]}
                    name="sexo"
                  />
                </div>
                <div className="w-1/2 flex-col flex gap-2 relative">
                  <BooleanSwitch
                    label={t("age")}
                    lista={["adulto", "niño"]}
                    name="grupo_edad"
                  />
                </div>
              </div>
              <div className="w-full flex items-center justify-center">
                <InputField
                  //placeholder="Ej. jhon@doe.com"
                  name="correo"
                  label={t("email")}
                  type="email"
                />
              </div>
              <div className="w-full h-8 flex flex-col relative text-sm mb-7">
                <SelectField
                  name={"rol"}
                  label={t("role")}
                  options={event.grupos_array}
                  nullable={true}
                />
              </div>
              <div className="w-full h-full flex gap-6">
                <div className="w-1/2   ">
                  <SelectField
                    name={"nombre_menu"}
                    label={t("menu")}
                    options={[...event?.menus_array?.map(elem => elem.nombre_menu), "sin menú"]}
                  />
                </div>
                <div className="w-1/2">
                  <InputField
                    name="passesQuantity"
                    label={t("nocompanions")}
                    type="number"
                  />
                </div>
              </div>
              <button
                className={`font-display rounded-full py-2 px-6 text-white font-medium transition w-full hover:opacity-70  ${isSubmitting ? "bg-secondary" : "bg-primary"
                  }`}
                disabled={isSubmitting}
                type="submit"
              >
                {t("createguest")}
              </button>
            </div>
          </Form>
        )
      }}
    </Formik>
  );
};

export default FormInvitado;

const ResetForm = ({ setFieldValue, resetForm, contact }) => {
  useEffect(() => {
    if (contact) {
      resetForm()
      //aquí formatear todos los numeros de télefonos iguales
      const contacto = {
        telefono: contact?.phones[0],
        nombre: contact?.name,
        correo: contact?.email
      }

      for (let clave in contacto) {
        setFieldValue(clave, contacto[clave])
      }
    }
  }, [contact])
  return null
}

interface propsBooleanSwitch extends HtmlHTMLAttributes<HTMLInputElement> {
  lista: string[];
  label: string;
  name: string;
  disabled?: boolean;
}

export const BooleanSwitch: FC<propsBooleanSwitch> = ({ lista, label, disabled, ...props }) => {
  const { t } = useTranslation();
  const [field, meta, { setValue }] = useField({ name: props.name });
  const [hoverRef, isHovered] = useHover();

  return (
    <div className=" relative w-full">
      <label className="font-display text-sm text-primary w-full capitalize">
        {label}
      </label>
      <div className="flex h-8 items-center justify-center relative">
        <div
          value={lista[0]}
          onClick={() => !disabled && setValue(lista[0])}
          {...props}
          {...field}
          className={`font-display text-center w-1/2 h-8 border text-gray-500 border-gray-100 py-1 text-sm rounded-l-lg focus:outline-none ${!disabled && "hover:bg-secondary hover:text-white"} capitalize cursor-pointer transition ${meta.value == lista[0] ? "bg-secondary text-white" : "bg-white"
            }`}
        >
          {lista[0]}
        </div>
        <div
          value={lista[1]}
          onClick={() => !disabled && setValue(lista[1])}
          {...props}
          {...field}
          className={`w-1/2 h-8 font-display text-center text-gray-500 border border-gray-100 py-1 text-sm rounded-r-lg focus:outline-none ${!disabled && "hover:bg-primary hover:text-white"} capitalize cursor-pointer transition ${meta.value == lista[1] ? "bg-primary text-white" : "bg-white"
            }`}
        >
          {lista[1]}
        </div>
        {disabled && <div ref={hoverRef} className="w-full h-full z-10 absolute"></div>}
      </div>
      {isHovered && (
        <div className="transform translate-y-1 bg-gray-700 absolute z-10 top-14 rounded-lg text-white px-3 py-1 text-xs">
          {t("lockedfield")}
        </div>
      )}
      {meta.touched && meta.error && (
        <p className="font-display absolute rounded-xl text-xs left-0 bottom-0 transform translate-y-full text-red flex gap-1">
          <WarningIcon className="w-4 h-4" />
          {meta.error}
        </p>
      )}
    </div>

  );
};
