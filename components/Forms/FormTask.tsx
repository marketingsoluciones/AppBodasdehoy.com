import { Form, Formik, useFormikContext } from "formik";
import { FC, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import { TaskDateTimeAsString } from "../../utils/Interfaces";
import { MyEditor } from "../Servicios/Utils/QuillText";
import { EditTastk } from "../Itinerario/MicroComponente/ItineraryPanel";
import { useAllowedRouter } from "../../hooks/useAllowed";
import InputAttachments from "./InputAttachments";
import { InputTags } from "./InputTags";
import { ResponsableSelector } from "../Servicios/Utils/ResponsableSelector";

interface propsFormTask {
  showEditTask: EditTastk;
  setShowEditTask: any;
  itinerarioID: string
}

const FormTask: FC<propsFormTask> = ({ showEditTask, setShowEditTask, itinerarioID }) => {
  const { t } = useTranslation();
  const { geoInfo, config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()
  const [isAllowedRouter, ht] = useAllowedRouter()
  const [durationUnit, setDurationUnit] = useState(
    showEditTask?.values?.duracion && showEditTask?.values?.duracion % 60 === 0
      ? "h"
      : "min"
  );

  const initialDuration =
    durationUnit === "h"
      ? (showEditTask?.values?.duracion || 0) / 60
      : showEditTask?.values?.duracion || 0;

  const f = new Date(showEditTask?.values?.fecha)
  const y = f.getFullYear()
  const m = f.getMonth() + 1
  const d = f.getDate()

  const initialValues: TaskDateTimeAsString & { duracionUnidad?: string, horaActiva?: boolean } = {
    ...showEditTask?.values,
    fecha: f ? `${y}-${m < 10 ? "0" : ""}${m}-${d < 10 ? "0" : ""}${d}` : "",
    horaActiva: true,
    duracion: initialDuration,
    duracionUnidad: durationUnit,
  };

  const handleSubmit = async (values: any, actions: any) => {
    try {
      let dataSend
      const d = values?.fecha?.split("-")
      const h = values?.hora?.split(":")

      let duracionEnMinutos =
        values.duracionUnidad === "h"
          ? Number(values.duracion) * 60
          : Number(values.duracion);

      dataSend = {
        ...values,
        duracion: duracionEnMinutos,
        ...(new Date(d[0], d[1] - 1, d[2], h[0], h[1]).getTime() > 0
          ? { fecha: new Date(d[0], d[1] - 1, d[2], h[0], h[1]) }
          : { fecha: "" }),
      };
      delete dataSend.hora;
      delete dataSend.duracionUnidad;
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
          setShowEditTask({ state: false })
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
          <Form className="w-full flex flex-col">
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
              <div className="w-full grid grid-cols-7 space-x-1">
                <div className="col-span-3">
                  <InputField
                    name="hora"
                    label={t("Hora")}
                    type="time"
                    deleted={window?.location?.pathname === "/servicios"}
                  />
                </div>
                <div className="col-span-2">
                  <InputField
                    name="duracion"
                    label={t("duraction")}
                    type="number"
                    deleted={window?.location?.pathname === "/servicios"}
                  />
                </div>
                <div className="col-span-2 flex  items-end">
                  <select
                    name="duracionUnidad"
                    className="border rounded-xl px-2 py-1 text-sm h-[38px] w-[80px] border-gray-300 focus:ring-0 focus:outline-none focus:border-gray-500  "
                    value={values.duracionUnidad}
                    onChange={e => {
                      setDurationUnit(e.target.value);
                      // Actualiza el valor en Formik
                      values.duracionUnidad = e.target.value;
                    }}
                  >
                    <option value="min">min</option>
                    <option value="h">hrs</option>
                  </select>
                  {/* <span className="-translate-y-2">min</span> */}
                </div>

              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full capitalize`}>responsables</label>
                <div className="w-full relative">
                  <ResponsableSelector name="responsable" handleChange={handleBlurData} disable={false} />
                </div>
              </div>
              <div className="w-full h-max relative">
                <label className={` font-display text-primary text-sm w-full capitalize`}>itemss</label>
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
                  task={showEditTask?.values}
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
    // console.log(100030, values)
  }, [values]);

  return null;
};