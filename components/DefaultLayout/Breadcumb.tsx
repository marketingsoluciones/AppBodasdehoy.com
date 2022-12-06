import Link from 'next/link'
import React from 'react'
import { FlechaIcon } from '../icons'
import { EventContextProvider, EventsGroupContextProvider } from "../../context";
import SelectField from '../Forms/SelectField';
import { Form, Formik } from 'formik';
import { setCookie } from '../../utils/Cookies';
import { useRouter } from 'next/router';

const Breadcumbs = (/* { evento } */) => {
    const { event, setEvent } = EventContextProvider()
    const { eventsGroup } = EventsGroupContextProvider()
    console.log(event)
   

    /* arry para mostrar la lista de eventos */
    const EventArry: string[] = eventsGroup.reduce((acc, el) => acc.concat(el.nombre), [])

   /*  const { nombre } = evento
    const router = useRouter()

    const handleClick = () => {
        try {
            setEvent(evento);
            setCookie(nombre);
        } catch (error) {
            console.log(error);
        }
    }; */


    /* evalua la informacion del formik */
    type MyValues = {
        evento: string
    }

    const initialValues: MyValues = {
        evento: "",
    };


    return (
        <>
            <div className="flex gap-2 items-center w-max py-2 font-display text-sm text-gray-500 *cursor-pointer *hover:text-gray-400  transform transition">
                <FlechaIcon />
                <Link href="/resumen-evento" passHref>
                    <p >Volver a resumen del evento: {event?.nombre}</p>
                </Link>

                {/* <span>Selecciona tu evento</span>

                <Formik
                    initialValues={initialValues}
                    onSubmit={handleClick}

                >
                    {({ isSubmitting }) => (
                        <Form className='cursor-pointer'
                            onSubmit={handleClick}
                        >

                            <SelectField
                                name="evento"
                                label=""
                                options={EventArry}
                            />
                            <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
                                        }`}
                                >
                                    Guardar
                                </button>

                        </Form>
                    )}
                </Formik> */}
            </div>
        </>
    )
}

export default React.memo(Breadcumbs)
