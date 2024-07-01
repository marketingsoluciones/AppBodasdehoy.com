import { Formik, Form } from "formik"
import InputField from "./InputField"
import SelectField from "./SelectField"
import * as yup from "yup";
import { phoneUtil } from "../../utils/Authentication";
import { AuthContextProvider } from "../../context";

export const FormConfirmarAsistencia = ({ visible, setVisible,  pases  }) => {
    const { geoInfo } = AuthContextProvider();
    const quantity = parseInt(`0`, 10)
    const GuetsArray = Array.from({ length: quantity }, (_, index) => index);

    let initialValues = {}
    let yupSchema = {}

    for (let i = 0; i < quantity; i++) {
        initialValues = {
            ...initialValues,
            nombre: "",
            telefono: `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
            email: "",
            sexo: "",
            edad: "",
            menu: "",
            confirmacion: "",
            [`nombre_${i}`]: "",
            [`telefono_${i}`]: `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
            [`email_${i}`]: "",
            [`sexo_${i}`]: "",
            [`edad_${i}`]: "",
            [`menu_${i}`]: "",
            [`confirmacion_${i}`]: "",
        }
        /* yupSchema = {
          ...yupSchema,
          [`nombre_${i}`]: yup.string().required("Nombre es requerido"),
          [`telefono_${i}`]:yup.string().required("Telefono es requerido"),
          [`email_${i}`]:yup.string().required("Email es requerido"),
          [`sexo_${i}`]:yup.string().required("Sexo es requerido"),
          [`edad_${i}`]:yup.string().required("Edad es requerido"),
          [`menu_${i}`]:yup.string().required("Menu es requerido"),
          [`confirmacion_${i}`]:yup.string().required("La confirmacion es requerida"),
        } */
    }

    const handelSubmit = (values: any) => {
        /*  setVisible(!visible) */
        console.log(values)
    }

    return (
        <>
            <Formik initialValues={initialValues} onSubmit={handelSubmit}>
                <Form className="w-full">
                    <div className="flex flex-col space-y-4  ">
                        <div className="px-5 space-y-3">
                            <div className="grid grid-cols-2 gap-5 ">
                                <InputField
                                    name="nombre"
                                    label="Nombre del invitado"
                                    type="text"
                                    labelClass={false}
                                />
                                <InputField
                                    name="telefono"
                                    label="Telefono"
                                    type="telefono"
                                    labelClass={false}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 md:gap-5">
                                <InputField
                                    name="email"
                                    label="Correo electronico"
                                    type="email"
                                    labelClass={false}
                                />
                                <div className="grid grid-cols-2 gap-5 ">
                                    <SelectField
                                        options={["Hombre", "Mujer"]}
                                        name="sexo"
                                        label="Sexo"
                                        labelClass={false}

                                    />
                                    <SelectField
                                        options={["Adulto", "Niño"]}
                                        name="edad"
                                        label="Edad"
                                        labelClass={false}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <SelectField
                                    options={["Confirmado", "Cancelado"]}
                                    name="confirmacion"
                                    label="Confirmacion de asistencia"
                                    labelClass={false}
                                />
                                <SelectField
                                    name={`nombre_menu`}
                                    label={"Menu"}
                                    options={[/* ...event?.menus_array?.map(elem => elem.nombre_menu), "sin menú" */]}
                                />
                            </div>
                        </div>
                        {
                            (() => {
                                if (GuetsArray.length > 0) {
                                    return (
                                        <>
                                            <div className="bg-primary flex flex-col items-center justify-center py-5 space-y-1">
                                                <p className="text-acento text-2xl md:text-3xl font-body ">Tines {GuetsArray.length} pases mas a este evento</p>
                                                <p className="text-white md:text-xl font-body">Registra a tus acompañantes aqui</p>
                                            </div>
                                        </>
                                    )
                                }
                            })()
                        }
                        {GuetsArray.map((_, i) => {
                            return (
                                <div key={i} className="px-5">
                                    < div >
                                        <div
                                            className="text-acento font-body font-semibold text-2xl mb-3 mt-5 "
                                        >
                                            Pase {[i + 1]}
                                        </div>
                                        <div className=" space-y-3" >
                                            <div className="grid grid-cols-2 gap-5 ">
                                                <InputField
                                                    id={`nombre_${i}`}
                                                    name={`nombre_${i}`}
                                                    label="Nombre del invitado"
                                                    type="text"
                                                    labelClass={false}
                                                />
                                                <InputField
                                                    //placeholder="960 66 66 66"
                                                    id={`telefono_${i}`}
                                                    name={`telefono_${i}`}
                                                    label="Telefono"
                                                    type="telefono"
                                                />

                                            </div>
                                            <div className="grid md:grid-cols-2 md:gap-5">
                                                <InputField
                                                    id={`email_${i}`}
                                                    name={`email_${i}`}
                                                    label="Correo electronico"
                                                    type="email"
                                                    labelClass={false}
                                                />
                                                <div className="grid grid-cols-2 gap-5 ">
                                                    <SelectField
                                                        id={`sexo_${i}`}
                                                        name={`sexo_${i}`}
                                                        label="Sexo"
                                                        options={["Hombre", "Mujer"]}
                                                        labelClass={false}
                                                    />
                                                    <SelectField
                                                        id={`edad_${i}`}
                                                        name={`edad_${i}`}
                                                        label="Edad"
                                                        options={["Adulto", "Niño"]}
                                                        labelClass={false}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <SelectField
                                                    id={`confirmacion_${i}`}
                                                    name={`confirmacion_${i}`}
                                                    label="Confirmacion de asistencia"
                                                    options={["Confirmado", "Cancelado"]}
                                                    labelClass={false}
                                                />
                                                <SelectField
                                                    id={`nombre_menu_${i}`}
                                                    name={`nombre_menu_${i}`}
                                                    label={"Menu"}
                                                    options={[/* ...event?.menus_array?.map(elem => elem.nombre_menu), "sin menú" */]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            )
                        })}
                        <div className="flex items-center justify-center">
                            <button type="submit" className=" bg-primary md:w-[30%] px-5 md:px-0 py-2 rounded-2xl font-body text-white">
                                Confirmar asistencia
                            </button>
                        </div>
                    </div>
                </Form>
            </Formik>
        </>
    )
}