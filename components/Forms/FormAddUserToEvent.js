import { TagsInput } from "react-tag-input-component";
import { AuthContextProvider } from "../../context";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

export const FormAddUserToEvent = ({ users, setUsers, optionsExist, setValir }) => {
    const { t } = useTranslation();
    const { user } = AuthContextProvider()
    const [error, setError] = useState(null)
    const [showInstruction, setShowInstruction] = useState(false)
    const [currentInputValue, setCurrentInputValue] = useState("")
    const [isMobile, setIsMobile] = useState(false)


    // Función para detectar dispositivos móviles de forma más robusta
    const detectMobile = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        return isMobileDevice || (isTouchDevice && window.innerWidth <= 768);
    }

    const handleChangeInput = (e) => {
        const value = e?.target?.value || ""
        setCurrentInputValue(value)
        
        if (value.length) {
            setShowInstruction(true)
        } else {
            setShowInstruction(false)
        }
    }

    // Función para agregar el tag actual manualmente
    const addCurrentTag = () => {
        if (currentInputValue.trim() && beforeAddValidate(currentInputValue.trim())) {
            const newUsers = [...users, currentInputValue.trim().toLowerCase()]
            setUsers(newUsers)
            setCurrentInputValue("")
            
            // Limpiar el input del componente TagsInput
            setTimeout(() => {
                const input = document.getElementsByClassName("rti--input")[0]
                if (input) {
                    input.value = ""
                    input.focus()
                }
            }, 10)
        }
    }

    // Detectar eventos del teclado móvil para separadores
    const handleMobileInput = (e) => {
        if (!isMobile) return
        
        const value = e.target.value
        const separators = [",", ";"]
        const lastChar = value.slice(-1)
        
        if (separators.includes(lastChar)) {
            e.preventDefault()
            const emailToAdd = value.slice(0, -1).trim()
            if (emailToAdd && beforeAddValidate(emailToAdd)) {
                const newUsers = [...users, emailToAdd.toLowerCase()]
                setUsers(newUsers)
                setCurrentInputValue("")
                
                setTimeout(() => {
                    const input = document.getElementsByClassName("rti--input")[0]
                    if (input) {
                        input.value = ""
                        input.focus()
                    }
                }, 10)
            }
        }
    }

    useEffect(() => {
        // Detectar si es móvil al montar el componente
        setIsMobile(detectMobile())
        
        const input = document.getElementsByClassName("rti--input")[0]
        if (input) {
            input.addEventListener("keyup", handleChangeInput)
            input.addEventListener("input", handleChangeInput)
            
            // Para móviles, agregar evento especial para detectar separadores
            if (detectMobile()) {
                input.addEventListener("input", handleMobileInput)
            }
        }
        
        return () => {
            if (input) {
                input.removeEventListener("keyup", handleChangeInput)
                input.removeEventListener("input", handleChangeInput)
                input.removeEventListener("input", handleMobileInput)
            }
        }
    }, [users, currentInputValue])

    const handleSubmit = (selectedOption) => {
        setUsers(selectedOption.map(elem => elem.toLowerCase()))
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
        <div className={`flex flex-col space-y-1 mb-5 md:mb-0 `}>
            {/* <label className="text-primary">{t("addperson")}</label> */}
            <div className="relative">
                <div onKeyUp={(e) => { if (!separators.includes(e.key)) { error && setError(null) } }} >
                    <TagsInput
                        value={users}
                        onChange={handleSubmit}
                        onKeyUp={onBlur}
                        name="emails"
                        /*  placeHolder={!users.length ? t("pressenter") : t("pressenter")} */
                        beforeAddValidate={beforeAddValidate}
                        separators={separators}
                        classNames={{
                            tag: "!text-sm !px-2 !rounded-lg",
                            input: `!text-sm !rounded-lg ${isMobile && currentInputValue.trim() ? "!pr-12" : ""} !w-full`
                        }}
                    />
                </div>
                
                {/* Botón flotante para agregar en móvil - solo aparece cuando hay texto */}
                {isMobile && currentInputValue.trim() && (
                    <button
                        type="button"
                        onClick={addCurrentTag}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 
                                 bg-primary hover:bg-primary-dark text-white 
                                 w-8 h-8 rounded-full flex items-center justify-center
                                 text-sm font-semibold transition-all duration-200
                                 shadow-md hover:shadow-lg z-10"
                        aria-label="Agregar email"
                        title="Toca para agregar este email"
                    >
                        +
                    </button>
                )}
            </div>
            <div className="h-4 -translate-y-2">
                {(showInstruction && !error)
                    ? <span className="ml-4 text-xs text-red h-1">
                        {isMobile 
                            ? "toca el botón + para agregar el email"
                            : t("pressenteraccept")
                        }
                      </span>
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