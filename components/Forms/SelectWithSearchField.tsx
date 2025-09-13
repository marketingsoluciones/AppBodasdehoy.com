import { useField } from "formik"
import { ChangeEvent, FC, HtmlHTMLAttributes, useEffect, useState, useRef } from "react"
import { EventContextProvider } from "../../context"
import { useTranslation } from 'react-i18next';
import { IoCloseSharp } from "react-icons/io5";

interface propsSelectField extends HtmlHTMLAttributes<HTMLSelectElement> {
    label?: string
    name?: string
    options?: string[] | { _id: string, title: string }[]
    colSpan?: number
    labelClass?: boolean
    nullable?: boolean

}
const SelectWithSearchField: FC<propsSelectField> = ({ label, children, options, colSpan, labelClass = true, nullable, ...props }) => {
    const { t } = useTranslation();
    const { invitadoCero, event } = EventContextProvider();
    const [field, meta, { setValue }] = useField({ name: props.name })
    const [inputValue, setInputValue] = useState('')
    // Estados para la funcionalidad de búsqueda
    const [isOpen, setIsOpen] = useState(false)
    const [filteredOptions, setFilteredOptions] = useState<string[] | { _id: string, title: string }[]>(options || [])
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const optionRefs = useRef<(HTMLDivElement | null)[]>([])

    // Inicializar valor por defecto para nombre_menu
    useEffect(() => {
        if (props.name === "nombre_menu" && field.value === null) {
            setValue("sin menú")
        }
    }, [props.name, field.value, setValue])

    // Sincronizar inputValue con el valor del campo
    useEffect(() => {
        if (typeof field.value === "string") {
            setInputValue(field.value)
        } else if (field.value && typeof field.value === "object" && 'title' in field.value) {
            setInputValue(field.value.title)
        } else if (field.value === null || field.value === undefined) {
            setInputValue('')
        }
    }, [field.value])

    // Filtrar opciones basado en el término de búsqueda
    useEffect(() => {
        if (!options) return
        const filtered = options.filter((option: string | { _id: string, title: string }) => {
            const searchText = inputValue?.toLowerCase()
            if (typeof option === "string") {
                return option.toLowerCase().includes(searchText)
            } else {
                return option.title.toLowerCase().includes(searchText)
            }
        }) as string[] | { _id: string, title: string }[]
        setFilteredOptions(filtered)
        setSelectedIndex(-1)
        // Reinicializar las referencias cuando cambian las opciones
        optionRefs.current = new Array(filtered.length).fill(null)
    }, [inputValue, options])

    // Función para hacer scroll automático a la opción seleccionada
    const scrollToSelectedOption = (index: number) => {
        const selectedElement = optionRefs.current[index]
        const dropdownElement = dropdownRef.current?.querySelector('.overflow-auto')
        if (selectedElement && dropdownElement) {
            const dropdownRect = dropdownElement.getBoundingClientRect()
            const optionRect = selectedElement.getBoundingClientRect()
            // Calcular la posición relativa dentro del contenedor
            const containerScrollTop = dropdownElement.scrollTop
            const optionOffsetTop = selectedElement.offsetTop
            const containerHeight = dropdownElement.clientHeight
            const optionHeight = selectedElement.offsetHeight
            // Verificar si la opción está fuera del área visible del dropdown
            if (optionRect.top < dropdownRect.top) {
                // Scroll hacia arriba - posicionar la opción en la parte superior
                dropdownElement.scrollTo({
                    top: optionOffsetTop,
                    behavior: 'smooth'
                })
            } else if (optionRect.bottom > dropdownRect.bottom) {
                // Scroll hacia abajo - posicionar la opción en la parte inferior
                dropdownElement.scrollTo({
                    top: optionOffsetTop - containerHeight + optionHeight,
                    behavior: 'smooth'
                })
            }
        }
    }

    // Manejar selección de opción
    const handleOptionSelect = (option: string | { _id: string, title: string }) => {
        if (typeof option === "string") {
            setValue(option)
            setInputValue(option)
        } else {
            setValue(option)
            setInputValue(option.title)
        }
        setIsOpen(false)
        setSelectedIndex(-1)
    }

    // Manejar cambio en el input de búsqueda
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        setIsOpen(true)
        // Si el campo se vacía y es nullable, limpiar el valor
        if (value === '' && nullable) {
            setValue('')
        }
    }

    // Manejar navegación con teclado
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true)
                return
            }
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                const nextIndex = selectedIndex < filteredOptions.length - 1 ? selectedIndex + 1 : 0
                setSelectedIndex(nextIndex)
                // Hacer scroll automático después de un pequeño delay para que el estado se actualice
                setTimeout(() => scrollToSelectedOption(nextIndex), 0)
                break
            case 'ArrowUp':
                e.preventDefault()
                const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredOptions.length - 1
                setSelectedIndex(prevIndex)
                // Hacer scroll automático después de un pequeño delay para que el estado se actualice
                setTimeout(() => scrollToSelectedOption(prevIndex), 0)
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
                    handleOptionSelect(filteredOptions[selectedIndex])
                }
                break
            case 'Escape':
                setIsOpen(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
                break
        }
    }

    // Manejar hover del mouse sobre las opciones
    const handleOptionHover = (index: number) => {
        setSelectedIndex(index)
        scrollToSelectedOption(index)
    }

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSelectedIndex(-1)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!isOpen) {
            setInputValue(field.value)
        }
    }, [isOpen])

    return (
        <div className={`relative w-full h-full col-span${colSpan && `-${colSpan}`} content-between`}>
            <label className={`font-display text-sm ${labelClass ? "text-primary" : "text-textGrisClaro"} w-full`}>{label}</label>
            <div className="relative" ref={dropdownRef}>
                <input
                    ref={inputRef}
                    type="text"
                    className={`cursor-default font-display capitalize text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 pr-10 pl-3 rounded-xl focus:outline-none ${props.className}`}
                    value={inputValue}
                    onChange={handleInputChange}
                    onClick={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={nullable ? t("select") : ""}
                    autoComplete="off"
                />
                {inputValue && <div onClick={() => {
                    setInputValue('')
                    setValue('')
                    setIsOpen(false)
                }} className="cursor-pointer absolute inset-y-0 right-8 flex items-center px-1 hover:scale-110 transition-all duration-300 text-gray-500">
                    <IoCloseSharp />
                </div>}
                <div onClick={() => {
                    !isOpen && setInputValue('')
                    setIsOpen(!isOpen)
                    inputRef.current?.focus()
                }} className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 pl-1 hover:scale-110 transition-all duration-300">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                {/* Dropdown con opciones filtradas */}
                {isOpen && (
                    <div className="absolute z-50 w-full bg-white border border-gray-400 h-72 overflow-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                {t("no_results")}
                            </div>
                        ) : (
                            filteredOptions.map((option: string | { _id: string, title: string }, idx: number) => {
                                const label = typeof option === "string" ? option : option?.title
                                const value = typeof option === "string" ? option : option?._id
                                const displayValue = value && `${!value?.match("(nombre)") ? value : value?.replace("(nombre)", (invitadoCero ? invitadoCero : event?.grupos_array[0]))}`

                                return (
                                    <div
                                        key={idx}
                                        ref={(el) => (optionRefs.current[idx] = el)}
                                        className={`select-none px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 ${selectedIndex === idx ? 'bg-gray-100' : ''
                                            }`}
                                        onClick={() => handleOptionSelect(option)}
                                        onMouseEnter={() => handleOptionHover(idx)}
                                    >
                                        {displayValue}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
            {(meta.touched || meta.error) && <p className="font-display absolute rounded-xl text-xs text-red flex gap-1">{meta.error}</p>}
        </div>
    )
}

export default SelectWithSearchField
