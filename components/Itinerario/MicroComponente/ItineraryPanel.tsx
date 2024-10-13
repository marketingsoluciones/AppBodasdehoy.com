
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
    setItinerario: any
    editTitle: boolean
    setEditTitle: any
}

export interface EditTastk {
    values?: Task
    state: boolean
}

interface TaskReduce {
    fecha: number
    tasks?: Task[]
}



export const ItineraryPanel: FC<props> = ({ itinerario, setItinerario, editTitle, setEditTitle }) => {
    const { t } = useTranslation();
    const { config, geoInfo } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()
    const disable = !isAllowed("itinerario")
    const toast = useToast()
    const newDate = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = newDate.toLocaleDateString(i18n?.language)
    const [tasks, setTasks] = useState<Task[]>()
    const [tasksReduce, setTasksReduce] = useState<TaskReduce[]>()
    const [modalStatus, setModalStatus] = useState(false)
    const [modalWorkFlow, setModalWorkFlow] = useState(false)
    const [modalCompartirTask, setModalCompartirTask] = useState(false)
    const [modalPlantilla, setModalPlantilla] = useState(false)
    const [view, setView] = useState<ViewItinerary>("schema")
    const [showEditTask, setShowEditTask] = useState<EditTastk>({ state: false })


    const optionsItineraryButtonBox: OptionsSelect[] = [
        {
            value: "edit",
            icon: <PencilEdit className="w-5 h-5" />,
            title: "editar",
            onclick: (values: Task) => {
                setShowEditTask({ values, state: !showEditTask.state })
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
            const tasks = [...itinerario?.tasks?.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())]
            setTasks(tasks)
            const taskReduce: TaskReduce[] = tasks.reduce((acc: TaskReduce[], item: Task) => {
                const f = new Date(item.fecha)
                const y = f.getUTCFullYear()
                const m = f.getUTCMonth()
                const d = f.getUTCDate()
                const date = new Date(y, m, d).getTime()
                const f1 = acc.findIndex(elem => elem.fecha === date)
                if (f1 < 0) {
                    acc.push({ fecha: date, tasks: [item] })
                } else {
                    acc[f1].tasks.push(item)
                }
                return acc
            }, [])
            setTasksReduce(taskReduce)
        }
    }, [itinerario, event])


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
            {showEditTask?.state && (
                <ModalLeft state={showEditTask} set={setShowEditTask}>
                    <FormTask state={showEditTask} set={setShowEditTask} />
                </ModalLeft>
            )}
            <SubHeader itinerario={itinerario} disable={disable} ht={ht} setModalPlantilla={setModalPlantilla} modalPlantilla={modalPlantilla} view={view} setView={setView} setOptionSelect={setItinerario} editTitle={editTitle} setEditTitle={setEditTitle} setItinerario={setItinerario} />
            <div className={`w-full h-full flex flex-col items-center md:px-2 lg:px-6`}>
                {view !== "table"
                    ? tasksReduce?.map((el, i) =>
                        <div key={i} className="w-full mt-4">
                            <div className={`w-full flex ${view === "schema" ? "justify-start" : "justify-center"}`}>
                                <span className={`${view === "schema" ? "border-primary border-dotted mb-1" : "border-gray-300 mb-1"} border-[1px] px-5 py-[1px] rounded-full text-[12px] font-semibold`}>
                                    {new Date(el?.fecha).toLocaleString(geoInfo?.acceptLanguage?.split(",")[0], { year: "numeric", month: "long", day: "2-digit" })}
                                </span>
                            </div>
                            {el?.tasks?.map((elem, idx) => {
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
                        </div>
                    )
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


