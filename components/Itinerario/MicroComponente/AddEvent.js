import { AuthContextProvider } from "../../../context"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"

export const AddEvent = ({ disable, itinerario, tasks }) => {
    const { domain } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const addTask = async () => {
        try {
            const item = tasks[tasks?.length - 1]
            const hora = item?.hora
            const duracion = item.duracion
            const hs = Math.trunc(duracion / 60)
            const ms = duracion - hs * 60
            let hNew = parseInt(hora.split(":")[0]) + hs
            let mNew = parseInt(hora.split(":")[1]) + ms
            if (mNew > 59) {
                hNew = hNew + 1
                mNew = mNew - 60
            }
            let horaNew = `${hNew < 10 ? `0${hNew}` : hNew}:${mNew < 10 ? `0${mNew}` : mNew}`
            if (hNew > 23) {
                horaNew = hora
            }
            const addNewTask = await fetchApiEventos({
                query: queries.createTask,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario._id,
                    hora: horaNew,
                    duracion: 30
                },
                domain
            })
            setEvent((old) => {
                const f1 = old.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
                old.itinerarios_array[f1].tasks.push(addNewTask)
                return { ...old }
            })
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
                Añadir actividad
            </span>
        </div>
    )
}