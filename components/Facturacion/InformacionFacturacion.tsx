import { Form, Formik } from "formik"
import InputField from "../Forms/InputField"
import SelectField from "../Forms/SelectField"
import { AuthContextProvider } from "../../context"
import { flags } from "../../utils/flags"
import { useEffect, useState } from "react"
import { fetchApiBodas, queries } from "../../utils/Fetching"
import { useToast } from "../../hooks/useToast"

export const InformacionFacturacion = () => {
    const { user, geoInfo, config } = AuthContextProvider()
    const [initialValues, setInitialValues] = useState<any>({})
    const toast = useToast()

    useEffect(() => {
        fetchApiBodas({
            query: queries.getCustomer,
            variables: {},
            development: config.development
        }).then((result) => {
            setInitialValues({
                name: result?.name ?? user?.displayName,
                line1: result?.line1 ?? "",
                line2: result?.line2 ?? "",
                postalCode: result?.postalCode ?? "",
                city: result?.city ?? "",
                country: result?.country ?? flags.find(elem => elem.pre.toLowerCase() === geoInfo.ipcountry.toLowerCase())?.name.toLowerCase(),
                email: result?.email ?? user?.email,
            })
        })
    }, [])

    const handleSubmit = (values: any) => {
        fetchApiBodas({
            query: queries.updateCustomer,
            variables: { args: { ...values } },
            development: config.development
        }).then((result) => {
            if (result === "ok") {
                toast("success", `La información se guardó correctamente`)
            }
        })
    }

    return (
        <div className="pb-5 mt-3">
            {initialValues?.name && <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit} >
                {
                    ({ values }) => (
                        <Form className="bg-white rounded-lg md:px-20 px-5 py-10 space-y-5 h-[calc(100%-70px)] ">
                            <div className=" flex flex-col items-center space-y-4 mb-5">
                                <p className="text-gray-500 mb-5">
                                    Tu información de facturación puede ser diferente de la información de perfil de tu cuenta. La información de facturación aparece en las facturas.
                                </p>
                                <div className="grid md:grid-cols-4 gap-4 w-[85%]">
                                    <div className="col-span-1 md:col-span-3">
                                        <div className="w-[100%]">
                                            <InputField
                                                label="Nombre y Apellido o Empresa"
                                                name="name"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="w-[85%]" >
                                    <InputField
                                        label="Dirección Linea 1"
                                        name="line1"
                                        className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                    />
                                </div>
                                <div className="w-[85%]" >
                                    <InputField
                                        label="Dirección Linea 2"
                                        name="line2"
                                        className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 w-[85%] gap-4" >
                                    <InputField
                                        label="Código Postal"
                                        name="postalCode"
                                        className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                    />
                                    <div className="grid-cols-1">
                                        <InputField
                                            label="Ciudad"
                                            name="city"
                                            className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3  w-[100%] truncate text-base "
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <div className="w-[100%]">
                                            <SelectField
                                                label="País"
                                                name="country"
                                                className=" capitalize cursor-pointer text-sm transition w-full py-1 px-2 mt-1 rounded-lg focus:outline-none "
                                                options={flags.map(elem => elem.name).sort()}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="w-[85%]" >
                                    <InputField
                                        label="Email del destinatario de la factura"
                                        name="email"
                                        type="email"
                                        className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3  w-[100%] truncate text-base "
                                    />
                                </div>
                            </div>
                            <button type="submit" className="bg-primary rounded-lg px-7 py-2.5 text-white text-base " >
                                Confirmar información de facturación
                            </button>
                        </Form>
                    )
                }
            </Formik>}
        </div >
    )
}