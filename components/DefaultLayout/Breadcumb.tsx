import Link from 'next/link'
import React from 'react'
import { FlechaIcon } from '../icons'
import { EventContextProvider, EventsGroupContextProvider } from "../../context";
import SelectField from '../Forms/SelectField';
import { Form, Formik } from 'formik';
import { setCookie } from '../../utils/Cookies';
import { useRouter } from 'next/router';

const Breadcumbs = () => {
    const { event, setEvent } = EventContextProvider()
    const { eventsGroup } = EventsGroupContextProvider()
    console.log(event)


    /* arry para mostrar la lista de eventos */
    const EventArry: string[] = eventsGroup.reduce((acc, el) => acc.concat(el.nombre), [])

    /*  const { nombre } = evento */
   /*  const router = useRouter() */

    const handleChange = (nombre) => {
        try {
            console.log("nombre",nombre)
            setEvent(eventsGroup.find((el: any) => el.nombre === nombre ));
        } catch (error) {
            console.log(error);
        }
    };


    /* evalua la informacion del formik */
   /*  type MyValues = {
        evento: string
    }

    const initialValues: MyValues = {
        evento: "",
    }; */


    return (
        <>
            <div className="flex gap-2 items-center w-max py-2 font-display text-sm text-gray-500 *cursor-pointer *hover:text-gray-400  transform transition">
                {/* <FlechaIcon />
                <Link href="/resumen-evento" passHref>
                    <p >Volver a resumen del evento: {event?.nombre}</p>
                </Link> */}

                <span>Selecciona tu evento</span>

                <select value={event.nombre} onChange={ e => handleChange(e.target.value) } className="w-28 rounded py-1 truncate ">
                    {EventArry.map((item, idx)=>(
                        <option key={idx} value={item} className="text-ellipsis ">{item}</option>
                    ))}
                </select>

            </div>
        </>
    )
}

export default React.memo(Breadcumbs)
