
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
    const router = useRouter()





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
    }, [event._id, data.title, event, router])

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
            <SubHeader button={modal} setButton={setModal} date={date} title={data?.title} itinerario={itinerario} />
            <div className="w-full h-full overflow-auto flex flex-col items-center">
                <div className="w-[88%]">
                    {tasks?.map((elem, idx) => {
                        return (
                            <Task task={elem} key={idx} date={date} itinerario={itinerario} title={data?.title} />
                        )
                    })
                    }
                </div>
                <AddEvent tasks={tasks} itinerario={itinerario} />
            </div>
            {
                modal ? (
                    <>
                        <Modal classe={"w-[40%] h-[20%]"}>
                            <div className="flex flex-col items-center justify-center h-full space-y-2">
                                <p className="text-azulCorporativo" >¿ Estas seguro de borrar todo el itinerario ?</p>
                                <div className="space-x-2">
                                    <button onClick={() => setModal(!modal)} className=" bg-botonBack h-10 w-20 rounded-lg text-white text-base font-base ">
                                        Descartar
                                    </button>
                                    <button onClick={() => deleteItinerario()} className=" bg-rosa h-10 w-20 rounded-lg justify-center text-base text-white">
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


