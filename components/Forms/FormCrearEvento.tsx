import { Form, Formik, FormikValues } from "formik";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventsGroupContextProvider, EventContextProvider } from "../../context";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { useToast } from "../../hooks/useToast";
import * as yup from "yup";
import { Dispatch, FC, SetStateAction } from "react";

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
  initialValues?: any | undefined | null
}

const FormCrearEvento: FC<propsFromCrearEvento> = ({ state, set, initialValues: initialValuesInherited }) => {
  if (initialValuesInherited) {
    const f = new Date(parseInt(initialValuesInherited.fecha))
    initialValuesInherited.fecha = getDate(f)
  }
  const { user } = AuthContextProvider();
  const { setEventsGroup, eventsGroup } = EventsGroupContextProvider();
  const toast = useToast();

  type MyValues = {
    nombre: string
    tipo: string
    fecha: string
    pais: string
    poblacion: string
    usuario_id: string
    usuario_nombre: string
  }

  const initialValues: MyValues = {
    nombre: "",
    tipo: "",
    fecha: getDate(new Date()),
    pais: "",
    poblacion: "",
    usuario_id: user?.uid,
    usuario_nombre: user?.displayName,
  };

  const createEvent = async (values) => {
    try {
      const crearEvento = await fetchApiEventos({
        query: queries.eventCreate,
        variables: values,
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
    }
  }

  const { event, setEvent } = EventContextProvider()
  const updateEvent = async (values) => {
    try {
      console.log("values.fecha.salida", new Date(values.fecha).getTime())
      values.fecha = new Date(values.fecha).getTime()
      console.log("values.fecha.salida", new Date(values.fecha))
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
      /* console.log(result) */
      setEvent({ ...event, ...values })
    } catch (error) {
      toast("error", "Ha ocurrido un error al modificar el evento");
      console.log(error)
    } finally {
      set(!state);
    }
  }

  const handleSubmit = async (values: FormikValues) => {
    if (initialValuesInherited?._id) {
      updateEvent({ ...values })
    } else {
      createEvent(values)
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
      initialValues={initialValuesInherited ?? initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting }) => (

        <Form className="w-full">
          <div className="border-l-2 border-gray-100 pl-3 w-full ">
            <h2 className="font-display text-3xl capitalize text-primary font-light">
              {initialValuesInherited ? "Editar" : "Crear"}
            </h2>
            <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
              Evento
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
                label="Nombre del evento"
              />
            </div>

            <div>
              <SelectField
                name="tipo"
                label="Tipo de evento"
                options={ListaTipo}
              />
            </div>

            <InputField
              name="fecha"
              label="Fecha del evento"
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
              Guardar
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default FormCrearEvento;
