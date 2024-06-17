
import { Task } from "./Task"
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { SubHeader } from "./SubHeader";
import { AddEvent } from "./AddEvent";
import { GuardarButtom } from "./GuardarButtom";
import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";
import { EventContextProvider } from "../../../context/EventContext";
import { Modal } from "../../Utils/Modal";
import { useToast } from "../../../hooks/useToast";
import { useRouter } from "next/router";
import { useAllowed } from "../../../hooks/useAllowed";



export const Itinerario = ({ data }) => {
    const { domain } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const newDate = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = newDate.toLocaleDateString(navigator?.languages, options)
    const [itinerario, setItinerario] = useState()
    const [tasks, setTasks] = useState()
    const [modal, setModal] = useState(false)
    const toast = useToast()
    const [isAllowed, ht] = useAllowed()
    const disable = !isAllowed("itinerario")

    useEffect(() => {
        const itinerario = event?.itinerarios_array?.find(elem => elem.title === data?.title)
        setItinerario({ ...itinerario })
        if (itinerario?.tasks?.length > 0) {
            setTasks([...itinerario?.tasks?.sort((a, b) => a.hora.localeCompare(b.hora))])
        }
    }, [data, event])


    useEffect(() => {
        if (event && !event?.itinerarios_array?.find(elem => elem.title === data.title)) {
            try {
                fetchApiEventos({
                    query: queries?.createItinerario,
                    variables: {
                        eventID: event._id,
                        title: data?.title
                    },
                    domain
                }).then((result) => {
                    setEvent((old) => {
                        if (!old?.itinerarios_array) {
                            old.itinerarios_array = []
                        }
                        old?.itinerarios_array?.push(result)
                        return { ...old }
                    })
                })
            } catch (error) {
                console.log(error)
            };
        }
    }, [data?.title, event])

    const deleteItinerario = async () => {
        try {
            await fetchApiEventos({
                query: queries.deleteItinerario,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                },
                domain
            })
            setEvent((old) => {
                const f1 = old.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
                old.itinerarios_array.splice(f1, 1)
                return { ...old }
            })
            toast("success", "El itinerario fue restablecido");
            setModal(!modal)
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <>
            <SubHeader button={modal} setButton={setModal} date={date} title={data?.title} itinerario={itinerario} disable={disable} ht={ht} />
            <div className="w-full h-full flex flex-col items-center">
                <div className="w-[88%] divide-y-2 md:divide-y-0">
                    {tasks?.map((elem, idx) => {
                        return (
                            <div key={idx}>
                                <Task task={elem} key={idx} date={date} itinerario={itinerario} title={data?.title} disable={disable} ht={ht} />
                            </div>
                        )
                    })
                    }
                </div>
                <AddEvent tasks={tasks} itinerario={itinerario} disable={disable} />
            </div>
            {
                modal ? (
                    <>
                        <Modal classe={"w-[30%] h-[20%]"}>
                            <div className="flex flex-col items-center justify-center h-full space-y-2">
                                <p className="text-azulCorporativo" >¿ Estas seguro de borrar todo el itinerario ?</p>
                                <div className="space-x-5">
                                    <button onClick={() => setModal(!modal)} className=" bg-gray-400 h-10 w-24 rounded-lg text-white font-body hover:opacity-80">
                                        Descartar
                                    </button>
                                    <button onClick={() => deleteItinerario()} className=" bg-primary h-10 w-24 rounded-lg text-white font-body  hover:opacity-80">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    </>
                ) :
                    null
            }
        </>
    )
}


