import { Form, Formik } from "formik"
import { InputFieldGlobal } from "./InputFieldGlobal"

export const FormAddUserToEvent = () => {
    const initialValues = {

    }

    const handleSubmit = () => {

    }
    return (
        <div>
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                    <Form >
                            <div className="flex flex-col space-y-1 mb-5 md:mb-0 ">
                                <label className="text-gray-500">Agregar nuevo usuario</label>
                                <InputFieldGlobal
                                    name="nombre"
                                    className="focus:outline-none border border-gray-300 rounded-lg px-3 py-1 w-[100%] truncate "
                                    placeholder=""
                                />
                            </div>
                    </Form>
                </Formik>
        </div>
    )
}