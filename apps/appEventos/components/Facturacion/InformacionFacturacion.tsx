import { Form, Formik } from "formik"
import InputField from "../Forms/InputField"
import SelectField from "../Forms/SelectField"
import { AuthContextProvider } from "../../context"
import { flags } from "../../utils/flags"
import { useEffect, useState } from "react"
import { fetchApiBodas, queries } from "../../utils/Fetching"
import { useToast } from "../../hooks/useToast"
import { useTranslation } from 'react-i18next';

export const InformacionFacturacion = () => {
    const { t } = useTranslation();
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
                toast("success", t("savecorrect"))
            }
        })
    }

    return (
        <>
            <div className=" flex items-center justify-center pb-5 mt-3 bg-white rounded-lg min-h-[calc(100vh-252px)] max-h-[calc(100vh-20px)] w-full">
                {initialValues?.name ?
                    <Formik
                        initialValues={initialValues}
                        onSubmit={handleSubmit} >
                        {
                            ({ values }) => (
                                <Form className="md:px-20 px-5 py-10 space-y-5  ">
                                    <div className=" flex flex-col items-center space-y-4 mb-5">
                                        <p className="text-gray-500 mb-5">
                                            {t("billinginformation")}
                                        </p>
                                        <div className="grid md:grid-cols-4 gap-4 w-[85%]">
                                            <div className="col-span-1 md:col-span-3">
                                                <div className="w-[100%]">
                                                    <InputField
                                                        label={t("namesurnamecompany")}
                                                        name="name"
                                                        className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-[85%]" >
                                            <InputField
                                                label={t("addressone")}
                                                name="line1"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                            />
                                        </div>
                                        <div className="w-[85%]" >
                                            <InputField
                                                label={t("addresstwo")}
                                                name="line2"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 w-[85%] gap-4" >
                                            <InputField
                                                label={t("zipcode")}
                                                name="postalCode"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3 w-[100%] truncate text-base "
                                            />
                                            <div className="grid-cols-1">
                                                <InputField
                                                    label={t("city")}
                                                    name="city"
                                                    className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3  w-[100%] truncate text-base "
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <div className="w-[100%]">
                                                    <SelectField
                                                        label={t("country")}
                                                        name="country"
                                                        className=" capitalize cursor-pointer text-sm transition w-full py-1 px-2 mt-1 rounded-lg focus:outline-none "
                                                        options={flags.map(elem => elem.name).sort()}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-[85%]" >
                                            <InputField
                                                label={t("invoicerecipientemail")}
                                                name="email"
                                                type="email"
                                                className="focus:outline-none border border-gray-300 rounded-lg py-1 px-3  w-[100%] truncate text-base "
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="bg-primary rounded-lg px-7 py-2.5 text-white text-base " >
                                        {t("confirmbillinginformation")}
                                    </button>
                                </Form>
                            )
                        }
                    </Formik> :
                    <div className="flex items-center justify-center ">
                        < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                    </div>}
            </div >
            <style jsx>
                {`
                    .loader {
                        border-top-color:  ${config?.theme?.primaryColor};
                        -webkit-animation: spinner 1.5s linear infinite;
                        animation: spinner 1.5s linear infinite;
                    }

                    @-webkit-keyframes spinner {
                        0% {
                        -webkit-transform: rotate(0deg);
                        }
                        100% {
                        -webkit-transform: rotate(360deg);
                        }
                    }

                    @keyframes spinner {
                        0% {
                        transform: rotate(0deg);
                        }
                        100% {
                        transform: rotate(360deg);
                        }
                    }
                `}
            </style>
        </>
    )
}