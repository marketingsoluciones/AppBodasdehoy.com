
import { TaskNew } from "./TaskNew"
import { fetchApiEventos, queries } from "../../../utils/Fetching";
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
import { ItineraryColumns } from "./ItineraryColumns";
import ModalLeft from "../../Utils/ModalLeft";
import { PencilEdit } from "../../icons";
import { GoEyeClosed, GoGitBranch } from "react-icons/go";
import { LiaLinkSolid } from "react-icons/lia";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { OptionsSelect, Task, Itinerary } from "../../../utils/Interfaces"
import { SubHeader } from "./SubHeader";
import { ViewItinerary } from "../../../pages/invitados";
import FormTask from "../../Forms/FormTask";

interface props {
    itinerario: Itinerary
}

export const ItineraryPanel: FC<props> = ({ itinerario }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()
    const disable = !isAllowed("itinerario")
    const toast = useToast()
    const newDate = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = newDate.toLocaleDateString(i18n?.language)
    const [tasks, setTasks] = useState<Task[]>()
    const [modal, setModal] = useState({ state: false, title: null, handle: () => { } })
        const [modalStatus, setModalStatus] = useState(false)
    const [modalWorkFlow, setModalWorkFlow] = useState(false)
    const [modalCompartirTask, setModalCompartirTask] = useState(false)
    const [modalPlantilla, setModalPlantilla] = useState(false)
    const [view, setView] = useState<ViewItinerary>("schema")
    const [showEditTask, setShowEditTask] = useState(false)
    

    const optionsItineraryButtonBox: OptionsSelect[] = [
        {
            value: "edit",
            icon: <PencilEdit className="w-5 h-5" />,
            title: "editar",
            onclick: (values) => {
                console.log(100011, values)
                setShowEditTask(!showEditTask)
            }
        },
        {
            value: "status",
            icon: <GoEyeClosed className="w-5 h-5" />,
            title: "estado",
            onclick: () => setModalStatus(!modalStatus)
        },
        {
            value: "flujo",
            icon: <GoGitBranch className="w-5 h-5" />,
            title: "flow",
            onclick: () => setModalWorkFlow(!modalWorkFlow)
        },
        {
            value: "share",
            icon: <LiaLinkSolid className="w-5 h-5" />,
            title: "compartir",
            onclick: () => setModalCompartirTask(!modalCompartirTask)
        },
        {
            value: "delete",
            icon: <MdOutlineDeleteOutline className="w-5 h-5" />,
            title: "borrar",
            onclick: () => disable ? ht() : deleteTask()
        }
    ]

    useEffect(() => {
        if (itinerario?.tasks?.length > 0) {
            setTasks([...itinerario?.tasks?.sort((a, b) => a.hora.localeCompare(b.hora))])
        }
    }, [itinerario])

    const handleDeleteItinerario = async () => {
        console.log(100017, "aquie")
        // setModal({
        //                       state: true,
        //                       title: <span>
        //                         <strong>
        //                           {`${row.row.cells[0].value} `}
        //                         </strong>
        //                         <span>{`${!row.row.cells[5].value
        //                           ? "será borrado"
        //                           : row.row.cells[5].value === 1
        //                             ? `y su acompañante serán borrados`
        //                             : `y sus ${row.row.cells[5].value} acompañantes serán borrados`
        //                           } de la lista de invitados`}
        //                         </span>
        //                       </span>,
        //                       handle: async () => {
        //                         try {
        //                             await fetchApiEventos({
        //                                 query: queries.deleteItinerario,
        //                                 variables: {
        //                                     eventID: event._id,
        //                                     itinerarioID: itinerario?._id,
        //                                 },
        //                                 domain: config.domain
        //                             })
        //                             const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
        //                             event.itinerarios_array.splice(f1, 1)
        //                             setEvent({...event})
        //                             //toast("success", t("El itinerario fue restablecido"));
        //                             setModal(!modal.state)
        //                         } catch (error) {
        //                             console.log(error)
        //                         }
        //                       }
        //                     })
    }

    const deleteTask = async () => {
        try {
            await fetchApiEventos({
                query: queries.deleteTask,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                    taskID: "task._id",
                },
                domain: config.domain
            })
            setEvent((old) => {
                const f1 = old.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
                const f2 = old.itinerarios_array[f1].tasks.findIndex(elem => elem._id === "task._id")
                old.itinerarios_array[f1].tasks.splice(f2, 1)
                return { ...old }
            })
            toast("success", t("activitydeleted"));
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <>
            {showEditTask && (
                <ModalLeft state={showEditTask} set={setShowEditTask}>
                    <FormTask state={showEditTask} set={setShowEditTask}/>
                </ModalLeft>
            )}
            <SubHeader button={modal} setButton={setModal} date={date} title={itinerario?.title} disable={disable} ht={ht} setModalPlantilla={setModalPlantilla} modalPlantilla={modalPlantilla} view={view} setView={setView} handleDeleteItinerario={handleDeleteItinerario} />
            <div className={`w-full h-full flex flex-col items-center md:px-2 lg:px-6`}>
                {view !== "table"
                    ? <>
                        <div className={`w-full flex ${view === "schema" ? "justify-start" : "justify-center"}`}>
                            <span className={`${view === "schema" ? "border-primary border-dotted mb-3" : "border-gray-300 mb-1"} border-[1px] px-5 py-[1px] rounded-full text-[12px]`}>
                                Sábado 22 de abril de 2022
                            </span>
                        </div>
                        {tasks?.map((elem, idx) => {
                            return (
                                <TaskNew
                                    key={idx}
                                    task={elem}
                                    itinerario={itinerario}
                                    disable={disable}
                                    ht={ht}
                                    view={view}
                                    optionsItineraryButtonBox={optionsItineraryButtonBox}
                                />
                            )
                        })}
                    </>
                    : <div className="relative overflow-x-auto md:overflow-x-visible">
                        <div className="w-[250%] md:w-[100%]">
                            <ItineraryColumns
                                data={tasks}
                                setModalStatus={setModalStatus}
                                modalStatus={modalStatus}
                                setModalWorkFlow={setModalWorkFlow}
                                modalWorkFlow={modalWorkFlow}
                                setModalCompartirTask={setModalCompartirTask}
                                modalCompartirTask={modalCompartirTask}
                                deleteTask={deleteTask}
                                ht={ht}
                                showEditTask={showEditTask}
                                setShowEditTask={setShowEditTask}
                            />
                        </div>
                    </div>
                }
                <AddEvent tasks={tasks} itinerario={itinerario} disable={disable} />
            </div>
            {/* {modal && <Modal classe={"w-[95%] md:w-[450px] h-[200px]"}>
                <DeleteConfirmation setModal={setModal} modal={modal} />
            </Modal>
            } */}
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


