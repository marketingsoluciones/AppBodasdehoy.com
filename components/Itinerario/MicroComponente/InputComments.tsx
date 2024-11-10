import { FC, useEffect, useState } from "react"
import { Textarea } from "./Textarea"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { ImageAvatar } from "../../Utils/ImageAvatar"

interface props {
  itinerario: Itinerary
  task: Task
}

export const InputComments: FC<props> = ({ itinerario, task }) => {
  const { user, config } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [value, setValue] = useState<string>()
  const [valir, setValir] = useState(false)

  useEffect(() => {
    if (value) {
      setValir(true)
    } else {
      setValir(false)
    }
  }, [value])

  const handleCreateComment = () => {
    if (value) {
      fetchApiEventos({
        query: queries.createComment,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          comment: value
        },
        domain: config.domain
      }).then((results: Comment) => {
        const f1 = event.itinerarios_array.findIndex(elm => elm._id === itinerario._id)
        const f2 = event.itinerarios_array[f1].tasks.findIndex(elm => elm._id === task._id)
        event.itinerarios_array[f1].tasks[f2].comments.push(results)
        setEvent({ ...event })
      })
      setValue("")
    }
  }

  return (
    <div className='flex space-x-2 px-2'>
      <div className='bg-gray-300 w-8 h-8 rounded-full mt-1 flex items-center justify-center'>
        <ImageAvatar user={user} />
        {/* {user?.name?.split(" ").map(e => e.slice(0, 1)).join("")} */}
      </div>
      <div className='flex-1'>
        <Textarea value={value} setValue={setValue} />
        <div className="space-x-4 text-primary font-medium my-1">
          <span onClick={handleCreateComment} className={`${valir ? "cursor-pointer font-semibold" : "text-gray-300"}`}>Enviar</span>
          <span onClick={() => { setValue("") }} className={`${valir ? "cursor-pointer font-semibold" : "text-gray-300"}`}>Cancelar</span>
        </div>
      </div>
    </div>
  )
}