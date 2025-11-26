import { Form, Formik, FormikValues, useFormikContext } from "formik";
import { fetchApiBodas, fetchApiEventos, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventsGroupContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { useToast } from "../../hooks/useToast";
import * as yup from "yup";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslation } from 'react-i18next';
import { Event, image } from "../../utils/Interfaces";
import ModuloSubida, { subir_archivo } from "../Invitaciones/ModuloSubida";
import { defaultImagenes } from "../Home/Card";
import SelectWithSearchField from "./SelectWithSearchField";
import { useDateTime } from "../../hooks/useDateTime";

interface propsFromCrearEvento {
  state: boolean
  set: Dispatch<SetStateAction<boolean>>
  EditEvent?: boolean
  eventData?: Event
}

const FormCrearEvento: FC<propsFromCrearEvento> = ({ state, set, EditEvent, eventData }) => {
  const { t } = useTranslation();
  const { event: eventOrigin, setEvent } = EventContextProvider()
  const { user, config, setUser } = AuthContextProvider();
  const { setEventsGroup, eventsGroup } = EventsGroupContextProvider();
  const toast = useToast();
  const [valir, setValir] = useState(false)
  const [event] = useState(eventData ? eventData : eventOrigin)
  const [valueImage, setValueImage] = useState()
  const { utcDate } = useDateTime();

  const validationSchema = yup.object().shape({
    nombre: yup.string().required(t("Nombre de evento requerido")),
    tipo: yup.string()
      .required(t("Seleciona el tipo de evento"))
      .test("Unico", t("Seleciona el tipo de evento"), (value) => {
        if (value === "Select") {
          return false
        }
        return true
      }),
    fecha: yup.string()
      .test("Unico", t("Selecciona una fecha válida"), (value) => {
        const d = new Date(value).getTime()
        if (new Date().getTime() > d) {
          return false
        }
        return true
      }),
    timeZone: yup.string().required(t("Selecciona una zona horaria")),
  });

  type MyValues = {
    nombre: string
    tipo: string
    fecha: string
    timeZone: string
    pais: string
    poblacion: string
    usuario_id: string
    usuario_nombre: string
    imgEvento?: image
  }

  const initialValues: MyValues = EditEvent ?
    {
      ...event,
      fecha: utcDate(event.fecha),
    }
    : {
      nombre: "",
      tipo: "",
      fecha: "",
      timeZone: "",
      pais: "",
      poblacion: "",
      usuario_id: user?.uid,
      usuario_nombre: user?.displayName,
      imgEvento: undefined
    }

  const createEvent = async (values: Partial<Event>) => {
    try {
      const imagePreviewUrl = values?.imgEvento
      delete values?.imgEvento
      
      //nuevo: para evitar problemas de zona horaria
      let fechaTimestamp = values.fecha;
      if (values.fecha) {
        if (typeof values.fecha === 'string' && values.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
          fechaTimestamp = new Date(values.fecha + 'T00:00:00Z').getTime().toString();
        } else {
          fechaTimestamp = typeof values.fecha === 'string' && !isNaN(Number(values.fecha)) 
            ? values.fecha 
            : new Date(values.fecha).getTime().toString();
        }
      }
      //nuevo: para evitar problemas de zona horaria

      
      const event: Partial<Event> = await fetchApiEventos({
        query: queries.eventCreate,
        variables: { ...values, fecha: fechaTimestamp, development: config?.development },
      });
      if (event) {
        const imgEvento = await subir_archivo({ imagePreviewUrl, event, use: "imgEvento" })
        setEventsGroup({ type: "ADD_EVENT", payload: { ...event, imgEvento } });
        fetchApiBodas({
          query: queries.updateUser,
          variables: {
            uid: user?.uid,
            variable: "eventSelected",
            valor: event?._id
          },
          development: config?.development
        })
        user.eventSelected = event?._id
        setUser(user)
      }
      toast("success", t("successfullycreatedevent"));
    } catch (error) {
      toast("error", t("Ha ocurrido un error al crear el evento"));
      console.log(error);
    } finally {
      set(!state);
      setValir(true)
    }
  }

  useEffect(() => {
    if (valir) {
      setEvent(eventsGroup[eventsGroup?.length - 1])
      setValir(false)
    }
  }, [valir])


  const updateEvent = async (values: any) => {
    try {
      values.fecha = new Date(values.fecha).getTime().toString()
      console.log(values.fecha, event.fecha)
      values.nombre !== event.nombre && await fetchApiEventos({
        query: queries.eventUpdate,
        variables: {
          idEvento: values._id, variable: "nombre",
          value: values.nombre
        }, token: null
      })
      values.tipo !== event.tipo && await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, variable: "tipo", value: values.tipo }, token: null
      })
      values.fecha !== event.fecha && await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, variable: "fecha", value: values.fecha }, token: null
      })
      values.timeZone !== event.timeZone && await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, variable: "timeZone", value: values.timeZone }, token: null
      })
      if (values.fecha !== event.fecha || values.tipo !== event.tipo || values.nombre !== event.nombre || values.timeZone !== event.timeZone) {
        setEvent({ ...event, ...values })
        toast("success", t("Evento actualizado con exito"))
      }
    } catch (error) {
      toast("error", t("Ha ocurrido un error al modificar el evento"));
      console.log(error)
    } finally {
      set(!state);
    }
  }

  const handleSubmit = async (values: FormikValues) => {
    if (EditEvent) {
      updateEvent({ ...values })
    } else {
      createEvent(values)
      if (user?.displayName === "guest" && eventsGroup?.length === 0) {
        const cookieContent = JSON.parse(Cookies.get(config?.cookieGuest))
        const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
        Cookies.set(config?.cookieGuest, JSON.stringify({ ...cookieContent, eventCreated: true }), { domain: `${config?.domain}`, expires: dateExpire })
      }
    }
  };

  const ListaTipo: string[] = [
    "cumpleaños",
    "boda",
    "babyshower",
    "graduación",
    "bautizo",
    "comunión",
    "despedida de soltero",
    "otro",
  ];

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting, values }) => {
        return (
          <Form className="w-full flex flex-col">
            <AutoSubmitToken valueImage={valueImage} />
            <div className="border-l-2 border-gray-100 pl-3 w-full">
              <h2 className="font-display text-3xl capitalize text-primary font-light">
                {EditEvent ? t("edit") : t("create")}
              </h2>
              <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
                {t("event")}
              </h2>
            </div>
            <div onSubmit={handleSubmit} className="flex flex-col gap-5 py-6 w-full flex-1" >
              <div className="">
                <InputField
                  //placeholder="Ej. Cumpleaños de Ana"
                  name="nombre"
                  label={t("nameevent")}
                />
              </div>
              <div>
                <SelectField
                  name="tipo"
                  label={t("eventtype")}
                  options={ListaTipo}
                  nullable={true}
                />
              </div>
              <InputField
                name="fecha"
                label={t("eventdate")}
                type="date"
              />
              <div>
                <SelectWithSearchField
                  name="timeZone"
                  label={t("timeZone")}
                  options={Intl?.supportedValuesOf('timeZone')}
                  nullable={true}
                />
              </div>
              <div className="w-full flex justify-center">
                <div className="relative w-[304px] h-[140px] mb-4">
                  <ModuloSubida setValueImage={setValueImage} event={EditEvent ? event : undefined} use={"imgEvento"} defaultImagen={defaultImagenes[values.tipo]} />
                </div>
              </div>
              {/* <DropdownCountries
            name="pais"
            placeholder="Selecciona el pais"
            label="Selecciona el pais"
            value={values.pais}
            /> */}
              {/* <InputField
            name="poblacion"
            placeholder="Murcia"
            label="Poblacion"
            onChange={handleChange}
            value={values.poblacion}
            type="text"
            autoComplete="off"/> */}
              <button
                disabled={isSubmitting}
                type="submit"
                className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
                  }`}
              >
                {t("save")}
              </button>
            </div>
          </Form>
        )
      }}
    </Formik>
  );
};

export default FormCrearEvento;

const AutoSubmitToken = ({ valueImage }) => {
  const { values, errors, setValues } = useFormikContext();
  useEffect(() => {
    // console.log("errors", errors)
  }, [errors]);

  useEffect(() => {
    // console.log(100030, values)
  }, [values]);

  useEffect(() => {
    // console.log(100031, valueImage)
    const newValues = { ...values as any, imgEvento: valueImage }
    setValues(newValues)
  }, [valueImage]);

  return null;
};
