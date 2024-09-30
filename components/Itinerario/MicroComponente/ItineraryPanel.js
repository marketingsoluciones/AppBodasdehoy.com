
import { Task } from "./Task"
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { SubHeader } from "./SubHeader";
import { AddEvent } from "./AddEvent";
import { GuardarButtom } from "./GuardarButtom";
import { FC, useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context/AuthContext";
import { EventContextProvider } from "../../../context/EventContext";
import { Modal } from "../../Utils/Modal";
import { useToast } from "../../../hooks/useToast";
import { useRouter } from "next/router";
import { useAllowed } from "../../../hooks/useAllowed";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { WarningMessage } from "./WarningMessage";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

export const ItineraryPanel = ({ data }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()
    const disable = !isAllowed("itinerario")
    const toast = useToast()
    const newDate = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = newDate.toLocaleDateString(i18n?.language, options)
    const [itinerario, setItinerario] = useState()
    const [tasks, setTasks] = useState()
    const [modal, setModal] = useState(false)
    const [modalStatus, setModalStatus] = useState(false)
    const [modalWorkFlow, setModalWorkFlow] = useState(false)
    const [modalCompartirTask, setModalCompartirTask] = useState(false)
    const [modalPlantilla, setModalPlantilla] = useState(false)

    useEffect(() => {
        const itinerario = event?.itinerarios_array?.find(elem => elem.title === data?.title)
        setItinerario({ ...itinerario })
        if (itinerario?.tasks?.length > 0) {
            setTasks([...itinerario?.tasks?.sort((a, b) => a.hora.localeCompare(b.hora))])
        }
    }, [data, event])


    useEffect(() => {
        if (event && !event?.itinerarios_array?.find(elem => elem.title === data?.title)) {
            try {
                fetchApiEventos({
                    query: queries?.createItinerario,
                    variables: {
                        eventID: event._id,
                        title: data?.title
                    },
                    domain: config.domain
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
            toast("success", t("El itinerario fue restablecido"));
            setModal(!modal)
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <>
            <SubHeader button={modal} setButton={setModal} date={date} title={data?.title} itinerario={itinerario} disable={disable} ht={ht} setModalPlantilla={setModalPlantilla} modalPlantilla={modalPlantilla} />
            <div className="w-full h-full flex flex-col items-center">
                <div className="w-[88%] divide-y-2 md:divide-y-0">
                    {tasks?.map((elem, idx) => {
                        return (
                            <div key={idx}>
                                <Task
                                    task={elem}
                                    itinerario={itinerario}
                                    title={data?.title}
                                    disable={disable}
                                    ht={ht}
                                    setModalStatus={setModalStatus}
                                    modalStatus={modalStatus}
                                    setModalWorkFlow={setModalWorkFlow}
                                    modalWorkFlow={modalWorkFlow}
                                    setModalCompartirTask={setModalCompartirTask}
                                    modalCompartirTask={modalCompartirTask}

                                />
                            </div>
                        )
                    })
                    }
                </div>
                <AddEvent tasks={tasks} itinerario={itinerario} disable={disable} />
            </div>
            {modal && <Modal classe={"w-[95%] md:w-[450px] h-[200px]"}>
                <DeleteConfirmation setModal={setModal} modal={modal} title={t("deleteitinerary")} handle={deleteItinerario} />
            </Modal>
            }
            {modalStatus && <Modal classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalStatus} modal={modalStatus} title={t("visibility")} />
            </Modal>
            }
            {modalWorkFlow && <Modal classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalWorkFlow} modal={modalWorkFlow} title={t("workflow")} />
            </Modal>
            }
            {modalCompartirTask && <Modal classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalCompartirTask} modal={modalCompartirTask} title={t("share")} />
            </Modal>
            }
            {modalPlantilla && <Modal classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalPlantilla} modal={modalPlantilla} title={t("template")} />
            </Modal>
            }
        </>
    )
}


