
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
import { LiaLinkSolid } from "react-icons/lia";
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
import { useNotification } from "../../../hooks/useNotification";
import { LuCopy } from "react-icons/lu";
import { EventsGroupContextProvider } from "../../../context";
import { t } from "i18next";
import { HiArrowSmallRight } from "react-icons/hi2";
import Select from 'react-select';


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
    const notification = useNotification()
    const [showModalCopiarCard, setShowModalCopiarCard] = useState({ state: false, data: null })

    console.log("itinerario", showModalCopiarCard.state)

    const optionsItineraryButtonBox: OptionsSelect[] = [
        {
            value: "edit",
            icon: <PencilEdit className="w-5 h-5" />,
            title: "editar",
            onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setShowEditTask({ values, state: !showEditTask.state }) : setShowEditTask({ values, state: ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? !showEditTask.state : null : !showEditTask.state }),
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
            onClick: (values: Task) => !isAllowed() ? ht() : user.uid === event.usuario_id ? handleAddSpectatorView(values) : ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? handleAddSpectatorView(values) : null : handleAddSpectatorView(values),
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
            value: "Copy",
            icon: <LuCopy className="w-5 h-5" />,
            title: "Duplicar",
            vew: "tasks",
            onClick: (values: Task, itinerario: Itinerary) => !isAllowed() ? ht() : setShowModalCopiarCard({ state: true, data: values }),
        },
        {
            value: "delete",
            icon: <MdOutlineDeleteOutline className="w-5 h-5" />,
            title: "borrar",
            onClick: (values: Task, itinerario: Itinerary) => !isAllowed() ? ht() : user.uid === event.usuario_id ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }) : ["/itinerario"].includes(window?.location?.pathname) ? values?.estatus === false || values?.estatus === null || values?.estatus === undefined ? setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }) : null : setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }),
            vew: "all"
        },
        {
            value: "estatus",
            icon: <TbLock className="w-5 h-5" />,
            getIcon: (valor: boolean) => {
                if (valor) {
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
                    const asd = event.detalles_compartidos_array.filter(elem => ["edit", "view"].includes(elem.permissions.find(el => el.title === "itinerari").value)).map(elem => elem.uid)
                    let qwe = [...asd, event.usuario_id]
                    const af1 = qwe.findIndex(elem => elem === user?.uid)
                    if (af1 > -1) {
                        qwe.splice(af1, 1)
                    }
                    const focused = `${window.location.pathname}?event=${event._id}&itinerary=${itinerario._id}&task=${values._id}`
                    notification({
                        type: "user",
                        message: ` ha cambiado el estatus de la actividad a: ${values.estatus === false ? "Desbloqueado" : "Bloqueado"} | Evento ${event?.tipo}: <strong>${event?.nombre.toUpperCase()}</strong>`,
                        uids: qwe,
                        focused
                    })
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
            {
                showModalCopiarCard.state &&
                <div className={"absolute top-0 left-0 w-full h-full. z-50 flex justify-center"}>
                    <ModalDupliucateCard setShowModalCopiarCard={setShowModalCopiarCard} showModalCopiarCard={showModalCopiarCard} />
                </div>
            }

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


const ModalDupliucateCard = ({ setShowModalCopiarCard, showModalCopiarCard }) => {
    const { event, setEvent } = EventContextProvider()
    const { eventsGroup, setEventsGroup } = EventsGroupContextProvider();
    const { config, user } = AuthContextProvider()
    const [filteredEventsGroup, setFilteredEventsGroup] = useState([])
    const [selectedOption, setSelectedOption] = useState('');
    const evento = eventsGroup.find(elem => elem.nombre === selectedOption)
    const toast = useToast();

    useEffect(() => {
        setFilteredEventsGroup(eventsGroup?.filter(elem =>
            elem.usuario_id === user.uid ||
            (elem.usuario_id !== user.uid && elem.permissions?.some(permission => permission.title === "servicios" && permission.value === "edit"))
        ))
    }, [eventsGroup])

    const handleDuplicateCard = async () => {
        /* const result = await fetchApiEventos({
            query: queries.duplicateItinerario,
            variables: {
                eventID: event._id,
                itinerarioID: modalDuplicate.data?._id,
                eventDestinationID: evento._id,
            },
            domain: config.domain
        })
        if (evento._id === event._id) {
            setEvent(old => {
                old.itinerarios_array.push(result as Itinerary)
                return { ...old }
            })
        }
        if (evento._id !== event._id) {
            const f1 = eventsGroup.findIndex(elem => elem._id === evento._id)
            eventsGroup[f1].itinerarios_array.push(result as Itinerary)
            setEventsGroup([...eventsGroup])
        }
        setModalDuplicate({ state: false })
        toast("success", t("successful")); */
        console.log("duplicar")
    }

    const options = event?.itinerarios_array?.filter((elem) => elem.tipo === "servicios")?.map((elem) => ({
        value: elem.title,
        label: elem.title,
    }));

    const handleSelectChangee = (selectedOption) => {
        setSelectedOption(selectedOption.value);
    };
    const [selectedTab, setSelectedTab] = useState(0);
    return (
        <div className="w-[670px] bg-white rounded-xl shadow-md ">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 p-4">
                <h2 className="text-lg font-semibold capitalize">Copiar  Card</h2>
                <button className="text-gray-500" onClick={() => setShowModalCopiarCard(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 3.293a1 1 0 0 1 1.414 0L10 8.586l5.293-5.293a1 1 0 1 1 1.414 1.414L11.414 10l5.293 5.293a1 1 0 1 1-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L8.586 10 3.293 4.707a1 1 0 0 1 0-1.414z" />
                    </svg>
                </button>
            </div>
            <div className=" p-8">
                <div className="flex  ">
                    <div onClick={() => setSelectedTab(0)} className={`border-l border-t px-2  text-azulCorporativo border-gray-300 cursor-pointer rounded-tl-md hover:bg-gray-100 ${selectedTab === 0 ? "bg-gray-200" : ""}`}>
                        Copiar
                    </div>
                    <div onClick={() => setSelectedTab(1)} className={`border-r border-t px-2  text-azulCorporativo border-gray-300 cursor-pointer rounded-tr-md hover:bg-gray-100  ${selectedTab === 1 ? "bg-gray-200" : ""}`}>
                        Vincular
                    </div>
                </div>

                {selectedTab === 0 &&
                    <div className="grid grid-cols-11 gap-4  border px-3 py-6 rounded-r-md rounded-bl-md">
                        <div className="col-span-5">
                            <label className="text-sm text-gray-500 capitalize">Card a copiar</label>
                            <div className="w-full border border-gray-300 cursor-default rounded-md p-[6.5px] text-azulCorporativo capitalize">
                                {showModalCopiarCard.data?.descripcion}
                            </div>
                        </div>
                        <div className="col-span-1 flex items-center justify-center mt-5">
                            <HiArrowSmallRight className="w-5 h-5" />
                        </div>
                        <div className="col-span-5">
                            <label className="text-sm text-gray-500 capitalize">Copiar en</label>
                            <Select
                                options={options}
                                onChange={handleSelectChangee}
                                classNamePrefix="react-select"
                                placeholder={t("seleccionaOpcion") + "..."}
                            />
                        </div>
                    </div>

                }

                {selectedTab === 1 &&
                    <div className="grid grid-cols-11 gap-4 mt-2- border px-3 py-6 rounded-r-md rounded-bl-md">
                        <div className="col-span-5">
                            <label className="text-sm text-gray-500 capitalize">Card a Vincular</label>
                            <div className="w-full border border-gray-300 cursor-default rounded-md p-[6.5px] text-azulCorporativo capitalize">
                                {showModalCopiarCard.data?.descripcion}
                            </div>
                        </div>
                        <div className="col-span-1 flex items-center justify-center mt-5">
                            <HiArrowSmallRight className="w-5 h-5" />
                        </div>
                        <div className="col-span-5">
                            <label className="text-sm text-gray-500 capitalize">Vincular en</label>
                            <Select
                                options={options}
                                onChange={handleSelectChangee}
                                classNamePrefix="react-select"
                                placeholder={t("seleccionaOpcion") + "..."}
                            />
                        </div>
                    </div>
                }
            </div>
            <div className="flex justify-end gap-4 border-t border-gray-300 px-4 pb-4 bg-gray-100">
                <button onClick={() => setShowModalCopiarCard(false)} className="bg-gray-400 text-white rounded-md py-2 px-4 mt-4">{t("cancel")}</button>
                <button onClick={() => handleDuplicateCard()} className="bg-primary text-white rounded-md py-2 px-4 mt-4">{t("duplicar")}</button>
            </div>
        </div>

    )
}