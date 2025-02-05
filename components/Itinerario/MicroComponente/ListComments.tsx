import { ComponentType, FC, HTMLAttributes, useEffect } from "react"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { MdOutlineDeleteOutline } from "react-icons/md"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { ImageAvatar } from "../../Utils/ImageAvatar"
import { Interweave } from "interweave"
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink"
import Link from "next/link"
import { detalle_compartidos_array } from "../../../utils/Interfaces"
import { useRouter } from "next/router"

interface props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary
  task: Task
  item: Comment
  identifierDisabled?: boolean
}

export const ListComments: FC<props> = ({ itinerario, task, item, identifierDisabled, ...props }) => {
  const { user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const router = useRouter()
  const userAsd = [...event?.detalles_compartidos_array, event?.detalles_usuario_id, user]?.find(elem => elem?.uid === item?.uid) as detalle_compartidos_array

  useEffect(() => {
    if (router.query?.task) {
      document.getElementById(`${router.query.task}`)?.scrollIntoView({ behavior: 'smooth' });
    }
    if (router.query?.comment) {
      router.push(`${window.location.origin}${window.location.pathname}`)
    }
  }, [router])

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
    <div className={`flex flex-col w-full px-2 py-1 border-t-[1px] hover:bg-gray-100 relative`} {...props}>
      <div className='flex flex-1 items-start'>
        <div className="w-8 h-8">
          {!identifierDisabled
            ? <div
              className='bg-gray-300 w-8 h-8 rounded-full mt-1 flex items-center justify-center cursor-pointer'>
              <ImageAvatar user={userAsd} disabledTooltip />
            </div>
            : <div className="w-8 h-8" />}
        </div>
        <div className="flex flex-col flex-1 px-1.5 w-[85%]">
          <span className="text-[11px] mt-2.5 font-semibold my-emoji">{userAsd?.displayName}</span>
          <div>
            <Interweave
              className="text-xs transition-all *whitespace-pre my-emoji"
              content={item?.comment}
              matchers={[
                new UrlMatcher('url', {}, replacesLink),
                new HashtagMatcher('hashtag')
              ]}
            />
          </div>
        </div>
        <div className="w-5">
          {user && user.uid === item?.uid && <MdOutlineDeleteOutline
            onClick={() => {
              handleDelete()
            }}
            className="absolute w-5 h-5 cursor-pointer right-2 bottom-5 text-gray-600" />}
        </div>
      </div>
      <span className='cursor-default justify-end text-[9px] font-medium flex-1 flex right-0 *-translate-x-full'>
        {new Date(item?.createdAt).toLocaleString()}
      </span>
      <style jsx>{`
      .whitespace-pre {
        white-space: pre-wrap;
      }
      `}</style>
    </div>
  )
}

