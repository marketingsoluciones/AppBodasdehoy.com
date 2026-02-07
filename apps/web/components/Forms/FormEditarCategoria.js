import { Formik } from "formik";
import { useContext, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { capitalize } from '../../utils/Capitalize';
import InputField from "./InputField";
import { useTranslation } from 'react-i18next';

const validacion = (values) => {
  let errors = {};
  if (!values.nombre) {
    errors.nombre = "Nombre no valido";
  }

  return errors;
};

const FormEditarCategoria = ({ set, state, categoria }) => {
  const { event, setEvent } = EventContextProvider()
  return (
    <Formik
      initialValues={{
        nombre: categoria?.nombre && capitalize(categoria?.nombre),
      }}
      onSubmit={async (values, actions) => {
        const params = {
          query: `mutation{
            editCategoria(evento_id:"${event?._id}", categoria_id: "${categoria._id}", nombre: "${values.nombre}"){
             coste_final
            }
          }
          `,
          variables: {},
        };

        try {
          actions.setSubmitting(true);
          await api.ApiApp(params);
        } catch (error) {
          console.log(error);
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

export const BasicForm = ({
  handleChange,
  handleSubmit,
  isSubmitting,
  values,
  handleBlur,
}) => {
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
