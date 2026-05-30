import { Formik } from "formik";
import { useContext, useState } from "react";
import { fetchApiBodas } from "../../utils/Fetching";
import { EventContextProvider } from "../../context";
import { capitalize } from '../../utils/Capitalize';
import InputField from "./InputField";
import { useTranslation } from 'react-i18next';

type FormValues = { nombre: string };
type Categoria = { _id: string; nombre: string; [key: string]: any };
type Props = { set: (v: boolean) => void; state: boolean; categoria: Categoria };

const validacion = (values: FormValues) => {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.nombre) {
    errors.nombre = "Nombre no valido";
  }

  return errors;
};

const FormEditarCategoria = ({ set, state, categoria }: Props) => {
  const { event, setEvent } = EventContextProvider() as any;
  return (
    <Formik
      initialValues={{
        nombre: categoria?.nombre && capitalize(categoria?.nombre),
      }}
      onSubmit={async (values, actions) => {
        try {
          actions.setSubmitting(true);
          await fetchApiBodas({
            query: `mutation($evento_id:ID!,$categoria_id:ID!,$updates:CategoriaPresupuestoUpdateInput!){
              actualizarCategoriaPresupuesto(evento_id:$evento_id, categoria_id:$categoria_id, updates:$updates){
                success errors{ field message code }
              }
            }`,
            variables: {
              evento_id: event?._id,
              categoria_id: categoria._id,
              updates: { nombre: values.nombre },
            },
          });
        } catch (error) {
        } finally {
          set(!state);
          setEvent(old => {
            const index = old?.presupuesto_objeto?.categorias_array?.findIndex(item => item._id == categoria._id)
            old.presupuesto_objeto.categorias_array[index].nombre = values.nombre
            return { ...old }
          });
          actions.setSubmitting(false);
        }
      }}
      validate={validacion}
    >
      {(props) => <BasicForm {...props} />}
    </Formik>
  );
};

export default FormEditarCategoria;

type BasicFormProps = {
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  values: FormValues;
  handleBlur: (e: React.FocusEvent<any>) => void;
};

export const BasicForm = ({
  handleChange,
  handleSubmit,
  isSubmitting,
  values,
  handleBlur,
}: BasicFormProps) => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col">
      <div className="border-l-2 border-gray-100 pl-3 w-full ">
        <h2 className="font-display text-3xl capitalize text-primary font-light">
          {t("edit")} <br />
          <span className="font-display text-5xl capitalize text-gray-500 font-medium">
            {t("category")}
          </span>
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-6 w-full">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center box-content">
            <img
              src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
              alt="imagen-invitados"
              className="w-12 h-12 rounded-full mr-6 "
            />
            <InputField
              name="nombre"
              label={t("categoryname")}
              onChange={handleChange}
              value={values.nombre}
              onBlur={handleBlur}
              type="text"
              autoFocus
            />
          </div>
        </div>
        <button
          className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
            }`}
          disabled={isSubmitting}
          type="submit"
        >
          {t("editcategory")}
        </button>
      </form>
    </div>
  );
};