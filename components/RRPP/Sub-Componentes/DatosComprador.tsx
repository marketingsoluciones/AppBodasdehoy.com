import { Formik, Form, Field, useFormikContext } from 'formik';
import { FC, useEffect, useState } from "react"
import { Correo } from "../../icons";
import InputField from "../../Forms/InputField";

interface propsDatosComprador {
  idx: any;
  handleSubmit?: any;
  setValuesForm?:any;
  valuesForm?:any
}
export const DatosComprador: FC<propsDatosComprador> = ({ idx, handleSubmit, setValuesForm,valuesForm }) => {

 /*  const handleSubmit = (e) => {
    console.log("sdada", e)
  } */
  const initialValues = {
    nombre: "",
    email: "",
    verificarEmail: "",
    telefono: "",
  }

  return (<>
    <Formik initialValues={initialValues} onSubmit={handleSubmit}  >
      <Form className="self-stretch w-full h-auto pb-5 px-5 pt-2 space-y-2 ">
        <>
          <AutoSubmit setValuesForm={setValuesForm} />
          <div className="w-[400px] rounded-md bg-white shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] flex flex-col  text-gray-600 pb-5 px-5 pt-2 space-y-4">
            <div className="w-full flex flex-col items-start justify-start py-[10.5px] pl-[21px]">
              <b className=" leading-[21px] uppercase text-gray-600 inline-block">
                Datos del Comprador #{idx + 1}
              </b>
            </div>
            <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
              <InputField
                name="nombre"
                label="Nombre y apellidos"
                labelClass={false}
              />
            </div>
            <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
              <InputField
                name="email"
                label="Correo electrónico"
                labelClass={false}
              />
            </div>
            <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
              <InputField
                name="telefono"
                label="Teléfono"
                labelClass={false}
              />
            </div>
          </div >
        </>
      </Form>
    </Formik>
  </>)
}

const AutoSubmit = ({ setValuesForm }) => {
  const { resetForm, values } = useFormikContext();

  useEffect(() => {
    setValuesForm(values)
  }, [values])

  return null;
};