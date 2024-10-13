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
import { Itinerary, Task } from "../../utils/Interfaces";
import { Duration, Responsable } from "../Itinerario/MicroComponente";
import { useAllowedRouter } from "../../hooks/useAllowed";
import { InputTime } from "./inputs/InputTime";
import { MyEditor } from "../Itinerario/MicroComponente/QuillText";
import { EditTastk } from "../Itinerario/MicroComponente/ItineraryPanel";

interface propsFormTask {
  state: EditTastk;
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
  const [isAllowedRouter, ht] = useAllowedRouter()


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
  const initialValues: Task = state?.values
  // {
  //   _id: "",
  //   icon: "",
  //   descripcion: "algo",
  //   fecha: new Date(),
  //   hora: "",
  //   duracion: 30,
  //   responsable: [],
  //   tips: [],
  //   attachments: [],
  // };


  console.log(100031, initialValues)

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
      set({ state: !state.state });
    }
  };

  const handleBlurData = async (variable, valor) => {
    /*  try {
       const result = await fetchApiEventos({
         query: queries.editTask,
         variables: {
           eventID: event._id,
           itinerarioID:  itinerario._id,
           taskID:  task._id ,
           variable,
           valor: variable == "responsable" ? JSON.stringify(valor) : valor
         },
         domain
       })
       setEvent((old) => {
         const f1 = old.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
         if (f1 > -1) {
           const f2 = old.itinerarios_array[f1].tasks.findIndex(elem => elem._id === task._id)
           old.itinerarios_array[f1].tasks[f2][`${variable}`] = valor
         }
         return { ...old }
       })
     } catch (error) {
       console.log(error)
     } */
  }


  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
    // validationSchema={validationSchema}
    >
      {({ isSubmitting, values, setFieldValue, resetForm }) => {
        console.log(100033, values)
        return (
          <Form className="w-full">
            <ResetForm setFieldValue={setFieldValue} resetForm={resetForm} contact={contact} />
            <div className="border-l-2 border-gray-100 my-2 w-full ">
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
                  name="descripcion"
                  label={t("title")}
                  type="text"
                />
              </div>
              <div className="w-full flex items-center justify-center">
                <input type="date" id="start" name="trip-start" value="2018-07-22" min="2018-01-01" max="2018-12-31" />
              </div>
              <div className=" w-full h-full flex">
                <div className="w-1/2 flex-col flex  relative">
                  <InputTime name="hora" onBlur={() => { handleBlurData("hora", values.time) }} disable={false} ht={ht} />
                </div>
                <div className="w-1/2 flex-col flex  relative ">
                  <Duration name="duracion" onBlur={() => { handleBlurData("duracion", values.duration.toString()) }} disable={false} ht={ht} />
                </div>
              </div>

              <div className="flex flex-col relative text-sm">
                <Responsable name="responsable" handleChange={handleBlurData} disable={false} ht={ht} />
              </div>

              <div className="w-full h-[200px] flex  pb-10">
                <MyEditor />
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