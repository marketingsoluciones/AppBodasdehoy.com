import { Formik } from "formik";
import { formikValidateUx } from "./formikValidateUx";
import { useContext, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import InputField from "./InputField";
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from "../../utils/Fetching";

type FormValues = { nombre: string };
type Props = { set: (v: boolean) => void; state: boolean };
type BasicFormProps = {
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  values: FormValues;
  handleBlur: (e: React.FocusEvent<any>) => void;
};

const validacion = (values: FormValues) => {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.nombre) {
    errors.nombre = "Nombre no valido";
  }

  return errors;
};

const FormCrearCategoria = ({ set, state }: Props) => {

  const { event, setEvent } = EventContextProvider() as any;
  return (
    <Formik
      {...formikValidateUx}
      initialValues={{
        nombre: "",
      }}
      onSubmit={async (values, actions) => {
        try {
          const result: any = await fetchApiEventos({
            query: queries.nuevoCategoria,
            variables: {
              evento_id: event?._id,
              nombre: values?.nombre,
            }
          })
          // PRES-01 (2026-06-20): el patrón anterior tenía .catch(() => {}) silente y
          // setEvent({...event}) sin cambios → modal se cerraba aunque la mutation fallara.
          // Ahora chequeamos success/errors y mantenemos el modal abierto si falla.
          if (result?.success === false && Array.isArray(result?.errors) && result.errors.length) {
            console.warn('[FormCrearCategoria] mutation rechazada:', result.errors)
            actions.setSubmitting(false)
            return
          }
          if (result?.evento?.presupuesto_objeto) {
            setEvent({ ...event, presupuesto_objeto: result.evento.presupuesto_objeto })
          }
          set(!state)
          actions.setSubmitting(false)
        } catch (error) {
          console.warn('[FormCrearCategoria] error de red:', error)
          actions.setSubmitting(false)
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
}: BasicFormProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col w-full" >
      <div className="border-l-2 border-gray-100 pl-3 w-full ">
        <h2 className="font-display text-3xl capitalize text-primary font-light">
          {t("create")} <br />
          <span className="font-display text-5xl capitalize text-gray-500 font-medium">
            {t("category")}
          </span>
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-6 md:w-[70%]  fustify-center">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center box-content">
            {/* <img
              src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
              alt="imagen-invitados"
              className="w-12 h-12 rounded-full mr-6 "
            /> */}
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
    </div >
  );
};