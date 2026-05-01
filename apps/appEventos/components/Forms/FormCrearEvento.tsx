import { Form, Formik, FormikValues, useFormikContext } from "formik";
import { fetchApiBodas, fetchApiEventos, getApiErrorMessage, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventsGroupContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { useToast } from "../../hooks/useToast";
import * as yup from "yup";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslation } from 'react-i18next';
import { normalizeInvitados, normalizeMenus } from '../../utils/mcpSchemaAdapter';
import { Event, image } from "../../utils/Interfaces";
import ModuloSubida, { subir_archivo } from "../Invitaciones/ModuloSubida";
import { defaultImagenes } from "../Home/Card";
import SelectWithSearchField from "./SelectWithSearchField";
import { useDateTime } from "../../hooks/useDateTime";
import { getAuth } from "firebase/auth";

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
      .required(t("Selecciona una fecha válida"))
      .test("future", t("Selecciona una fecha válida"), (value) => {
        if (!value) return false
        // Comparar sólo fechas (sin hora) para que "hoy" sea válido
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const d = new Date(value + 'T00:00:00')
        return d >= today
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
      usuario_id: user?.uid || "",
      usuario_nombre: user?.displayName || user?.email || "",
      imgEvento: undefined
    }

  const createEvent = async (values: Partial<Event>) => {
    try {
      const imagePreviewUrl = values?.imgEvento
      delete values?.imgEvento
      
      // Convertir fecha YYYY-MM-DD a timestamp UTC para evitar desfases de zona horaria
      let fechaTimestamp = values.fecha;
      if (values.fecha && typeof values.fecha === 'string') {
        if (values.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
          fechaTimestamp = new Date(values.fecha + 'T00:00:00Z').getTime().toString();
        } else if (!isNaN(Number(values.fecha))) {
          fechaTimestamp = values.fecha;
        } else {
          const parsed = new Date(values.fecha).getTime();
          fechaTimestamp = isNaN(parsed) ? '' : parsed.toString();
        }
      }

      const usuario_id =
        (typeof getAuth().currentUser?.uid === "string" && getAuth().currentUser.uid.length ? getAuth().currentUser.uid : null) ||
        (typeof user?.uid === "string" && user.uid.length ? user.uid : null) ||
        (typeof (values as any)?.usuario_id === "string" && (values as any).usuario_id.length ? (values as any).usuario_id : null)
      const usuario_nombre =
        ((typeof getAuth().currentUser?.displayName === "string" && getAuth().currentUser.displayName.length ? getAuth().currentUser.displayName : null) ||
          (typeof getAuth().currentUser?.email === "string" && getAuth().currentUser.email.length ? getAuth().currentUser.email : null)) ||
        (typeof user?.displayName === "string" && user.displayName.length ? user.displayName : null) ||
        (typeof user?.email === "string" && user.email.length ? user.email : null) ||
        (typeof (values as any)?.usuario_nombre === "string" && (values as any).usuario_nombre.length ? (values as any).usuario_nombre : null)

      if (!usuario_id || !usuario_nombre) {
        throw new Error("Falta información de usuario (uid/nombre). Refresca la página e inténtalo de nuevo.")
      }

      const event: Partial<Event> = await fetchApiEventos({
        query: queries.eventCreate,
        variables: {
          ...values,
          usuario_id,
          usuario_nombre,
          fecha: fechaTimestamp,
          development: config?.development
        },
      });
      if (event) {
        event.invitados_array = normalizeInvitados((event as any).invitados)
        event.menus_array = normalizeMenus((event as any).menus)
        const imgEvento = await subir_archivo({ imagePreviewUrl, event, use: "imgEvento" })
        const eventWithImg = { ...event, imgEvento }
        setEventsGroup({ type: "ADD_EVENT", payload: eventWithImg });
        // Persistir en localStorage para que el guest pueda ver el evento tras reload
        if (user?.displayName === 'guest') {
          try {
            const key = `guest_events_${user.uid}`
            const existing = JSON.parse(localStorage.getItem(key) || '[]')
            localStorage.setItem(key, JSON.stringify([...existing, eventWithImg]))
          } catch { /* ignorar si no hay localStorage */ }
        }
        fetchApiBodas({
          query: queries.updateUser,
          variables: {
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
      const msg =
        getApiErrorMessage(error) ||
        (typeof error?.message === "string" && error.message.length ? error.message : null) ||
        t("Ha ocurrido un error al crear el evento")
      toast("error", msg);
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
      const imagePreviewUrl = values?.imgEvento
      values.fecha = new Date(values.fecha).getTime().toString()
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

      let updatedValues = { ...event, ...values }

      if (imagePreviewUrl?.file) {
        const imgEvento = await subir_archivo({ imagePreviewUrl, event, use: "imgEvento" })
        if (imgEvento) {
          updatedValues = { ...updatedValues, imgEvento }
        }
      }

      if (values.fecha !== event.fecha || values.tipo !== event.tipo || values.nombre !== event.nombre || values.timeZone !== event.timeZone || imagePreviewUrl?.file) {
        setEvent(updatedValues)
        toast("success", t("Evento actualizado con exito"))
      }
    } catch (error) {
      const msg =
        getApiErrorMessage(error) ||
        (typeof error?.message === "string" && error.message.length ? error.message : null) ||
        t("Ha ocurrido un error al modificar el evento")
      toast("error", msg);
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
        const isLocal =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        const rawDomain = typeof config?.domain === "string" ? config.domain : ""
        const cookieDomain =
          rawDomain && !rawDomain.startsWith(".")
            ? `.${rawDomain.replace(/^https?:\/\//, "").split("/")[0]}`
            : rawDomain || undefined
        Cookies.set(
          config?.cookieGuest,
          JSON.stringify({ ...cookieContent, eventCreated: true }),
          {
            domain: isLocal ? undefined : cookieDomain,
            expires: dateExpire,
            path: "/",
            secure: typeof window !== "undefined" && window.location.protocol === "https:",
            sameSite: "lax",
          }
        )
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
      enableReinitialize
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
                  <ModuloSubida setValueImage={setValueImage} event={EditEvent ? event : undefined} use={"imgEvento"} defaultImagen={defaultImagenes[values.tipo?.toLowerCase()]} />
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
