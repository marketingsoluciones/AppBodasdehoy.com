import { Form, Formik, FormikValues, useField } from "formik";
import { FC, HtmlHTMLAttributes } from "react";
import { EventContextProvider } from "../../context";
import { WarningIcon } from "../icons";
import InputField from "./InputField";
import SelectField from "./SelectField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { ImageProfile } from "../../utils/Funciones";

interface propsFormInvitado {
  state: any;
  set: any;
}

const FormInvitado: FC<propsFormInvitado> = ({ state, set }) => {
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()

  
const validationSchema = yup.object().shape({
  nombre: yup.string().required("Nombre requerido").test("Unico", "El nombre debe ser unico", values => {
    return !event.invitados_array.map(item => item.nombre).includes(values)
}),
  sexo: yup.string().required("Sexo requerido"),
  grupo_edad: yup.string().required("Edad requerido"),
  telefono: yup.string().required("Telefono requerido"),
  rol: yup.string().required("Rol requerido"),
  correo: yup.string().email().test("Unico", "El correo debe ser unico", (value) => {
    return !event.invitados_array.map(item => item.correo).includes(value)
  })
});


  const initialValues = {
    nombre: "",
    sexo: "",
    grupo_edad: "",
    correo: "",
    telefono: "",
    rol: "",
  };

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const result: any = await fetchApiEventos({
        query: queries.createGuests,
        variables: {
          eventID: event._id,
          guestsArray: values,
        },
      });

      setEvent((old) => ({ ...old, invitados_array: result?.invitados_array }));
      toast("success", "Invitado creado con exito")
    } catch (error) {
      toast("error", `Ha ocurrido un error ${error}`)
      console.log(error);
    } finally {
      actions.setSubmitting(false);
      set(!state);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting, values }) => (
        <Form>
          <div className="border-l-2 border-gray-100 pl-3 my-6 w-full ">
            <h2 className="font-display text-3xl capitalize text-primary font-light">
              Crear
            </h2>
            <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
              Invitado
            </h2>
          </div>
          <div className="text-gray-500 font-body flex flex-col gap-8 w-full">
            <div className="input-name w-full h-20 flex items-center justify-center">
              <img
                src={ImageProfile[values.sexo]?.image ?? "/placeholder/user.png"}
                alt={ImageProfile[values.sexo]?.alt}
                className="w-12 h-12 rounded-full mr-6 "
              />
              <InputField
                placeholder="Ej. Francisco Montilla"
                name="nombre"
                label="Nombre"
                type="text"
              />
            </div>

            <div className="w-full h-full flex gap-6">
              <div className="w-1/2 flex-col flex gap-2 relative">
                <BooleanSwitch
                  label="Sexo"
                  lista={["hombre", "mujer"]}
                  name="sexo"
                />
              </div>
              <div className="w-1/2 flex-col flex gap-2 relative">
                <BooleanSwitch
                  label="Edad"
                  lista={["adulto", "niño"]}
                  name="grupo_edad"
                />
              </div>
            </div>
            <div className="w-full h-full flex gap-6">
              <div className="w-1/2 flex items-center justify-center">
                <InputField
                  placeholder="Ej. jhon@doe.com"
                  name="correo"
                  label="Correo"
                  type="email"
                />
              </div>

              <div className="w-1/2 flex items-center justify-center">
                <InputField
                  placeholder="960 66 66 66"
                  name="telefono"
                  label="Telefono"
                  type="tel"
                />
              </div>
            </div>
            <div className="w-full h-full h-8 flex flex-col relative text-sm">
              <SelectField
                name={"rol"}
                label={"Rol"}
                options={event.grupos_array}
              />
            </div>

            <button
              className={`font-display rounded-full py-2 px-6 text-white font-medium transition w-full hover:opacity-70  ${
                isSubmitting ? "bg-secondary" : "bg-primary"
              }`}
              disabled={isSubmitting}
              type="submit"
            >
              Crear invitado
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default FormInvitado;

interface propsBooleanSwitch extends HtmlHTMLAttributes<HTMLInputElement> {
  lista: string[];
  label: string;
  name: string;
}

export const BooleanSwitch: FC<propsBooleanSwitch> = ({ lista, label, ...props }) => {
  const [field, meta, { setValue }] = useField({ name: props.name });

  return (
    <div className=" relative w-full">
      <label className="font-display text-sm text-primary w-full capitalize">
        {label}
      </label>
      <span className="flex flex h-6 items-center justify-center">
        <button
          value={lista[0]}
          onClick={() => setValue(lista[0])}
          type="button"
          {...props}
          {...field}
          className={`font-display w-1/2 h-8 border text-gray-500 border-gray-100 py-1 text-sm rounded-l-lg focus:outline-none hover:bg-secondary hover:text-gray-700 capitalize  transition ${
            meta.value == lista[0] ? "bg-secondary text-gray-500" : "bg-white"
          }`}
        >
          {lista[0]}
        </button>
        <button
          value={lista[1]}
          onClick={() => setValue(lista[1])}
          type="button"
          {...props}
          {...field}
          className={`w-1/2 h-8 font-display text-gray-500 border border-gray-100 py-1 text-sm rounded-r-lg focus:outline-none hover:bg-primary hover:text-white capitalize transition ${
            meta.value == lista[1] ? "bg-primary text-white" : "bg-white"
          }`}
        >
          {lista[1]}
        </button>
      </span>
      {meta.touched && meta.error && (
        <p className="font-display absolute rounded-xl text-white text-xs left-0 bottom-0 transform translate-y-full text-red flex gap-1">
          <WarningIcon className="w-4 h-4" />
          {meta.error}
        </p>
      )}
    </div>
  );
};
