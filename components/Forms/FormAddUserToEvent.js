import { TagsInput } from "react-tag-input-component";
import { AuthContextProvider } from "../../context";
import { useEffect, useState } from "react";

export const FormAddUserToEvent = ({ users, setUsers, optionsExist, setValir }) => {
    const { user } = AuthContextProvider()
    const [error, setError] = useState(null)
    const [showInstruction, setShowInstruction] = useState(false)


    const handleChangeInput = (e) => {
        if (e?.target?.value?.length) {
            setShowInstruction(true)
        } else {
            setShowInstruction(false)
        }
    }

    useEffect(() => {
        const input = document.getElementsByClassName("rti--input")[0]
        if (input) {
            input.addEventListener("keyup", handleChangeInput)
        }
    }, [])

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
        validator.push(optionsExist?.includes(tag) ? errorValidator("Ya está compartido con este correo") : true)
        validator.push(user?.email === tag ? errorValidator("No puedes compartirlo contigo mismo") : true)
        return !validator.includes(false)
    }

    const onBlur = () => {
        const imp = document.getElementsByName("emails")
        setValir(!imp[0].value)
    }

    return (
        <div className={`flex flex-col space-y-1 mb-5 md:mb-0`}>
            <label className="text-primary">Agregar nuevo usuario</label>
            <div onKeyUp={(e) => { if (!separators.includes(e.key)) { error && setError(null) } }}>
                <TagsInput
                    value={users}
                    onChange={handleSubmit}
                    onKeyUp={onBlur}
                    name="emails"
                    placeHolder={!users.length ? "Ingresa un correo y presiona enter" : "Ingresa otro correo y presiona enter"}
                    beforeAddValidate={beforeAddValidate}
                    separators={separators}
                    classNames={{
                        tag: "!text-sm !px-2 !rounded-lg",
                        input: "!w-full !text-sm !rounded-lg"
                    }}
                />
            </div>
            <div className="h-4 -translate-y-2">
                {(showInstruction && !error)
                    ? <span className="ml-4 text-xs text-red h-1">Presiona enter o espacio para aceptar</span>
                    : users.length
                        ? <span className="ml-4 text-xs text-red h-1">o dale click a guardar para compartir</span>
                        : <></>}
                <span className="ml-4 text-xs text-red h-1">{error}</span>
            </div>
            <style>{`
                .rti--container {
                    --rti-s: .2rem;
                    --rti-radius: 0.75rem;
                    }
              
            ` }</style>
        </div>
    )
}