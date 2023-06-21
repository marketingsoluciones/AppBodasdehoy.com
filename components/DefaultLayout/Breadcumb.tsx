import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import Select, { StylesConfig } from 'react-select'



import { EventContextProvider, EventsGroupContextProvider } from "../../context";


const Breadcumbs = () => {
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
        return eventsGroup.reduce((acc, item) => {
            acc.push({
                value: item.nombre,
                label:
                    <div >
                        {/* {item?.imgAvatar?.i320 ?
                            <Flex w={"24px"} h={"24px"} border={"1px"} borderColor={"gray.400"} rounded={"full"} isTruncated>
                                <Image width={"24px"} height={"24px"} layout="intrinsic" src={`${process.env.NEXT_PUBLIC_BASE_URL}${item.imgAvatar.i320}`} objectFit="contain" objectPosition={"center"} />
                            </Flex>
                            : <Avatar h={"24px"} w={"24px"} />
                        } */}
                        <span >{item.nombre}</span>
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

    const dot = (color = 'red') => ({
        alignItems: 'start',
        display: 'flex',

        ':before': {
            backgroundColor: color,
            borderRadius: 10,
            content: '" "',
            display: 'block',
            marginRight: 8,
            height: 10,
            width: 10,
        },
    });

    const selectStyle = {
        control: (styles) => ({ ...styles, backgroundColor: 'transparent', border:"none" ,cursor:"pointer"  }),
    }


return (
    <div className='flex items-center gap-2 py-4'>
        <span className='font-body cursor-default'>
            Evento
        </span>


        <Select
            className=' font-body z-30 w-full '
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