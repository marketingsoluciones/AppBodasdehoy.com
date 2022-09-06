import { Form, Formik, FormikValues } from "formik";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda } from "../icons";
import InputField from "./InputField";
import * as yup from 'yup'
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Dispatch, FC, SetStateAction } from "react";


interface propsFormCrearMesa {
  modelo: string | null,
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
}

const FormGuardarRegalos: FC<propsFormCrearMesa> = ({ modelo, set, state }) => {
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()

  const validationSchema = yup.object().shape({
    nombre_mesa: yup.string().required().test("Unico", "El nombre debe ser unico", values => {
      return !event.mesas_array.map(item => item.nombre_mesa).includes(values)
    }),
    cantidad_sillas: yup.number().required(),
  });


  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const { mesas_array }: any = await fetchApiEventos({
        query: queries.createTable,
        variables: {
          eventID: event._id,
          tableName: values.nombre_mesa,
          numberChairs: values.cantidad_sillas,
          position: values.defPosicion,
          tableType: values.tipo
        }
      })
      setEvent((old) => ({ ...old, mesas_array }));
      toast("success", "se guardo tu lista de regalos")
    } catch (err) {
      toast("error", "Ha ocurrido un error al guardar la lista")
      console.log(err);
    } finally {
      actions.setSubmitting(false);
      set(!state)
    }
  }
  return (
    <Formik
      /* initialValues={initialValues} */
      initialValues={null}
      /* validationSchema={validationSchema} */
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="text-gray-900 grid gap-4 pt-2">
          <div className=" gap-2 w-full">
            <div className="col-span-2 flex flex-col gap-6">
              <InputField
                name="lista"
                label="link de tu lista de regalos"
                type="text"
                className="bg-gray-100"
              />
            </div>
          </div>


          <div className="w-full grid grid-cols-2 gap-4 px-4 pt-4">
            <button
              disabled={isSubmitting}
              type="submit"
              className=" bg-primary w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1  focus:outline-none"
            >
              guardar
            </button>

            <button
              className=" bg-gray-400 transition w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1 focus:outline-none hover:opacity-80 "
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

export default FormGuardarRegalos;