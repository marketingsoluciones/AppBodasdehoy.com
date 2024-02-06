import { TagsInput } from "react-tag-input-component";
import { AuthContextProvider } from "../../context";
import { useEffect, useState } from "react";

export const FormAddUserToEvent = ({ setUsers, optionsExist }) => {
    const { user } = AuthContextProvider()
    const [error, setError] = useState(null)

    const handleSubmit = (selectedOption) => {
        setUsers(selectedOption)
    }

    const errorValidator = (message) => {
        setError(message)
        return false
    }
    const separators = ["Enter", ",", " ", ";"]
    const beforeAddValidate = (tag) => {
        const validator = []
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        validator.push(regex.test(tag) ? true : errorValidator("Correo inválido"))
        validator.push(optionsExist.includes(tag) ? errorValidator("Ya está compartido") : true)
        validator.push(user?.email === tag ? errorValidator("No permitido") : true)
        return !validator.includes(false)
    }

    return (
        <div className={`flex flex-col space-y-1 mb-5 md:mb-0`}>
            <label className="text-primary">Agregar nuevo usuario</label>
            <div onKeyUp={(e) => { if (!separators.includes(e.key)) { error && setError(null) } }}>
                <TagsInput
                    onChange={handleSubmit}
                    name="emails"
                    placeHolder="correo@email.com"
                    beforeAddValidate={beforeAddValidate}
                    separators={separators}
                    classNames={{
                        tag: "!text-sm !px-2 !rounded-lg",
                        input: "!w-full !text-sm !rounded-lg"
                    }}
                />
            </div>
            <span className="ml-4 text-xs text-red h-1">{error}</span>
            <style>{`
                .rti--container {
                    --rti-s: .2rem;
                    --rti-radius: 0.75rem;
                    }
              
            ` }</style>
        </div>
    )
}