import { AuthContextProvider } from "../../../context"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useTranslation } from 'react-i18next';
import { Task } from "../../../utils/Interfaces";
import { useAllowed } from "../../../hooks/useAllowed";

export const AddEvent = ({ itinerario, tasks, setSelectTask }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()

    const addTask = async () => {
        try {
            const f = new Date(parseInt(event.fecha))
            const fy = f.getUTCFullYear()
            const fm = f.getUTCMonth()
            const fd = f.getUTCDate()
            let newEpoch = new Date(fy, fm + 1, fd).getTime() + 7 * 60 * 60 * 1000
            if (tasks?.length) {
                const item = tasks[tasks?.length - 1]
                const epoch = new Date(item.fecha).getTime()
                newEpoch = epoch + item.duracion * 60 * 1000
            }
            const fecha = new Date(newEpoch)
            const addNewTask = await fetchApiEventos({
                query: queries.createTask,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                    descripcion: itinerario.tipo === "itinerario" ? "Tarea nueva" : "Servicio nuevo",
                    ...(itinerario.tipo === "itinerario" && { fecha: fecha }),
                    ...(itinerario.tipo === "itinerario" && { duracion: 30 })
                },
                domain: config.domain
            })
            const task = addNewTask as Task
            const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
            event.itinerarios_array[f1].tasks.push(task as Task)
            setEvent({ ...event })
            setSelectTask(task._id)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="flex items-center justify-center ">
            <div onClick={() => !isAllowed() ? ht() : addTask()} className={`block ${isAllowed() ? "text-primary" : "text-gray-300"} space-x-2  my-3 cursor-pointer hover:opacity-80 mb-20`}>
                <span>
                    +
                </span>
                <span >
                    {t("addactivity")}
                </span>
            </div>
        </div>
    )
}