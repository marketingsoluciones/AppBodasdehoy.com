import { Formik, Form } from "formik"
import InputField from "./InputField"
import SelectField from "./SelectField"
/* import MultipleSelectChip from "./ReactSelectField" */

export const FormConfirmarAsistencia = ({ setVisible, visible, pases }) => {
    const initialValue = {
        Nombre: "",
        Telefono: "",
        Email: "",
        Sexo: "",
        Edad: "",
        Alergias: "",
        Confirmacion: ""
    }

    const handelSubmit = (value: any) => {
        setVisible(!visible)
    }

    return (
        <>
            <Formik initialValues={initialValue} onSubmit={handelSubmit}>
                <Form className="w-full">
                    <div className="flex flex-col space-y-4  ">
                        <div className="px-5 space-y-3">
                            <div className="grid grid-cols-2 gap-5 ">
                                <InputField
                                    name="Nombre"
                                    label="Nombre del invitado"
                                    type="text"
                                    labelClass={false}
                                />
                                <InputField
                                    name="Telefono"
                                    label="Telefono"
                                    type="number"
                                    labelClass={false}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 md:gap-5">
                                <InputField
                                    name="Email"
                                    label="Correo electronico"
                                    type="email"
                                    labelClass={false}
                                />
                                <div className="grid grid-cols-2 gap-5 ">
                                    <SelectField
                                        options={["Hombre", "Mujer"]}
                                        name="Sexo"
                                        label="Sexo"
                                        labelClass={false}

                                    />
                                    <SelectField
                                        options={["Adulto", "Niño"]}
                                        name="Edad"
                                        label="Edad"
                                        labelClass={false}
                                    />
                                </div>
                            </div>
                            <div>
                                <SelectField
                                    options={["si", "no"]}
                                    name="Confirmacion"
                                    label="Confirmacion"
                                    labelClass={false}
                                />
                            </div>
                        </div>

                        {(() => {
                            if (pases.length > 0) {
                                return (
                                    <>
                                        <div className="bg-primary flex flex-col items-center justify-center py-5 space-y-1">
                                            <p className="text-acento text-2xl md:text-3xl font-body ">Tines {pases.length} pases a este evento</p>
                                            <p className="text-white md:text-xl font-body">Registra a tus acompañantes aqui</p>
                                        </div>
                                    </>
                                )
                            }
                        })()}

                        <div className="px-5">
                            {
                                pases.map((item: any, idx: any) => {
                                    return (
                                        < div key={idx}>
                                            <div
                                                className="text-acento font-body font-semibold text-2xl mb-3 mt-5 "
                                            >
                                                Pase {[idx + 1]}
                                            </div>
                                            <div className=" space-y-3" >
                                                <div className="grid grid-cols-2 gap-5 ">
                                                    <InputField
                                                        name="Nombre"
                                                        label="Nombre del invitado"
                                                        type="text"
                                                        labelClass={false}
                                                    />
                                                    <InputField
                                                        name="Telefono"
                                                        label="Telefono"
                                                        type="number"
                                                        labelClass={false}
                                                    />
                                                </div>
                                                <div className="grid md:grid-cols-2 md:gap-5">
                                                    <InputField
                                                        name="Email"
                                                        label="Correo electronico"
                                                        type="email"
                                                        labelClass={false}
                                                    />
                                                    <div className="grid grid-cols-2 gap-5 ">
                                                        <SelectField
                                                            options={["Hombre", "Mujer"]}
                                                            name="Sexo"
                                                            label="Sexo"
                                                            labelClass={false}
                                                        />
                                                        <SelectField
                                                            options={["Adulto", "Niño"]}
                                                            name="Edad"
                                                            label="Edad"
                                                            labelClass={false}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <SelectField
                                                        options={["si", "no"]}
                                                        name="Confirmacion"
                                                        label="Confirmacion"
                                                        labelClass={false}
                                                    />
                                                </div>

                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>

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