import { Form, Formik, FormikValues } from "formik";
import { EventContextProvider } from "../../context";
import InputField from "./InputField";
import * as yup from 'yup'
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Dispatch, FC, SetStateAction } from "react";


interface propsFormEditarMesa {
  modelo: string | null,
  set: Dispatch<SetStateAction<boolean>>
  state: any
}

type initialValues = {
  nombre_mesa: string
}

const FormEditarMesa: FC<propsFormEditarMesa> = ({ modelo, set, state }) => {
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()

  const validationSchema = yup.object().shape({
    nombre_mesa: yup.string().required().test("Unico", "El nombre debe ser unico", values => {
      if (values == state.mesa.nombre_mesa) {
        return true
      }
      return !event.mesas_array.map(item => item.nombre_mesa).includes(values)
    }),
  });

  const initialValues: initialValues = {
    nombre_mesa: state.mesa.nombre_mesa,
  }

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const resp: any = await fetchApiEventos({
        query: queries.editNameTable,
        variables: {
          eventID: event._id,
          tableID: state.mesa._id,
          variable: "nombre_mesa",
          valor_reemplazar: values.nombre_mesa
        }
      })
      const mesas_array = event.mesas_array.map(item => {
        if (item._id == resp._id) {
          return resp
        }
        return item
      })
      setEvent((old) => ({ ...old, mesas_array }));
      toast("success", "Nombre cambiado con exito")
    } catch (err) {
      toast("error", "Ha ocurrido un error al cambiar el nombre")
      console.log(err);
    } finally {
      actions.setSubmitting(false);
      set(!state)
    }
  }
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, isSubmitting }) => (
        <Form className="text-gray-900 grid gap-4 pt-2">
          <div className="grid-cols-3 grid gap-2 w-full">
            <div className="col-span-2 flex flex-col gap-4">
              <InputField
                name="nombre_mesa"
                label="Nuevo nombre de mesa"
                type="text"
              />

            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 px-4 pt-4">
            <button
              disabled={isSubmitting}
              type="submit"
              className=" bg-primary w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1  focus:outline-none"
            >
              Guardar
            </button>
            <button
              className=" bg-gray-200 transition w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1 focus:outline-none hover:opacity-80 "
              onClick={() => set(false)}
            >
              Cancelar
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default FormEditarMesa;