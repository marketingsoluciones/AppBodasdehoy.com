import { Form, Formik } from "formik"
import { InputFieldGlobal } from "./InputFieldGlobal"
import React, { useEffect, useMemo, useState } from 'react'
import Select, { StylesConfig, createFilter } from 'react-select'
import { fetchApiBodas, queries } from "../../utils/Fetching"
import { AuthContextProvider } from "../../context"
import { TagsInput } from "react-tag-input-component";


export const FormAddUserToEvent = ({ setUsers }) => {
    const { config, user } = AuthContextProvider()


    const handleSubmit = (selectedOption) => {
        setUsers(selectedOption)
    }

    const beforeAddValidate = (tag) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(tag);
    }


    return (
        <div className={`flex flex-col space-y-1 mb-5 md:mb-0`}>
            <label className="text-primary">Agregar nuevo usuario</label>
            <TagsInput
                onChange={handleSubmit}
                name="emails"
                placeHolder="correo@email.com"
                beforeAddValidate={beforeAddValidate}
                separators={["Enter", ",", " ", ";"]}
                classNames={{
                    tag: "!text-sm !px-2 !rounded-lg",
                    input: "!w-full !text-sm !rounded-lg"
                }}
            />
            <style>{`
                .rti--container {
                    --rti-s: .2rem;
                    --rti-radius: 0.75rem;
                    }
              
            ` }</style>
        </div>
    )
}