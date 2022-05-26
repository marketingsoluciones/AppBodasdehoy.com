import { Formik } from "formik";
import { useContext, useState } from "react";
import { api } from "../../api";
import {EventContextProvider} from "../../context";
import InputField from "./InputField";

const validacion = (values) => {
  let errors = {};
  

  return errors;
};

const FormPresupuesto = ({ set, state }) => {
  const { event, setEvent } = EventContextProvider();
  return (
    <Formik
      initialValues={{
        nombre: "",
      }}
      onSubmit={async (values, actions) => {
        
      }}
      validate={validacion}
    >
      {(props) => <BasicForm {...props} />}
    </Formik>
  );
};

export default FormPresupuesto;

export const BasicForm = ({
  handleChange,
  handleSubmit,
  isSubmitting,
  values,
  handleBlur,
}) => {
  return (
    <>
      <div className="border-l-2 border-gray-100 pl-3 w-full ">
        <h2 className="font-display text-3xl capitalize text-primary font-light">
          Editar <br />
          <span className="font-display text-5xl capitalize text-gray-500 font-medium">
            Presupuesto
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
              name="presupuesto"
              label="Presupuesto"
              onChange={handleChange}
              value={values.presupuesto}
              onBlur={handleBlur}
              type="number"
            />
          </div>
        </div>
        <button
          className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${
            isSubmitting ? "bg-secondary" : "bg-primary"
          }`}
          disabled={isSubmitting}
          type="submit"
        >
          Crear grupo
        </button>
      </form>
    </>
  );
};
