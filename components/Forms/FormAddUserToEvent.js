import { Form, Formik } from "formik"
import { InputFieldGlobal } from "./InputFieldGlobal"
import React, { useEffect, useMemo, useState } from 'react'
import Select, { StylesConfig, createFilter } from 'react-select'
import { fetchApiBodas, queries } from "../../utils/Fetching"
import { AuthContextProvider } from "../../context"


export const FormAddUserToEvent = ({ evento, setSelectLength, setDataInput, dataUsers, setDataUsers }) => {
    const { config, user } = AuthContextProvider()
    useEffect(() => {
        try {
            fetchApiBodas({
                query: queries.getAllUser,
                development: config?.development
            }).then((result) => {
                setDataUsers(
                    result
                )
            })
        } catch (error) {
            console.log(error)
        }
    }, [])


    const initialValues = {

    }

    const handleSubmit = (selectedOption) => {
        setSelectLength(selectedOption)
    }

    const handleInputChange = (newValue) => {
        setDataInput(newValue)
    }

    const options = dataUsers.map((item) => {
        return {
            value: item.uid,
            label:
                <div className="flex items-center space-x-4 cursor-pointer  ">
                    <div className="hidden md:block">
                        <img
                            src={item?.photoURL != null ? item?.photoURL : "/placeholder/user.png"}
                            className="object-cover w-11 h-11 rounded-full"
                        />
                    </div>
                    <div className="flex flex-col text-[15px] w-36* ">
                        <span>{item?.displayName}</span>
                        <span className=" text-[12px]">{item?.email}</span>
                    </div>

                </div>
        }
    })

    return (
        <div>
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                <Form >
                    <div className={`flex flex-col space-y-1 mb-5 md:mb-0 `}>
                        <label className="text-gray-500">Agregar nuevo usuario</label>
                        <Select
                            isSearchable
                            onChange={handleSubmit}
                            onInputChange={handleInputChange}
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