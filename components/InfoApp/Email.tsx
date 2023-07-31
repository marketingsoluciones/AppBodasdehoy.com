import { Form, Formik } from "formik";
import { useToast } from "../../hooks/useToast";
import * as Yup from "yup"
import InputField from "../Forms/InputField";

export const Email = () => {

    const toast = useToast()
    const initialValues = {
        email: "",
    }
    const validation = Yup.object(
        {
            email: Yup.string().required("Requerido"),
        }
    )

    const handleSubmit = async (value: any, {resetForm}:any ) => {
      try {
        const data = value
        
        /* await fetchApi({
          query: queries.createSubscripcion, variables: {
            ...value, development: "bodasdehoy"
          }
        }) */

        if (data?.email) {
          toast("success", data?.email + " gracias por suscribirte")
          resetForm({value:''})
        }
      } catch (error) {
        console.log(error)
        toast("error", "sin datos")
      }
    };


    return (
        <>
            <div className="flex flex-col justify-center items-center space-y-5 w-full font-display px-10 md:px-0">
                <p className="text-xl text-primaryOrg">Crea gratis todos los eventos que desees, sin límites de invitados</p>
                <Formik
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    validationSchema={validation}
                >
                    <Form>
                        <div className="flex space-x-4">
                            <InputField
                             name={"email"}
                             placeholder="Email"
                             type={"email"}
                            />
                           {/*  <input type="text" placeholder="Email" className=" border-none w-full rounded-lg" /> */}
                            <button type="submit" className="focus:none w-36 h-10 rounded-lg text-white bg-primaryOrg"> EMPEZAR </button>
                        </div>
                    </Form>
                </Formik>
            </div>
        </>
    )
}