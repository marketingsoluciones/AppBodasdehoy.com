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
import { Task } from "../../utils/Interfaces";

interface propsFormTask {
  state: any;
  set: any;
}

const FormTask: FC<propsFormTask> = ({ state, set }) => {
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
    correo: yup.string().email("El formato del correo no es valido").required("Correo requerido").test("Unico", `Correo asignado a otro invitado`, (value) => {
      return !event.invitados_array.map(item => item?.correo).includes(value)
    }).email("Formato invalido")

  });

  const initialValues = {
    description: "",
    title: "",
    date: new Date(),
    time: "",
    duration: 30,
    responsables: [],
    tips: "",
    attachment: [],
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

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting, values, setFieldValue, resetForm }) => {

        return (
          <Form>
            <ResetForm setFieldValue={setFieldValue} resetForm={resetForm} contact={contact} />
            <div className="border-l-2 border-gray-100 pl-3 my-2 w-full ">
              <h2 className="font-display text-3xl capitalize text-primary font-light">
                {t("create")}
              </h2>
              <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
                {t("task")}
              </h2>
            </div>

            <div className="text-gray-500 font-body flex flex-col gap-4 w-full">

              <div className="w-full flex items-center justify-center">
                <InputField
                  //placeholder="Ej. Francisco Montilla"
                  name="titulo"
                  label={t("title")}
                  type="text"
                />
              </div>
              <div className="w-full flex items-center justify-center">
                fecha
              </div>
              <div className=" w-full h-full flex gap-6">
                <div className="w-1/2 flex-col flex gap-2 relative">
                  hora
                </div>
                <div className="w-1/2 flex-col flex gap-2 relative">
                  duracion
                </div>
              </div>

              <div className="w-full h-8 flex flex-col relative text-sm mb-7">
                responsables
              </div>

              <div className="w-full h-full flex gap-6">
                tips
              </div>
              <div className="w-full h-full flex gap-6">
                Cargar archivo
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

export default FormTask;

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
