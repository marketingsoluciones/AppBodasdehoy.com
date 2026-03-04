import { Formik, Form } from 'formik';
import { FC, useState } from "react"
import InputField from "../../Forms/InputField";
import { useRouter, useSearchParams } from 'next/navigation';
import * as yup from "yup";
import { fetchApiBodas, queries } from '../../../utils/Fetching';
import { AuthContextProvider } from '../../../context';

interface propsDatosComprador {
  valirButton: any,
  setValirButton: any,
}

export const DatosComprador: FC<propsDatosComprador> = ({ valirButton, setValirButton }) => {
  const { setUsuariosTickets } = AuthContextProvider()

  const router = useRouter()
  const searchParams = useSearchParams()
  const quantity = parseInt(`${searchParams?.get("count")}`, 10)
  const arr = Array.from({ length: quantity }, (_, index) => index);


  let initialValues = {}
  let yupSchema = {}

  for (let i = 0; i < quantity; i++) {
    initialValues = {
      ...initialValues,
      [`email_${i}`]: "",
      [`name_${i}`]: "",
      [`phoneNumber_${i}`]: "",
    }
    yupSchema = {
      ...yupSchema,
      [`email_${i}`]: yup.string().required("Email es requerido"),
      [`name_${i}`]: yup.string().required("Nombre es requerido")
    }
  }

  const validationSchema = yup.object().shape(yupSchema);

  const handleSubmit = (values) => {
    const unique = searchParams?.get("sId")?.slice(-24)
    let sendValues = []
    for (let i = 0; i < quantity; i++) {
      const item = {
        email: values[`email_${i}`],
        name: values[`name_${i}`],
        phoneNumber: values[`phoneNumber_${i}`],
      }
      sendValues.push(item)
    }
    setUsuariosTickets(sendValues)
    fetchApiBodas({
      query: queries.setCheckoutItems,
      variables: {
        unique,
        args: sendValues
      },
      development: "bodasdehoy"
    }).then(result => {
      if (result === "ok") {
        setValirButton(false)
      }
    })
  }

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form >
          {arr.map((_, i) => {
            return (
              <div key={i} className="w-[400px] mb-5 rounded-md bg-white shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] flex flex-col  text-gray-600 pb-5 px-5 pt-2 space-y-4">
                <div className="w-full flex flex-col items-start justify-start py-[10.5px] pl-[21px]">
                  <b className=" leading-[21px] uppercase text-gray-600 inline-block">
                    Datos del Comprador #{i + 1}
                  </b>
                </div>
                <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
                  <InputField
                    id={`name_${i}`}
                    name={`name_${i}`}
                    label="Nombre y apellidos"
                    labelClass={false}
                  />
                </div>
                <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
                  <InputField
                    id={`email_${i}`}
                    name={`email_${i}`}
                    label="Correo electrónico"
                    labelClass={false}
                  />
                </div>
                <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
                  <InputField
                    id={`phoneNumber_${i}`}
                    name={`phoneNumber_${i}`}
                    label="Teléfono"
                    labelClass={false}
                  />
                </div>
              </div>
            )
          })}
          <button type="submit" disabled={!valirButton} className={`w-full ${valirButton ? "cursor-pointer" : "bg-gray-300 cursor-not-allowed"} [border:none] pt-[9.5px] px-0 pb-[11px] bg-[#6096B9] self-stretch rounded-md flex flex-row items-center justify-center`}>
            <div className="relative text-mid-5 leading-[24.5px] font-medium text-white text-center inline-block max-w-[264.3399963378906px]">
              Enviar por correo electrónico
            </div>
          </button>
        </Form>
      </Formik>
    </>
  )
}
