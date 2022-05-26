import { Form, Formik, FormikValues } from "formik";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventsGroupContextProvider } from "../../context";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { useToast } from "../../hooks/useToast";
import * as yup from "yup";
import { Dispatch, FC, SetStateAction } from "react";

const validationSchema = yup.object().shape({
  nombre: yup.string().required("Nombre de evento requerido"),
  tipo: yup.string().required("No has seleccionado un tipo de evento"),
});

interface propsFromCrearEvento {
  state: boolean
  set: Dispatch<SetStateAction<boolean>>
  initialValues?: any | undefined | null
}

const FormCrearEvento : FC <propsFromCrearEvento> = ({ state, set , initialValues : initialValuesInherited }) => {
  const { user } = AuthContextProvider();
  const { setEventsGroup, eventsGroup } = EventsGroupContextProvider();
  const toast = useToast();

  type MyValues ={
    nombre: string
    tipo: string
    fecha: Date
    pais: string
    poblacion: string
    usuario_id: string
    usuario_nombre: string
  }

  const initialValues : MyValues = {
    nombre: "",
    tipo: "",
    fecha: new Date(),
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
        setEventsGroup({type: "ADD_EVENT", payload: crearEvento});
      }
      toast("success", "Evento creado con exito");
    } catch (error) {
      toast("error", "Ha ocurrido un error al crear el evento");
      console.log(error);
    } finally {
      set(!state);
    }
  }

  const updateEvent = async (values) => {
    alert("NO HAY ENDPOINT")
  }
  const handleSubmit = async (values: FormikValues) => {
    if(initialValuesInherited?._id){
      updateEvent(values)
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
      {({isSubmitting}) => (

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
            className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${
              isSubmitting ? "bg-secondary" : "bg-primary"
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
