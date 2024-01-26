import { Form, Formik } from "formik"
import { InputFieldGlobal } from "./InputFieldGlobal"
import React, { useMemo } from 'react'
import Select, { StylesConfig } from 'react-select'


export const FormAddUserToEvent = ({ evento, setSelectLength }) => {
    const initialValues = {

    }

    const handleSubmit = (values) => {
        console.log("values del form",values)
    }

    const options = evento.invitados_array.map((item) => {
        return {
            value: item._id,
            label:
                <div className="flex items-center space-x-4 cursor-pointer  ">
                    <div className="hidden md:block">
                        <img
                            src={item?.sexo == "hombre" ? "/profile_men.png" : "profile_woman.png"}
                            className="object-cover w-11 h-11 rounded-full"
                        />
                    </div>
                    <div className="flex flex-col text-[15px] w-36 ">
                        <span>{item?.nombre}</span>
                        <span className="truncate text-[12px]">{item?.correo}</span>
                    </div>

                </div>
        }
    })

    return (
        <div>
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                <Form >
                    <div className="flex flex-col space-y-1 mb-5 md:mb-0 ">
                        <label className="text-gray-500">Agregar nuevo usuario</label>
                        <Select
                            onChange={(e) => {setSelectLength(e)}}
                            name="sharedUsers"
                            options={options}
                            isMulti
                            className="focus:border-none"
                            classNamePrefix="select"
                        />
                    </div>
                </Form>
            </Formik>
        </div>
    )
}