import { Form, Formik, FormikValues, useField } from "formik";
import { FC, useEffect } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { phoneUtil } from "../../utils/Authentication";
import { useTranslation } from 'react-i18next';
import { Itinerary, Task } from "../../utils/Interfaces";
import { Duration, ResponsableSelector } from "../Itinerario/MicroComponente";
import { InputTime } from "./inputs/InputTime";
import { MyEditor } from "../Itinerario/MicroComponente/QuillText";
import { EditTastk } from "../Itinerario/MicroComponente/ItineraryPanel";
import { useAllowedRouter } from "../../hooks/useAllowed";
import { PlusIcon } from "../icons";
import { IoIosAttach } from "react-icons/io";
import InputAttachments from "./InputAttachments";
import { InputTags } from "./InputTags";

interface propsFormTask {
  state: EditTastk;
  set: any;
}

const FormTask: FC<propsFormTask> = ({ state, set }) => {
  const { t } = useTranslation();
  const { geoInfo } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()
  const [isAllowedRouter, ht] = useAllowedRouter()




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
        return //isPhoneValid(value)
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

  console.log(100035, new Date(state?.values.fecha).toISOString().split('T')[1])
  const initialValues: Task = {
    ...state?.values,
    fecha: new Date(state?.values.fecha).toISOString().split('T')[0],
    hora: new Date(state?.values.fecha).toTimeString().split(' ')[0],
    // responsable: ["Invitados"]
    attachments: [{ _id: "id", name: "archivo", url: "https://api.bodasdehoy.com/uploads/86f9db/INSTAGRAM%20avatar_insta%20avatar-i320.webp", size: 1034 }]
  }


  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      console.log(values)
      //setEvent((old) => ({ ...old, invitados_array: result?.invitados_array }));
      toast("success", t("Item guardado con exito"))
    } catch (error) {
      toast("error", `${t("Ha ocurrido un error")} ${error}`)
      console.log(error);
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
      {({ isSubmitting, values }) => {
        console.log(100030, values)
        return (
          <Form className="w-full">
            <div className="border-l-2 border-gray-100 my-2 w-full ">
              <h2 className="font-display text-3xl capitalize text-primary font-light">
                {t("create")}
              </h2>
              <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
                {t("task")}
              </h2>
            </div>

            <div className="text-gray-500 font-body flex flex-col gap-4 w-full">

              <InputField
                name="descripcion"
                label={t("title")}
                type="text"
              />
              <InputField
                name="fecha"
                label={t("fecha")}
                type="date"
              />
              <div className="w-full flex space-x-2">
                <InputField
                  name="hora"
                  label={t("hora")}
                  type="time"
                />
                <div className="flex items-end space-x-1 w-1/3">
                  <InputField
                    name="duracion"
                    label={t("duracion")}
                    type="number"
                  />
                  <span className="-translate-y-2">min</span>
                </div>
              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full `}>responsables</label>
                <div className="w-full relative">
                  <ResponsableSelector name="responsable" handleChange={handleBlurData} disable={false} />
                </div>
              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full `}>items</label>
                <MyEditor />
              </div>
              <div className="w-full flex pb-0">
                <InputAttachments
                  name="attachments"
                  label="archivos adjuntos"
                />
              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full `}>etiquetas</label>
                <InputTags
                  name="tags"
                  label={t("etiquetas")}
                />
              </div>
              <button
                className={`font-display rounded-full py-2 px-6 text-white font-medium transition w-full hover:opacity-70  ${isSubmitting ? "bg-secondary" : "bg-primary"
                  }`}
                disabled={isSubmitting}
                type="submit"
              >
                {t("save")}
              </button>
            </div>
          </Form>
        )
      }}
    </Formik >
  );
};

export default FormTask;

