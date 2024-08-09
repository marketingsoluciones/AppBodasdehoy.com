import { Form, Formik } from "formik"
import InputField from "../Forms/InputField"
import SelectField from "../Forms/SelectField"
import { AuthContextProvider } from "../../context"

export const InformacionFacturacion = () => {
    const { user } = AuthContextProvider()
    const fullName = user?.displayName;
    const [firstName, ...rest] = fullName?.split(" ");
    const lastName = rest?.join(" ");


    const initialValues = {
        nombre: firstName ?? "",
        apellido: lastName ?? "",
        empresa: "",
        direccion: "",
        codigoPostal: "",
        ciudad: "",
        pais: "",
        email: user?.email ?? "",
    }

    const handleSubmit = (values:any) => {
        console.log(values)
    }


    return (
        <div className=" h-[100vh]* mt-3">
            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
            >
                {
                    ({ values }) => (
                        <Form className="bg-white rounded-lg md:px-20 px-5 py-10 space-y-5 h-[calc(100%-70px)] ">
                            <div className=" flex flex-col items-center space-y-4 mb-5">
                                <p className="text-gray-500 mb-5">
                                    Tu información de facturación puede ser diferente de la información de perfil de tu cuenta. La información de facturación aparece en las facturas.
                                </p>

                                <div className="grid md:grid-cols-2 gap-4 w-[85%]">
                                    <div className="w-[100%]">
                                        <label className="text-gray-700 font-semibold">Nombre</label>
                                        <InputField
                                            name="nombre"
                                            className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base"
                                        />
                                    </div>
                                    <div className="w-[100%]">
                                        <label className="text-gray-700 font-semibold  ">Apellido</label>
                                        <InputField
                                            name="apellido"
                                            className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base"
                                        />
                                    </div>
                                </div>

                                <div className="w-[85%]">
                                    <label className="text-gray-700 font-semibold">Empresa</label>
                                    <div className="w-[100%]">
                                        <InputField
                                            name="empresa"
                                            className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-4 gap-4 w-[85%]">
                                    <div className="md:col-span-3 col-span-2">
                                        <label className="text-gray-700 font-semibold">Direccion</label>
                                        <div className="w-[100%]">
                                            <InputField
                                                name="direccion"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 col-span-2">
                                        <label className="text-gray-700 font-semibold">Código Postal</label>
                                        <div className="w-[100%]">
                                            <InputField
                                                name="codigoPostal"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 w-[85%] gap-4" >
                                    <div className="col-span-2">
                                        <label className="text-gray-700 text-base w-[30%] text-end font-semibold">Ciudad</label>
                                        <div className="w-[100%]">
                                            <InputField
                                                name="ciudad"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3  w-[100%] truncate text-base "
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 col-span-2">
                                        <label className="text-gray-700 text-base w-[30%] text-end font-semibold">País</label>
                                        <div className="w-[100%]">
                                            <SelectField
                                                name="pais"
                                                className=" capitalize cursor-pointer text-sm transition w-full py-1 px-2 mt-1 rounded-lg focus:outline-none "
                                                options={["Adulto", "Niño"]}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="w-[85%]  " >
                                    <label className="text-gray-700 text-base w-[30%] text-end font-semibold ">Email del destinatario de la factura</label>
                                    <div className="w-[100%]">
                                        <InputField
                                            name="email"
                                            className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3  w-[100%] truncate text-base "
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="bg-primary rounded-lg px-7 py-2.5 text-white text-base " >
                                Confirmar información de facturación
                            </button>
                        </Form>
                    )
                }

            </Formik>
        </div >
    )
}