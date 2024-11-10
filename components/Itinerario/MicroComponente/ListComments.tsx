import { ComponentType, FC, useState } from "react"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { MdOutlineDeleteOutline } from "react-icons/md"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { ImageAvatar } from "../../Utils/ImageAvatar"
import { Interweave } from "interweave"
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink"
import Link from "next/link"

interface props {
  itinerario: Itinerary
  task: Task
  item: Comment
  setConfirmation: any
}

export const ListComments: FC<props> = ({ itinerario, task, item, setConfirmation }) => {
  const { user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [values, setValues] = useState({ value: "" })
  const [showUser, setShowUser] = useState(false)

  const handleDelete = () => {
    fetchApiEventos({
      query: queries.deleteComment,
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        taskID: task._id,
        commentID: item._id
      }
    }).then((result) => {
      const f1 = event.itinerarios_array.findIndex(elm => elm._id === itinerario._id)
      const f2 = event.itinerarios_array[f1].tasks.findIndex(elm => elm._id === task._id)
      const f3 = event.itinerarios_array[f1].tasks[f2].comments.findIndex(elm => elm._id === item._id)
      event.itinerarios_array[f1].tasks[f2].comments.splice(f3, 1)
      setEvent({ ...event })
    })
  }

  const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <Link href={props?.url}>
        <a className="text-xs break-all underline" target="_blank"  >{props?.children}</a>
      </Link>
    )
  };

  return (
    <div className={`flex flex-col w-full px-2 py-1 border-t-[1px] hover:bg-gray-100 relative`}>
      {/* {showUser && <div className="absolute z-50 flex w-64 h-16 bg-white shadow-lg rounded-md border-2 px-2 space-x-2 items-center -translate-y-full">
        <div className='bg-gray-300 w-10 h-10 rounded-full flex items-center justify-center text-2xl'>
          <ImageAvatar user={event.usuario_id === item.uid
            ? user
            : event?.detalles_compartidos_array?.find(elem => elem.uid === item.uid)
          } />
        </div>
        <div className="w-[calc(100%-50px)]">
          <div className="flex w-full flex-col text-[11px] -space-y-1.5">
            <span className="truncate">{item?.user?.name} </span>
            <span className="truncate">{item?.user?.email}</span>
            <span className="truncate">{item?.user?.position}</span>
          </div>
        </div>
      </div>} */}
      {user.uid === item?.uid && <MdOutlineDeleteOutline
        onClick={() => {
          handleDelete()
          //setConfirmation({ state: true, handleDelete })
        }}
        className="absolute w-5 h-5 cursor-pointer right-2 bottom-5 text-gray-600" />}
      <div className='flex space-x-2 items-start flex-1'>
        <div
          onMouseOver={() => setShowUser(true)}
          onMouseOut={() => setShowUser(false)}
          className='bg-gray-300 w-8 h-8 rounded-full mt-1 flex items-center justify-center cursor-pointer'>
          <ImageAvatar user={[...event?.detalles_compartidos_array, event?.detalles_usuario_id, user]?.find(elem => elem?.uid === item?.uid)} />
        </div>
        <Interweave
          className="text-xs flex-1 pr-4 break-words"
          content={item?.comment}
          matchers={[
            new UrlMatcher('url', {}, replacesLink),
            new HashtagMatcher('hashtag')
          ]}
        />
        {/* <p className='bg-blue-100* p-2 flex-1 normal-case whitespace-pre-line'>{item?.comment}</p> */}
      </div>
      <span className='justify-end text-[10px] -mt-2 font-medium flex-1 flex right-0 *-translate-x-full'>
        {new Date(item?.createdAt).toLocaleString()}
      </span>
    </div>
  )
}