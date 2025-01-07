
import { TaskNew } from "./TaskNew"
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AddEvent } from "./AddEvent";
import { FC, useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context/AuthContext";
import { EventContextProvider } from "../../../context/EventContext";
import { Modal } from "../../Utils/Modal";
import { useToast } from "../../../hooks/useToast";
import { useAllowed, } from "../../../hooks/useAllowed";
import { WarningMessage } from "./WarningMessage";
import { useTranslation } from 'react-i18next';
import { ItineraryColumns } from "./ItineraryColumns";
import ModalLeft from "../../Utils/ModalLeft";
import { PencilEdit } from "../../icons";
import { GoEye, GoEyeClosed, GoGitBranch } from "react-icons/go";
import { LiaLinkSolid, LiaUserClockSolid } from "react-icons/lia";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { OptionsSelect, Task, Itinerary } from "../../../utils/Interfaces"
import { SubHeader } from "./SubHeader";
import { ViewItinerary } from "../../../pages/invitados";
import FormTask from "../../Forms/FormTask";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import { SimpleDeleteConfirmation } from "./DeleteConfirmation";
import { useRouter } from "next/router";
import { VscFiles } from "react-icons/vsc";
import { TbLock } from "react-icons/tb";
import { TbLockOpen } from "react-icons/tb";

interface props {
    itinerario: Itinerary
    editTitle: boolean
    setEditTitle: any
    view: ViewItinerary
    handleDeleteItinerario: any
    handleUpdateTitle: any
    title: string
    setTitle: any
}

export interface EditTastk {
    values?: Task
    state: boolean | string
}

interface TaskReduce {
    fecha: number
    tasks?: Task[]
}

export const ItineraryPanel: FC<props> = ({ itinerario, editTitle, setEditTitle, view, handleDeleteItinerario, handleUpdateTitle, title, setTitle }) => {
    const { t } = useTranslation();
    const { config, geoInfo, user } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()
    const toast = useToast()
    const [tasks, setTasks] = useState<Task[]>()
    const [tasksReduce, setTasksReduce] = useState<TaskReduce[]>()
    const [modalStatus, setModalStatus] = useState(false)
    const [modalWorkFlow, setModalWorkFlow] = useState(false)
    const [modalCompartirTask, setModalCompartirTask] = useState(false)
    const [modalPlantilla, setModalPlantilla] = useState(false)
    const [showEditTask, setShowEditTask] = useState<EditTastk>({ state: false })
    const [selectTask, setSelectTask] = useState<string>()
    const storage = getStorage();
    const [modal, setModal] = useState({ state: false, title: null, values: null, itinerario: null })
    const [showModalCompartir, setShowModalCompartir] = useState({ state: false, id: null });
    const router = useRouter()

    const optionsItineraryButtonBox: OptionsSelect[] = [
        {
            value: "edit",
            icon: <PencilEdit className="w-5 h-5" />,
            title: "editar",
            onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setShowEditTask({ values, state: !showEditTask.state }) : setShowEditTask({ values, state: values?.estatus === true || values?.estatus === "true"  ? !showEditTask.state : null }),
            vew: "all"
        },
        {
            value: "status",
            icon: <GoEyeClosed className="w-5 h-5" />,
            getIcon: (value: boolean) => {

                if (value) {
                    return <GoEyeClosed className="w-5 h-5" />
                }
                return <GoEye className="w-5 h-5" />
            },
            title: "estado",
            onClick: (values: Task) => !isAllowed() ? ht() : handleAddSpectatorView(values),
            vew: "all"
        },
        {
            value: "flujo",
            icon: <GoGitBranch className="w-5 h-5" />,
            title: "flow",
            onClick: () => !isAllowed() ? ht() : setModalWorkFlow(!modalWorkFlow),
            vew: "tasks"
        },
        {
            value: "share",
            icon: <LiaLinkSolid className="w-5 h-5" />,
            title: "Link calendario",
            vew: "tasks"
        },
        {
            value: "delete",
            icon: <MdOutlineDeleteOutline className="w-5 h-5" />,
            title: "borrar",
            onClick: (values: Task, itinerario: Itinerary) => !isAllowed() ? ht() : setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }),
            vew: "all"
        },
        {
            value: "estatus",
            icon: <TbLock className="w-5 h-5" />,
            getIcon: (valor: boolean | string) => {
                console.log("valor", valor)
                if (valor === false || valor === "false") {
                    return <TbLock className="w-5 h-5" />
                }
                return <TbLockOpen className="w-5 h-5" />
            },
            title: "estatus",
            onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? handleChangeStatus(values) : null,
            vew: "all"
        },

    ]

    useEffect(() => {
        if (itinerario?.tasks?.length > 0) {
            const tasks = [...itinerario?.tasks?.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())].filter(elem => {
                return (
                    view === "schema"
                    || ["/itinerario"].includes(window?.location?.pathname)
                    || elem.spectatorView
                    || event.usuario_id === user.uid
                    || isAllowed()
                ) &&
                    true
            })
            setTasks(tasks)
            const taskReduce: TaskReduce[] = tasks.reduce((acc: TaskReduce[], item: Task) => {
                const f = new Date(item.fecha)
                const y = f.getUTCFullYear()
                const m = f.getUTCMonth()
                const d = f.getUTCDate()
                const date = new Date(y, m, d).getTime()
                const f1 = acc.findIndex(elem => elem.fecha === date)
                if (f1 < 0) {
                    acc.push({ fecha: item.fecha ? date : null, tasks: [item] })
                } else {
                    acc[f1].tasks.push(item)
                }
                return acc
            }, [])
            setTasksReduce(taskReduce)
        } else {
            setTasks([])
            setTasksReduce([])
        }
    }, [itinerario, event])

    const handleAddSpectatorView = async (values: Task) => {
        try {
            fetchApiEventos({
                query: queries.editTask,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                    taskID: values._id,
                    variable: "spectatorView",
                    valor: JSON.stringify(!values?.spectatorView)
                },
                domain: config.domain
            })
                .then(() => {
                    const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
                    const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id)
                    event.itinerarios_array[f1].tasks[f2].spectatorView = !values?.spectatorView
                    setEvent({ ...event })
                    toast("success", t("Item guardado con exito"))
                    setShowEditTask({ state: false })
                })
        } catch (error) {
            console.log(error)
        }

    }

    const handleChangeStatus = async (values: Task) => {
        try {
            fetchApiEventos({
                query: queries.editTask,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                    taskID: values._id,
                    variable: "estatus",
                    valor: JSON.stringify(!values?.estatus)
                },
                domain: config.domain
            })
                .then(() => {
                    const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
                    const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id)
                    event.itinerarios_array[f1].tasks[f2].estatus = !values?.estatus
                    setEvent({ ...event })
                    toast("success", t("Item guardado con exito"))
                    setShowEditTask({ state: false })
                })
        } catch (error) {
            console.log(error)
        }

    }

    const deleteTask = async (values: Task, itinerario: Itinerary) => {
        try {
            const storageFolderRef = ref(storage, `${values?._id}`)
            listAll(storageFolderRef)
                .then(listAllFiles => {
                    listAllFiles.items.forEach(async (itemRef) => {
                        await deleteObject(itemRef)
                    });
                })
            await fetchApiEventos({
                query: queries.deleteTask,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                    taskID: values._id,
                },
                domain: config.domain
            })
            const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
            const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id)
            event.itinerarios_array[f1].tasks.splice(f2, 1)
            setEvent({ ...event })
            setModal({ state: false, title: null, values: null, itinerario: null })
            toast("success", t(itinerario.tipo === "itinerario" ? "activitydeleted" : "servicedeleted"));
        } catch (error) {
            console.log(1000501, error)
        }
    }
    useEffect(() => {
        if (router?.query?.task) {
            setSelectTask(`${router.query.task}`)
        }
    }, [router])



    return (
        <div className="w-full flex-1 flex flex-col overflow-y-scroll">
            {showEditTask?.state && (
                <ModalLeft state={showEditTask} set={setShowEditTask} clickAwayListened={false}>
                    <div className="w-full flex flex-col items-start justify-start" >
                        <FormTask showEditTask={showEditTask} setShowEditTask={setShowEditTask} itinerarioID={itinerario._id} />
                    </div>
                </ModalLeft>
            )}
            {modal.state && <Modal set={setModal} classe={"w-[95%] md:w-[450px] h-[200px]"}>
                <SimpleDeleteConfirmation setModal={setModal} modal={modal} deleteTask={deleteTask} />
            </Modal>}

            {["/itinerario"].includes(window?.location?.pathname) && <SubHeader view={view} itinerario={itinerario} editTitle={editTitle} setEditTitle={setEditTitle} handleDeleteItinerario={handleDeleteItinerario} handleUpdateTitle={handleUpdateTitle} title={title} setTitle={setTitle} />}
            <div className={`w-full flex-1 flex flex-col md:px-2 lg:px-6`}>
                {
                    tasksReduce?.length > 0 ?
                        view !== "table"
                            ? tasksReduce?.map((el, i) =>
                                <div key={i} className="w-full mt-4">
                                    {["/itinerario"].includes(window?.location?.pathname) && <div className={`w-full flex ${view === "schema" ? "justify-start" : "justify-center"}`}>
                                        <span className={`${view === "schema" ? "border-primary border-dotted mb-1" : "border-gray-300 mb-1"} border-[1px] px-5 py-[1px] rounded-full text-[12px] font-semibold`}>
                                            {new Date(el?.fecha).toLocaleString(geoInfo?.acceptLanguage?.split(",")[0], { year: "numeric", month: "long", day: "2-digit" })}
                                        </span>
                                    </div>}
                                    {el?.tasks?.map((elem, idx) => {
                                        return (
                                            <TaskNew
                                                id={elem._id}
                                                key={idx}
                                                task={elem}
                                                itinerario={itinerario}
                                                view={view}
                                                optionsItineraryButtonBox={optionsItineraryButtonBox}
                                                isSelect={selectTask === elem._id}
                                                showModalCompartir={showModalCompartir}
                                                setShowModalCompartir={setShowModalCompartir}
                                                onClick={() => { setSelectTask(elem._id) }}
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
                                        showEditTask={showEditTask}
                                        setShowEditTask={setShowEditTask}
                                        optionsItineraryButtonBox={optionsItineraryButtonBox}
                                        selectTask={selectTask}
                                        setSelectTask={setSelectTask}
                                        itinerario={itinerario}
                                    />
                                </div>
                            </div>
                        : isAllowed() ?
                            <div className="capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500 space-y-2">
                                <div>
                                    {t("noEvents")}
                                </div>
                                <div>
                                    <VscFiles className="h-12 w-auto" />
                                </div>
                            </div> : <div className="capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500 space-y-2">
                                <div>
                                    {t("noData")}
                                </div>
                                <div>
                                    {t("waitOwner")}
                                </div>
                                <div>
                                    <VscFiles className="h-12 w-auto" />
                                </div>
                            </div>
                }
                {view !== "schema" && <AddEvent tasks={tasks} itinerario={itinerario} setSelectTask={setSelectTask} />}
            </div>
            {modalStatus && <Modal set={setModalStatus} state={modalStatus} classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalStatus} modal={modalStatus} title={t("visibility")} />
            </Modal>
            }
            {modalWorkFlow && <Modal set={setModalWorkFlow} state={modalWorkFlow} classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalWorkFlow} modal={modalWorkFlow} title={t("workflow")} />
            </Modal>
            }
            {modalCompartirTask && <Modal set={setModalCompartirTask} state={modalCompartirTask} classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalCompartirTask} modal={modalCompartirTask} title={t("share")} />
            </Modal>
            }
            {modalPlantilla && <Modal set={setModalPlantilla} state={modalPlantilla} classe={"w-[95%] md:w-[450px] h-[370px]"}>
                <WarningMessage setModal={setModalPlantilla} modal={modalPlantilla} title={t("template")} />
            </Modal>
            }
        </div>
    )
}


