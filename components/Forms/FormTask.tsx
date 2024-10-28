import { Form, Formik, useFormikContext } from "formik";
import { FC, useEffect } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { Task } from "../../utils/Interfaces";
import { ResponsableSelector } from "../Itinerario/MicroComponente";
import { MyEditor } from "../Itinerario/MicroComponente/QuillText";
import { EditTastk } from "../Itinerario/MicroComponente/ItineraryPanel";
import { useAllowedRouter } from "../../hooks/useAllowed";
import InputAttachments from "./InputAttachments";
import { InputTags } from "./InputTags";

interface propsFormTask {
  state: EditTastk;
  set: any;
  itinerarioID: string
}

const FormTask: FC<propsFormTask> = ({ state, set, itinerarioID }) => {
  const { t } = useTranslation();
  const { geoInfo, config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()
  const [isAllowedRouter, ht] = useAllowedRouter()
  console.log(100049, state.values.fecha, new Date(state?.values.fecha))
  const initialValues: Task = {
    ...state?.values,
    fecha: state?.values?.fecha ? new Date(state?.values.fecha).toISOString().split('T')[0] : undefined,
    hora: state?.values?.fecha ? new Date(state?.values.fecha).toTimeString().split(' ')[0] : undefined,
  }

  const handleSubmit = async (values: any, actions: any) => {
    try {
      let dataSend
      const d = values?.fecha?.split("-")
      const h = values?.hora?.split(":")
      dataSend = {
        ...values,
        ...((values?.fecha && values?.hora) && { fecha: new Date(d[0], d[1] - 1, d[2], h[0], h[1]) })
      }
      delete dataSend.hora
      fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID,
          taskID: values._id,
          variable: "all",
          valor: JSON.stringify(dataSend)
        },
        domain: config.domain
      })
        .then(() => {
          const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerarioID)
          const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id)
          event.itinerarios_array[f1].tasks[f2] = dataSend
          setEvent({ ...event })
          toast("success", t("Item guardado con exito"))
          set({ state: false })
        })
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
        return (
          <Form className="w-full">
            <AutoSubmitToken />
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
                label={t("name")}
                type="text"
              />
              <InputField
                name="fecha"
                label={t("Fecha")}
                type="date"
                deleted={window?.location?.pathname === "/servicios"}
              />
              <div className="w-full flex space-x-2">
                <InputField
                  name="hora"
                  label={t("Hora")}
                  type="time"
                  deleted={window?.location?.pathname === "/servicios"}
                />
                <div className="flex items-end space-x-1 w-1/3">
                  <InputField
                    name="duracion"
                    label={t("duraction")}
                    type="number"
                    deleted={window?.location?.pathname === "/servicios"}
                  />
                  <span className="-translate-y-2">min</span>
                </div>
              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full capitalize`}>responsables</label>
                <div className="w-full relative">
                  <ResponsableSelector name="responsable" handleChange={handleBlurData} disable={false} />
                </div>
              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full capitalize`}>items</label>
                <MyEditor name="tips" />
              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full capitalize`}>etiquetas</label>
                <InputTags
                  name="tags"
                  label={t("etiquetas")}
                />
              </div>
              <div className="w-full flex pb-0">
                <InputAttachments
                  name="attachments"
                  label="archivos adjuntos"
                  itinerarioID={itinerarioID}
                  task={state?.values}
                />
              </div>
              <button
                className={`font-display rounded-full py-2 px-6 text-white font-medium transition w-full hover:opacity-70  ${isSubmitting ? "bg-secondary" : "bg-primary"
                  }`}
                disabled={isSubmitting}
                //  type="submit"
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(values, "actions")
                }}
                type="button"
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

const AutoSubmitToken = () => {
  const { values, errors } = useFormikContext();
  useEffect(() => {
    console.log("errors", errors)
  }, [errors]);

  useEffect(() => {
    console.log(100030, values)
  }, [values]);

  return null;
};