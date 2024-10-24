import { AuthContextProvider } from "../../../context"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useTranslation } from 'react-i18next';
import { Task } from "../../../utils/Interfaces";

export const AddEvent = ({ disable, itinerario, tasks, setSelectTask }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()

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
                    descripcion: "Tarea nueva",
                    fecha,
                    duracion: 30
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
        <div onClick={() => disable ? null : addTask()} className=" text-primary flex space-x-2 items-center justify-center my-3 cursor-pointer hover:text-pink-600">
            <span>
                +
            </span>
            <span >
                {t("addactivity")}
            </span>
        </div>
    )
}