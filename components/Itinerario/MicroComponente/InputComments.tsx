import { FC, useEffect, useRef, useState } from "react"
import { Textarea } from "./Textarea"
import { QuillEditor } from "./QuillEditor"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { ImageAvatar } from "../../Utils/ImageAvatar"
import { useNotification } from "../../../hooks/useNotification"
import { IoIosSend } from "react-icons/io";
import { PlusIcon } from "../../icons"

interface props {
  itinerario: Itinerary
  task: Task
}

export const InputComments: FC<props> = ({ itinerario, task }) => {
  const { user, config } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [value, setValue] = useState<string>()
  const [valir, setValir] = useState(false)
  const notification = useNotification()


  useEffect(() => {
    console.log(100049)
  }, [])


  useEffect(() => {
    if (value && value !== "<p><br></p>") {
      setValir(true)
    } else {
      setValir(false)
    }
  }, [value])

  useEffect(() => {
    setValue(undefined)
    setValir(false)
  }, [task._id])

  const handleCreateComment = () => {
    if (value) {
      fetchApiEventos({
        query: queries.createComment,
        variables: {
          eventID: event?._id,
          itinerarioID: itinerario?._id,
          taskID: task?._id,
          comment: value
        },
        domain: config.domain
      }).then((results: Comment) => {
        const f1 = event?.itinerarios_array.findIndex(elm => elm?._id === itinerario?._id)
        const f2 = event?.itinerarios_array[f1]?.tasks.findIndex(elm => elm?._id === task?._id)
        event?.itinerarios_array[f1]?.tasks[f2]?.comments.push(results)
        setEvent({ ...event })
        const asd = event.detalles_compartidos_array.filter(elem => ["edit", "view"].includes(elem.permissions.find(el => el.title === "servicios").value)).map(elem => elem.uid)
        let qwe = [...asd, event.usuario_id]
        const af1 = qwe.findIndex(elem => elem === user?.uid)
        if (af1 > -1) {
          qwe.splice(af1, 1)
        }
        const focused = `${window.location.pathname}?event=${event._id}&itinerary=${itinerario._id}&task=${task._id}&comment=${results._id}`
        notification({
          type: "user",
          message: ` ha escrito un comentario: ${value.slice(0, 50)}${value.length > 50 ? "..." : ""} | Evento ${event?.tipo}: <strong>${event?.nombre.toUpperCase()}</strong>`,
          uids: qwe,
          focused
        })
      })
      setValue("")
    }
  }

  return (
    <div className='bg-white flex items-center space-x-2 pt-2 px-2'>
      <div className='flex-1 relative'>
        {/* <Textarea value={value} setValue={setValue} /> */}
        <QuillEditor value={value} setValue={setValue} />
        <span onClick={handleCreateComment} className={`${valir ? "cursor-pointer font-semibold" : "text-gray-400"} absolute right-3 bottom-[10.5px]`}>
          <IoIosSend className={`h-[23px] w-auto ${valir ? "text-teal-500" : "text-gray-400"}`} />
        </span>
        {/* <div className="space-x-4 text-primary font-medium my-1 ">
          <span onClick={() => { setValue("") }} className={`${valir ? "cursor-pointer font-semibold" : "text-gray-300"}`}>Cancelar</span>
        </div> */}
      </div>
    </div>
  )
}