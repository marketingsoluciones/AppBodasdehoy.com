import { Formik, Form } from 'formik';
import { FC } from "react"
import InputField from "../../Forms/InputField";
import { useRouter } from 'next/router';

interface propsDatosComprador {
  idx?: any;
  handleSubmit?: any;
  setValuesForm?: any;
  valuesForm?: any;
  count?: any;
}
export const DatosComprador: FC<propsDatosComprador> = ({ }) => {
  const router = useRouter()
  const initialCount = router?.query?.count
  const newCount = initialCount ? initialCount && +initialCount : 2
  const FormsIndices = Array.from({ length: newCount }, (_, index) => index);

  return (
    <>
      <Formik
        initialValues={{
          nombre:"",
          email:"",
          telefono:"",
        }}
        onSubmit={(values) => {
          console.log('Valores enviados:', values);
        }}
      >
        {({ handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            {FormsIndices.map((index) => (
              <div key={index} className="w-[400px] mb-5 rounded-md bg-white shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] flex flex-col  text-gray-600 pb-5 px-5 pt-2 space-y-4">
                <div className="w-full flex flex-col items-start justify-start py-[10.5px] pl-[21px]">
                  <b className=" leading-[21px] uppercase text-gray-600 inline-block">
                    Datos del Comprador #{index + 1}
                  </b>
                </div>
                <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
                  <InputField
                    id={`nombre-${index}`}
                    name={`nombre-${index}`}
                    label="Nombre y apellidos"
                    labelClass={false}
                  />
                </div>
                <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
                  <InputField
                    id={`email-${index}`}
                    name={`email-${index}`}
                    label="Correo electrónico"
                    labelClass={false}
                  />
                </div>
                <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
                  <InputField
                    id={`telefono-${index}`}
                    name={`telefono-${index}`}
                    label="Teléfono"
                    labelClass={false}
                  />
                </div>
              </div>
            ))}
            <button type="submit">Enviar</button>
          </Form>
        )}
      </Formik>

      {/* <Formik initialValues={initialValues} onSubmit={handleSubmit}  >
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
    </Formik> */}
    </>
  )
}

/* const AutoSubmit = ({ setValuesForm }) => {
  const { resetForm, values } = useFormikContext();

  useEffect(() => {
    setValuesForm(values)
  }, [values])

  return null;
}; */