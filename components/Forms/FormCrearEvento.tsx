import { Form, Formik, FormikValues } from "formik";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventsGroupContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { useToast } from "../../hooks/useToast";
import * as yup from "yup";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslation } from 'react-i18next';

// formatear fecha
const getDate = (f: Date): string => {
  const y = `${f.getFullYear()}`
  const m = f.getMonth() < 10 ? `0${f.getMonth() + 1}` : `${f.getMonth() + 1}`
  const d = f.getDate() < 10 ? `0${f.getDate()}` : `${f.getDate()}`
  return `${y}-${m}-${d}`
}

const validationSchema = yup.object().shape({
  nombre: yup.string().required("Nombre de evento requerido"),
  tipo: yup.string().required("No has seleccionado un tipo de evento"),
});

interface propsFromCrearEvento {
  state: boolean
  set: Dispatch<SetStateAction<boolean>>
  EditEvent?: boolean
}

const FormCrearEvento: FC<propsFromCrearEvento> = ({ state, set, EditEvent }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider()
  const { user, config } = AuthContextProvider();
  const { setEventsGroup, eventsGroup } = EventsGroupContextProvider();
  const toast = useToast();
  const [valir, setValir] = useState(false)

  type MyValues = {
    nombre: string
    tipo: string
    fecha: string
    pais: string
    poblacion: string
    usuario_id: string
    usuario_nombre: string
  }

  const initialValues: MyValues = EditEvent ?
    {
      ...event,
      fecha: new Date(parseInt(event.fecha)).toJSON().slice(0, -14)
    }
    : {
      nombre: "",
      tipo: "",
      fecha: new Date().toJSON(),
      pais: "",
      poblacion: "",
      usuario_id: user?.uid,
      usuario_nombre: user?.displayName,
    }

  const createEvent = async (values: Partial<Event>) => {
    try {
      const crearEvento: Partial<Event> = await fetchApiEventos({
        query: queries.eventCreate,
        variables: { ...values, development: config?.development },
      });
      if (crearEvento) {
        setEventsGroup({ type: "ADD_EVENT", payload: crearEvento });

      }
      toast("success", "Evento creado con exito");
    } catch (error) {
      toast("error", "Ha ocurrido un error al crear el evento");
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


  const updateEvent = async (values) => {
    try {
      values.fecha = new Date(values.fecha).getTime()
      await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, variable: "nombre", value: values.nombre }, token: null
      })
      await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, variable: "tipo", value: values.tipo }, token: null
      })
      const result = await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: values._id, variable: "fecha", value: values.fecha.toString() }, token: null
      })
      setEvent({ ...event, ...values })
      toast("success", "Evento actualizado con exito")
    } catch (error) {
      toast("error", "Ha ocurrido un error al modificar el evento");
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
    "desdepida de soltero",
    "otro",
  ];

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting }) => (

        <Form className="w-full">
          <div className="border-l-2 border-gray-100 pl-3 w-full ">
            <h2 className="font-display text-3xl capitalize text-primary font-light">
              {EditEvent ? "Editar" : "Crear"}
            </h2>
            <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
              {t("event")}
            </h2>
          </div>
          <div
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 py-6 w-full"
          >
            <div className="">
              <InputField
                placeholder="Ej. Cumpleaños de Ana"
                name="nombre"
                label={t("nameevent")}
              />
            </div>

            <div>
              <SelectField
                name="tipo"
                label={t("eventtype")}
                options={ListaTipo}
              />
            </div>

            <InputField
              name="fecha"
              label={t("eventdate")}
              type="date"
            />

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
      )}
    </Formik>
  );
};

export default FormCrearEvento;
