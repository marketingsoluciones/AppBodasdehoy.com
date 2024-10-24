import { TagsInput } from "react-tag-input-component";
import { AuthContextProvider } from "../../context";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

export const FormAddUserToEvent = ({ users, setUsers, optionsExist, setValir }) => {
    const { t } = useTranslation();
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
        validator.push(regex.test(tag) ? true : errorValidator(t("invalidmail")))
        validator.push(optionsExist?.includes(tag) ? errorValidator(t("sharedmail")) : true)
        validator.push(user?.email === tag ? errorValidator(t("youdontshareyourself")) : true)
        return !validator.includes(false)
    }

    const onBlur = () => {
        const imp = document.getElementsByName("emails")
        setValir(!imp[0].value)
    }

    return (
        <div className={`flex flex-col space-y-1 mb-5 md:mb-0`}>
            <label className="text-primary">{t("addperson")}</label>
            <div onKeyUp={(e) => { if (!separators.includes(e.key)) { error && setError(null) } }}>
                <TagsInput
                    value={users}
                    onChange={handleSubmit}
                    onKeyUp={onBlur}
                    name="emails"
                    placeHolder={!users.length ? t("pressenter") : t("pressenter")}
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
                    ? <span className="ml-4 text-xs text-red h-1">{t("pressenteraccept")}</span>
                    : users.length
                        ? <span className="ml-4 text-xs text-red h-1">{t("savetoshare")}</span>
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