import { Form, Formik, FormikValues } from "formik";
import { EventContextProvider } from "../../context";
import InputField from "./InputField";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Dispatch, FC, SetStateAction } from "react";
import { useTranslation } from 'react-i18next';

interface propsFormCrearMesa {
  modelo: string | null,
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
}

const FormGuardarRegalos: FC<propsFormCrearMesa> = ({ modelo, set, state }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const { listaRegalos }: any = await fetchApiEventos({
        query: queries.guardarListaRegalos,
        variables: {
          evento_id: event._id,
          variable_reemplazar: "listaRegalos",
          valor_reemplazar: values.valor_reemplazar
        }
      })
      setEvent((old) => ({ ...old, listaRegalos }));
      toast("success", "se guardo tu lista de regalos")

    } catch (err) {
      toast("error", "Ha ocurrido un error al guardar la lista")
      console.log(err);
    } finally {
      actions.setSubmitting(false);
      set(!state)
    }
  }

  const initialValues = {
    valor_reemplazar: event.listaRegalos,
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="text-gray-900 grid gap-4 pt-2">
          <div className=" gap-2 w-full">
            <div className="col-span-2 flex flex-col gap-6">
              <InputField
                name="valor_reemplazar"
                label={t("linkgiftlist")}
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
              {t("save")}
            </button>

            <button
              className=" bg-gray-400 transition w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1 focus:outline-none hover:opacity-80 "
              onClick={() => set(false)}
            >
              {t("cancel")}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default FormGuardarRegalos;