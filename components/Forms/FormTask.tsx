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
import { getDateString, getTimeString } from "../Servicios/VistaTarjeta/TaskNewUtils";
import { DurationTask } from "../Servicios/VistaTarjeta/DurationTask";

interface initialValuesType extends TaskDateTimeAsString {
  duracionUnidad?: string,
  horaActiva?: boolean
}

interface propsFormTask {
  showEditTask: EditTastk;
  setShowEditTask: any;
  itinerarioID: string
}

const FormTask: FC<propsFormTask> = ({ showEditTask, setShowEditTask, itinerarioID }) => {
  const { t } = useTranslation();
  const { config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()
  const [isAllowedRouter, ht] = useAllowedRouter()

  const initialValues: initialValuesType = {
    ...showEditTask?.values,
    fecha: showEditTask?.values.fecha ? getDateString(showEditTask?.values?.fecha) : "",
    hora: showEditTask?.values.fecha && showEditTask?.values.horaActiva ? getTimeString(showEditTask?.values?.fecha) : "",
    duracion: showEditTask?.values.fecha && showEditTask?.values.horaActiva && showEditTask?.values.duracion ? showEditTask?.values.duracion : undefined,
  };

  const handleSubmit = async (values: any, actions: any) => {
    try {
      const d = values?.fecha?.split("-")
      const h = getTimeString(values.fecha)?.split(":").map(elem => Number(elem))
      let duracionEnMinutos =
        values.duracionUnidad === "h"
          ? Number(values.duracion) * 60
          : Number(values.duracion);
      let dataSend = {
        ...values,
        fecha: new Date(`${values.fecha}T${values.hora ? values.hora : "00:00"}`),
        duracion: duracionEnMinutos,
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
          valor: JSON.stringify({ ...dataSend })
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

  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
    // validationSchema={validationSchema}
    >
      {({ isSubmitting, values, setFieldValue }) => {
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
                <div className="col-span-4 flex  items-end">
                  <div className="border* rounded-xl px-2 py-1 text-sm h-[38px] w-[180px] border-gray-300 focus:ring-0 focus:outline-none focus:border-gray-500"                  >
                    <DurationTask
                      handleUpdate={(field: string, value: any) => {
                        return new Promise((resolve) => {
                          setFieldValue(field, value)
                          resolve()
                        })
                      }}
                      canEdit={true} task={{ ...values, duracion: values.duracion }} />
                  </div>
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
  const { values, errors, setFieldValue } = useFormikContext<initialValuesType>();
  useEffect(() => {
    console.log("errors", errors)
  }, [errors]);

  useEffect(() => {
    // console.log(100030, values)
    if (values.hora && values.fecha) {
      setFieldValue("horaActiva", true)
    } else {
      setFieldValue("horaActiva", false)
    }
  }, [values]);

  return null;
};