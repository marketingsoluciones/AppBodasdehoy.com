import { ComponentType, FC } from "react"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { MdOutlineDeleteOutline } from "react-icons/md"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { ImageAvatar } from "../../Utils/ImageAvatar"
import { Interweave } from "interweave"
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink"
import Link from "next/link"
import { detalle_compartidos_array } from "../../../utils/Interfaces"


interface props {
  itinerario: Itinerary
  task: Task
  item: Comment
  identifierDisabled?: boolean
}

export const ListComments: FC<props> = ({ itinerario, task, item, identifierDisabled }) => {
  const { user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const userAsd = [...event?.detalles_compartidos_array, event?.detalles_usuario_id, user]?.find(elem => elem?.uid === item?.uid) as detalle_compartidos_array

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
      {user && user.uid === item?.uid && <MdOutlineDeleteOutline
        onClick={() => {
          handleDelete()
        }}
        className="absolute w-5 h-5 cursor-pointer right-2 bottom-5 text-gray-600" />}
      <div className='flex space-x-2 items-start flex-1'>
        {!identifierDisabled
          ? <div
            className='bg-gray-300 w-8 h-8 rounded-full mt-1 flex items-center justify-center cursor-pointer'>
            <ImageAvatar user={userAsd} disabledTooltip />
          </div>
          : <div className="w-8 h-8" />}
        <div className="flex flex-col">
          <span className="text-[11px] my-2.5">{userAsd?.displayName}</span>
          <Interweave
            className="text-xs flex-1 pr-4 break-words"
            content={item?.comment}
            matchers={[
              new UrlMatcher('url', {}, replacesLink),
              new HashtagMatcher('hashtag')
            ]}
          />
        </div>
      </div>
      <span className='cursor-default justify-end text-[9px] font-medium flex-1 flex right-0 *-translate-x-full'>
        {new Date(item?.createdAt).toLocaleString()}
      </span>
    </div>
  )
}