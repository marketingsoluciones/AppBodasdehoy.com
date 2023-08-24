import { Formik, ErrorMessage } from "formik";
import { useContext } from 'react'
import EventoContext from '../../context/EventContext'
import { EventContextProvider } from "../../context";
import { api } from '../../api'
export default function Test() {
  const { event } = EventContextProvider()
  const initialValue = {
    email: "",
  };

  const validacion = (values) => {
    let errors = {};

    if (!values.email) {
      errors.email = "Debes indicar un correo electronico";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
      errors.email = 'Correo invalido';
    }

    return errors;
  };


  const handleClick = async (values, actions) => {
    const params = {
      query: `mutation TestInvitacion ($eventoID : String, $email : [String], $linkUrl: String, $imgUrl: String){
          testInvitacion(
            evento_id:$eventoID,
            email:$email,
            linkUrl:$linkUrl,
            imgUrl:$imgUrl
          )
        }        
        `,
      variables: {
        eventoID: event?._id,
        email: [values.email],
        linkUrl: `${process.env.NEXT_PUBLIC_CHAT}`,
        imgUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${event?.imgInvitacion?.i640}`
      },
    };

    try {
      actions.setSubmitting(true)
      const { data } = await api.ApiApp(params)
      console.log(data)
    } catch (error) {
      console.log(error)
    } finally {
      actions.setSubmitting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-2xl w-full mx-auto inset-x-0 h-max p-10 font-display flex flex-col gap-2">
      <h3 className="font-medium">Enviar correo de prueba</h3>
      <Formik
        validate={validacion}
        onSubmit={(values, actions) => handleClick(values, actions)}
        initialValues={initialValue}
      >
        {({ handleSubmit, handleChange, values }) => (
          <>
            <input
              name="email"
              value={values.email}
              onChange={handleChange}
              className="w-full px-3 py-1 rounded-xl bg-base focus:outline-none focus:ring text-sm font-normal"
              placeholder="Ingresar correo electronico"
              type={"email"}
            />
            <span className="text-xs text-red -mt-1">
              <ErrorMessage name={"email"} />
            </span>
            <button
              onClick={handleSubmit}
              type="submit"
              className="focus:outline-none hover:bg-secondary hover:text-gray-300 transition bg-primary text-white py-1 rounded-xl text-sm px-5 py-2 w-full"
            >
              Enviar correo de prueba
            </button>
          </>
        )}
      </Formik>
    </div>
  );
}



const Aceptar = async () => {


  try {
    await api.ApiApp(params);
  } catch (error) {
    console.log(error);
  } finally {
    setEvento((old) => {
      arrEnviarInvitaciones.forEach((invitado) => {
        const idxInvitado = evento?.invitados_array?.findIndex(
          (inv) => inv._id == invitado
        );
        old.invitados_array[idxInvitado] = {
          ...old.invitados_array[idxInvitado],
          invitacion: true,
        };
      });

      return { ...old };
    });
    set([])
  }
};