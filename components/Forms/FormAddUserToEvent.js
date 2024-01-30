import { Form, Formik } from "formik"
import { InputFieldGlobal } from "./InputFieldGlobal"
import React, { useEffect, useMemo, useState } from 'react'
import Select, { StylesConfig, createFilter } from 'react-select'
import { fetchApiBodas, queries } from "../../utils/Fetching"
import { AuthContextProvider } from "../../context"
import { TagsInput } from "react-tag-input-component";


export const FormAddUserToEvent = ({  setSelectLength }) => {
    const { config, user } = AuthContextProvider()


    const handleSubmit = (selectedOption) => {
        setSelectLength(selectedOption)
    }

    const beforeAddValidate = (tag) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(tag);
    }


    return (
        <div className={`flex flex-col space-y-1 mb-5 md:mb-0 `}>
            <label className="text-gray-500">Agregar nuevo usuario</label>
            <TagsInput
                onChange={handleSubmit}
                name="emails"
                placeHolder="añadir email"
                beforeAddValidate={beforeAddValidate}
                separators={["Enter", ",", " ", ";"]}
            />
        </div>
    )
}