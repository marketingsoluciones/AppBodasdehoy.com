import { Formik } from "formik";
import { useContext, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import InputField from "./InputField";
import { useTranslation } from 'react-i18next';

const validacion = (values) => {
  let errors = {};
  if (!values.nombre) {
    errors.nombre = "Nombre no valido";
  }

  return errors;
};

const FormCrearCategoria = ({ set, state }) => {
  
  const { event, setEvent } = EventContextProvider()
  return (
    <Formik
      initialValues={{
        nombre: "",
      }}
      onSubmit={async (values, actions) => {
        let nuevoCategoria;
        const params = {
          query: `mutation {
            nuevoCategoria(evento_id:"${event?._id}",nombre:"${values?.nombre}"){
              _id
              coste_proporcion
              coste_estimado
              coste_final
              pagado
              nombre
              gastos_array {
                _id
                coste_estimado
                coste_final
                pagado
                nombre
                pagos_array {
                  _id
                  estado
                  fecha_creacion
                  fecha_pago
                  fecha_vencimiento
                  medio_pago
                  importe
                }
                items_array{
                  _id
                  next_id
                  unidad
                  cantidad
                  nombre
                  valor_unitario
                  total
                  estatus
                  fecha_creacion
                }
            }
          }
        }`,
          variables: {},
        };

        try {
          actions.setSubmitting(true);
          const { data } = await api.ApiApp(params);
          nuevoCategoria = data.data.nuevoCategoria;
        } catch (error) {
          console.log(error);
        } finally {
          set(!state);
          setEvent(old => {
            old?.presupuesto_objeto?.categorias_array?.push(nuevoCategoria);
            
            return {...old}
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

export default FormCrearCategoria;

export const BasicForm = ({
  handleChange,
  handleSubmit,
  isSubmitting,
  values,
  handleBlur,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="border-l-2 border-gray-100 pl-3 w-full ">
        <h2 className="font-display text-3xl capitalize text-primary font-light">
          {t("create")} <br />
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
            />
          </div>
        </div>
        <button
          className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
            }`}
          disabled={isSubmitting}
          type="submit"
        >
          {t("createcategory")}
        </button>
      </form>
    </>
  );
};
