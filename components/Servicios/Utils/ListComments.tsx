import { ComponentType, FC, HTMLAttributes, useEffect } from "react"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { ImageAvatar } from "../../Utils/ImageAvatar"
import { Interweave } from "interweave"
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink"
import Link from "next/link"
import { detalle_compartidos_array } from "../../../utils/Interfaces"
import { useRouter } from "next/router"
import { TempPastedAndDropFile } from "../../Itinerario/MicroComponente/ItineraryPanel"
import { FileIconComponent } from "../../Itinerario/MicroComponente/FileIconComponent"
import { CgSoftwareDownload } from "react-icons/cg"
import { deleteObject, getStorage, listAll, ref } from "firebase/storage"
import { downloadFile } from "../../Utils/storages"
import { useTranslation } from "react-i18next"
import { useToast } from "../../../hooks/useToast"
import { useAllowed } from "../../../hooks/useAllowed"

interface props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary
  task: Task
  item: Comment
  identifierDisabled?: boolean
  tempPastedAndDropFiles?: TempPastedAndDropFile[]
  nicknameUnregistered?: string
}

export const ListComments: FC<props> = ({ itinerario, task, item, identifierDisabled, tempPastedAndDropFiles, nicknameUnregistered, ...props }) => {
  const { user, config } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
  const router = useRouter()
  const userAsd = event?.detalles_compartidos_array
    ? [...event?.detalles_compartidos_array, event?.detalles_usuario_id, user]?.find(elem => elem?.uid === item?.uid) as detalle_compartidos_array
    : undefined
  const temp = tempPastedAndDropFiles?.find(elem => elem?.commentID === item?._id)?.files
  const storage = getStorage();
  const { t } = useTranslation();
  const toast = useToast()

  useEffect(() => {
    if (router.query?.task) {
      document.getElementById(`${router.query.task}`)?.scrollIntoView({ behavior: 'smooth' });
    }
    if (router.query?.comment) {
      router.push(`${window.location.origin}${window.location.pathname}`)
    }
  }, [router])

  const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <Link href={props?.url}>
        <a className="text-xs break-all underline" target="_blank"  >{props?.children}</a>
      </Link>
    )
  };

  return (
    <div className={`flex flex-col w-full px-2 py-1 border-t-[1px] hover:bg-gray-100 relative`} {...props}>
      <div className='flex flex-1 items-start w-full'>
        <div className="w-8 h-8">
          {!identifierDisabled
            ? <div
              className='bg-gray-300 w-8 h-8 rounded-full mt-1 flex items-center justify-center cursor-pointer'>
              <ImageAvatar user={userAsd} disabledTooltip />
            </div>
            : <div className="w-8 h-8" />}
        </div>
        <div className="flex flex-col flex-1 px-1.5 w-[85%]">
          <span className="text-[11px] mt-2.5 font-semibold my-emoji">{userAsd?.displayName ? userAsd.displayName : item?.nicknameUnregistered}</span>
          <div className="grid grid-cols-2 gap-3 max-w-[280px] ">
            {(temp ? temp : item?.attachments)?.map((elem: any, idx: number) => {
              return <div key={idx} className="bg-gray-300 col-span-1 flex flex-col items-center w-[130px] h-[80px] rounded-lg overflow-hidden" >
                <div className="flex-1 w-full flex justify-center items-center relative">
                  {!elem?.loading && <div className="absolute z-20 right-3 top-2 text-gray-600 hover:text-gray-800 cursor-pointer"
                    onClick={() => {
                      downloadFile(storage, `event-${event._id}//itinerary-${itinerario._id}//task-${task._id}//comment-${item._id}//${elem?.name ?? elem?.file?.name}`)
                        .catch((error) => toast("error", `${t("Ha ocurrido un error")}`))
                    }} >
                    <CgSoftwareDownload className="w-6 h-6" />
                  </div>}
                  {elem?.loading &&
                    <>
                      <div className="bg-white absolute w-full h-full opacity-25 flex justify-center items-center" />
                      <div className="absolute loader ease-linear rounded-full border-[3px] border-black border-opacity-35 w-4 h-4" />
                    </>
                  }
                  <div className="w-full h-[54px] flex flex-col items-center justify-center">
                    <FileIconComponent extension={(elem?.name ?? elem?.file?.name)?.split(".")?.slice(-1)[0]} className="w-10 h-10 mb-2 border-[1px] border-gray-300 rounded-[5px]" />
                  </div>
                </div>
                <div className="w-full flex flex-col items-center px-2 cursor-default">
                  <span className="w-full text-[10px] truncate text-center">{elem?.name ?? elem?.file?.name}</span>
                  <span className="text-gray-800 text-[9px] select-none">{Math.trunc((elem?.size ?? elem?.file?.size) / 1024)} K</span>
                </div>
              </div>
            }
            )}
          </div>
          <div className="w-[65vw] md:w-full overflow-hidden text-ellipsis whitespace-nowrap" >
            <Interweave
              className="text-xs transition-all my-emoji"
              content={item?.comment}
              matchers={[
                new UrlMatcher('url', {}, replacesLink),
                new HashtagMatcher('hashtag')
              ]}
            />
          </div>
        </div>
      </div>
      <span className='cursor-default justify-end text-[9px] font-medium flex-1 flex right-0'>
        {new Date(item?.createdAt).toLocaleString()}
      </span>
      <style jsx>{`
      .whitespace-pre {
        white-space: pre-wrap;
      }
      `}</style>
      <style jsx>
        {`
                .loader {
                    border-top-color:  ${config?.theme?.primaryColor};
                    -webkit-animation: spinner 1.5s linear infinite;
                    animation: spinner 1.5s linear infinite;
                }
                @-webkit-keyframes spinner {
                    0% {
                    -webkit-transform: rotate(0deg);
                    }
                    100% {
                    -webkit-transform: rotate(360deg);
                    }
                }
                @keyframes spinner {
                    0% {
                    transform: rotate(0deg);
                    }
                    100% {
                    transform: rotate(360deg);
                    }
                }
                `}
      </style>
    </div>
  )
}
