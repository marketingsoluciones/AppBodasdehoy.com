import { AuthContextProvider } from "../../../context"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useTranslation } from 'react-i18next';
import { Task } from "../../../utils/Interfaces";

export const AddEvent = ({ disable, itinerario, tasks }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const addTask = async () => {
        try {
            const item = tasks[tasks?.length - 1]
            const hora = item?.hora
            const duracion = item.duracion
            const hs = Math.trunc(duracion / 60)
            const ms = duracion - hs * 60
            let hNew = parseInt(hora?.split(":")[0]) + hs
            let mNew = parseInt(hora?.split(":")[1]) + ms
            if (mNew > 59) {
                hNew = hNew + 1
                mNew = mNew - 60
            }
            let horaNew = `${hNew < 10 ? `0${hNew}` : hNew}:${mNew < 10 ? `0${mNew}` : mNew}`
            if (hNew > 23) {
                horaNew = hora
            }
            const f = new Date(parseInt(event?.fecha))
            const y = f.getUTCFullYear()
            const m = f.getUTCMonth()
            const d = f.getUTCDate()
            const addNewTask = await fetchApiEventos({
                query: queries.createTask,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                    descripcion: "Tarea",
                    fecha: new Date(y, m, d, 8, 0),
                    //hora: horaNew,
                    duracion: 30
                },
                domain: config.domain
            })
            const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
            event.itinerarios_array[f1].tasks.push(addNewTask as Task)
            setEvent({ ...event })
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