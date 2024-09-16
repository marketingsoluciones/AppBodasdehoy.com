import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import Select, { StylesConfig } from 'react-select'
import { useTranslation } from 'react-i18next';



import { EventContextProvider, EventsGroupContextProvider } from "../../context";


const Breadcumbs = () => {
    const { t } = useTranslation();
    const { event, setEvent } = EventContextProvider()
    const { eventsGroup } = EventsGroupContextProvider()
    const [isClearable, setIsClearable] = useState(false);
    const [isSearchable, setIsSearchable] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRtl, setIsRtl] = useState(false);
    const [idxOptions, setIdxOptions] = useState()
    const [value, setValue] = useState()



    /* arry para mostrar la lista de eventos */
    const EventArry: string[] = eventsGroup.reduce((acc, el) => acc.concat(el.nombre), [])

    const options = useMemo(() => {
        const imagen = {
            boda: "/cards/boda.webp",
            comunión: "/cards/comunion.webp",
            cumpleaños: "/cards/cumpleanos.webp",
            bautizo: "/cards/bautizo.webp",
            babyshower: "/cards/baby.webp",
            "desdepida de soltero": "/cards/despedida.webp",
            graduación: "/cards/graduacion.webp",
            otro:"/cards/pexels-pixabay-50675.jpg"
          };
        console.log(eventsGroup)
        return eventsGroup.reduce((acc, item) => {
            acc.push({
                value: item.nombre,
                label:
                    <div className='flex items-center space-x-3  w-full'>
                        <span className='text-black truncate' >{item.nombre}</span>
                        {item?.tipo ?
                                <img  className='rounded-full w-[40px] h-[40px]' src={imagen[item.tipo]}  />
                            :null
                        }
                    </div>
            })
            return acc
        }, [])
    }, [eventsGroup])



    /* funcion que setea el contexto eventGroups que recibe del select  */
    const handleChange = (e: any) => {
        try {
            setEvent(eventsGroup.find((el: any) => el.nombre === e));
        } catch (error) {
            console.log(error);
        }
    };


    const selectStyle = {
        control: (styles) => ({ ...styles, backgroundColor: 'transparent', border:"none" ,cursor:"pointer", selected:"none", isSelected:"red" }),
    }


return (
    <div className='flex items-center gap-2 py-4'>
        <span className='font-body cursor-default'>
            {t("event")}
        </span>


        <Select
            className=' font-body z-30 w-full capitalize '
            onChange={(e) => { handleChange(e?.value) }}
            placeholder={event?.nombre}
            options={options}
            isDisabled={isDisabled}
            isLoading={isLoading}
            isClearable={isClearable}
            isSearchable={isSearchable}
            styles={selectStyle}
        />

    </div >
)
}

export default React.memo(Breadcumbs)