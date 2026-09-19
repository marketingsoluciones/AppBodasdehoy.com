import { AuthContextProvider } from "../../../context"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useTranslation } from 'react-i18next';
import { Task } from "../../../utils/Interfaces";
import { useAllowed } from "../../../hooks/useAllowed";
import { eventDateAtHourZ } from "../../../utils/FormatTime";

export const AddEvent = ({ itinerario, tasks, setSelectTask }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()

    const addTask = async () => {
        try {
            let fecha = eventDateAtHourZ(event?.fecha, 6, 0)
            if (tasks?.length) {
                const item = tasks[tasks?.length - 1]
                const epoch = item?.fecha ? new Date(item.fecha).getTime() : NaN
                if (!isNaN(epoch)) {
                    fecha = new Date(epoch + (item.duracion || 0) * 60 * 1000)
                }
            }
            const addNewTask = await fetchApiEventos({
                query: queries.createTask,
                variables: {
                    evento_id: event._id,
                    development: config.development || "bodasdehoy",
                    task: {
                        itinerario_id: itinerario._id,
                        descripcion: itinerario.tipo === "itinerario" ? "Tarea nueva" : "Servicio nuevo",
                        ...(itinerario.tipo === "itinerario" && {
                            fecha: fecha.toISOString(),
                            horaActiva: true,
                            duracion: 30,
                            ...(!tasks?.length ? { hora: "06:00" } : {}),
                        }),
                    }
                },
                domain: config.domain
            })
            const task = ((addNewTask as any)?.task || addNewTask) as Task
            const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
            setEvent((prev) => ({
                ...prev,
                itinerarios_array: prev.itinerarios_array.map((it, i) =>
                    i !== f1 ? it : { ...it, tasks: [...it.tasks, task] }
                ),
            }))
            setSelectTask(task._id)
        } catch (error) {
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
